const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetToken, clientOrigin) => {
  const base = clientOrigin ? clientOrigin.replace(/\/$/, '') : 'http://localhost:5173';
  const resetUrl = `${base}/reset-password/${resetToken}`;
  
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('✉️ [Email Service]: Using configured custom SMTP server.');
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`✉️ [Email Service]: No custom SMTP configured. Using Ethereal sandbox: User = ${testAccount.user}`);
    } catch (err) {
      console.error('❌ [Email Service]: Failed to create Ethereal test account:', err.message);
      console.log(`\n--- PASSWORD RESET LINK (FALLBACK) ---`);
      console.log(`To: ${email}`);
      console.log(`Link: ${resetUrl}`);
      console.log(`-------------------------------------\n`);
      return { success: true, fallback: true, link: resetUrl };
    }
  }

  const mailOptions = {
    from: `"Faculty Activity Portal" <noreply@college.edu>`,
    to: email,
    subject: 'Password Reset Request - Faculty Portal',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your account on the Faculty Activity Management Portal.</p>
        <p>Please click the button below to choose a new password. This link is valid for 1 hour.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.85rem;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #6366f1; font-size: 0.85rem; word-break: break-all;">${resetUrl}</p>
        <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #94a3b8; font-size: 0.8rem;">If you did not request this reset, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Email Service]: Email sent to ${email}. Message ID: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ [Email Service]: Ethereal Sandbox Email Preview Link: ${previewUrl}`);
      return { success: true, previewUrl };
    }

    return { success: true };
  } catch (err) {
    console.error('❌ [Email Service]: Failed to send email:', err.message);
    console.log(`\n--- PASSWORD RESET LINK (FALLBACK) ---`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`-------------------------------------\n`);
    return { success: true, fallback: true, link: resetUrl };
  }
};

module.exports = { sendResetEmail };
