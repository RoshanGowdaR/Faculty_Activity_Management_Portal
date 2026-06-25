const supabase = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetEmail } = require('../config/email');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '1d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, employee_id, department, designation } = req.body;

    const { data: userExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},employee_id.eq.${employee_id}`)
      .maybeSingle();

    if (checkError) throw checkError;

    if (userExists) {
      return res.status(400).json({ message: 'User with this email or Employee ID already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password_hash,
        employee_id,
        department,
        designation,
        role: 'lecturer',
        status: 'pending'
      }])
      .select()
      .single();

    if (createError) throw createError;

    await supabase.from('audit_logs').insert([{
      action: 'Register',
      target: `User ${email}`,
      user_id: user.id
    }]);

    res.status(201).json({
      message: 'Registration successful. Waiting for admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error: loginError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (loginError) throw loginError;

    if (!user) {
      await supabase.from('audit_logs').insert([{
        action: 'Login Failed',
        target: `Email ${email}`
      }]);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Direct bcrypt compare
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await supabase.from('audit_logs').insert([{
        action: 'Login Failed',
        target: `User ${email}`,
        user_id: user.id
      }]);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'lecturer' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }
    if (user.role === 'lecturer' && user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account registration has been rejected by admin' });
    }

    await supabase.from('audit_logs').insert([{
      action: 'Login Success',
      target: `User ${email}`,
      user_id: user.id
    }]);

    res.json({
      token: generateToken(user.id, user.role),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        department: user.department,
        designation: user.designation,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select('id, name, email, employee_id, department, designation, role, status, created_at')
      .eq('id', req.user.id)
      .single();

    if (getError) throw getError;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (getError) throw getError;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatePayload = {
      name: req.body.name || user.name,
      department: req.body.department || user.department,
      designation: req.body.designation || user.designation,
      employee_id: req.body.employee_id || user.employee_id
    };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password_hash = await bcrypt.hash(req.body.password, salt);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from('audit_logs').insert([{
      action: 'Update Profile',
      target: `User ${user.email}`,
      user_id: user.id
    }]);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        employee_id: updatedUser.employee_id,
        department: updatedUser.department,
        designation: updatedUser.designation,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const reset_password_expires = new Date(Date.now() + 3600000).toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({ reset_password_token: resetToken, reset_password_expires })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await supabase.from('audit_logs').insert([{
      action: 'Password Reset Request',
      target: `User ${email}`,
      user_id: user.id
    }]);

    const emailResult = await sendResetEmail(email, resetToken);

    res.json({
      message: 'If a matching account exists, a password reset link has been sent to the registered email.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('reset_password_token', token)
      .gt('reset_password_expires', new Date().toISOString())
      .maybeSingle();

    if (findError) throw findError;
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { error: resetError } = await supabase
      .from('users')
      .update({
        password_hash,
        reset_password_token: null,
        reset_password_expires: null
      })
      .eq('id', user.id);

    if (resetError) throw resetError;

    await supabase.from('audit_logs').insert([{
      action: 'Password Reset Success',
      target: `User ${user.email}`,
      user_id: user.id
    }]);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
