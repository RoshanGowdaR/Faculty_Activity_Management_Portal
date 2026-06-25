const supabase = require('../config/db');
const path = require('path');
const axios = require('axios');
const archiver = require('archiver');

exports.getPendingUsers = async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'lecturer')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    await supabase.from('notifications').insert([{
      user_id: user.id,
      message: 'Your registration has been approved. You can now log in and manage your activities.'
    }]);

    await supabase.from('audit_logs').insert([{
      action: 'Approve User',
      target: `User ${user.email}`,
      user_id: req.user.id
    }]);

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ status: 'rejected' })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    await supabase.from('notifications').insert([{
      user_id: user.id,
      message: 'Your registration request has been rejected by the administrator.'
    }]);

    await supabase.from('audit_logs').insert([{
      action: 'Reject User',
      target: `User ${user.email}`,
      user_id: req.user.id
    }]);

    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'lecturer')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const { lecturer_id, department, category, academic_year, start_date, end_date, search } = req.query;

    let query = supabase
      .from('submissions')
      .select('*, user_id:users!inner(id, name, email, employee_id, department, designation)');

    if (lecturer_id) {
      query = query.eq('user_id', lecturer_id);
    }
    if (department) {
      query = query.eq('users.department', department);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }
    if (start_date) {
      query = query.gte('submitted_at', new Date(start_date).toISOString());
    }
    if (end_date) {
      query = query.lte('submitted_at', new Date(end_date).toISOString());
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: list, error } = await query.order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifySubmission = async (req, res) => {
  try {
    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'verified' })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    await supabase.from('notifications').insert([{
      user_id: submission.user_id,
      message: `Your submission "${submission.title}" has been verified and locked.`
    }]);

    await supabase.from('audit_logs').insert([{
      action: 'Verify Submission',
      target: `Submission ID: ${submission.id} (${submission.title})`,
      user_id: req.user.id
    }]);

    res.json({ message: 'Submission verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    await supabase.from('notifications').insert([{
      user_id: submission.user_id,
      message: `Your submission "${submission.title}" was rejected. Please review details and resubmit.`
    }]);

    await supabase.from('audit_logs').insert([{
      action: 'Reject Submission',
      target: `Submission ID: ${submission.id} (${submission.title})`,
      user_id: req.user.id
    }]);

    res.json({ message: 'Submission rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*, user_id:users(name, email, role)')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadZip = async (req, res) => {
  try {
    const { lecturer_id, department, category, academic_year } = req.query;

    let query = supabase
      .from('submissions')
      .select('*, users!inner(name, department)');

    if (lecturer_id) query = query.eq('user_id', lecturer_id);
    if (department) query = query.eq('users.department', department);
    if (category) query = query.eq('category', category);
    if (academic_year) query = query.eq('academic_year', academic_year);

    const { data: list, error } = await query;
    if (error) throw error;

    if (!list || list.length === 0) {
      return res.status(400).json({ message: 'No submissions found matching criteria to download.' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`submissions-${Date.now()}.zip`);
    archive.pipe(res);

    for (const sub of list) {
      try {
        const fileResponse = await axios.get(sub.file_path, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(fileResponse.data);

        const cleanCategory = sub.category.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanName = sub.users.name.replace(/[^a-zA-Z0-9]/g, '_');
        const ext = path.extname(sub.file_path.split('?')[0]);
        const filename = `${cleanName}-${cleanCategory}-${sub.title.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

        archive.append(buffer, { name: `${cleanCategory}/${filename}` });
      } catch (err) {
        console.error(`Failed to download file for zip: ${sub.file_path}`, err.message);
      }
    }

    await supabase.from('audit_logs').insert([{
      action: 'Bulk Download Files',
      target: `Criteria - Lecturer: ${lecturer_id || 'All'}, Dept: ${department || 'All'}, Cat: ${category || 'All'}`,
      user_id: req.user.id
    }]);

    archive.finalize();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};
