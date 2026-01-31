/**
 * Email OTP Service - Uses Nodemailer to send OTP via email
 * For Gmail: Enable "App Passwords" in Google Account settings
 */
const nodemailer = require('nodemailer');
const OTPSession = require('../models/OTPSession');
const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

let etherealAccount = null;

// Create email transporter - uses Ethereal (fake SMTP) when no credentials
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Use Ethereal for dev - creates test account, emails viewable at preview URL
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal test account created. Preview URLs will be logged.');
  }
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: etherealAccount.user, pass: etherealAccount.pass },
  });
};

const sendOTPEmail = async (email, otp) => {
  let transporter;
  try {
    transporter = await createTransporter();
  } catch (err) {
    return { success: false, error: err.message };
  }

  const fromEmail = process.env.EMAIL_USER || (etherealAccount && etherealAccount.user) || 'noreply@aadaiudai.com';
  const mailOptions = {
    from: `"AADAIUDAI" <${fromEmail}>`,
    to: email,
    subject: 'Your AADAIUDAI Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b1538, #6b0f2a); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">AADAIUDAI</h1>
          <p style="color: #e8d48b; margin: 5px 0 0;">Indian Ethnic Dress Shop</p>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #8b1538; margin-top: 0;">Verification Code</h2>
          <p style="color: #555;">Your one-time password (OTP) for login is:</p>
          <div style="background: #f5e6d3; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #8b1538; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #555;">This code is valid for <strong>5 minutes</strong>.</p>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // For Ethereal, log preview URL so user can view the "sent" email
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Preview URL:', previewUrl);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

const createOTPSession = async (email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete any existing OTP sessions for this email
  await OTPSession.deleteMany({ email });
  const session = await OTPSession.create({ email, otp, expiresAt });

  // Try to send email
  const emailResult = await sendOTPEmail(email, otp);

  if (emailResult.success) {
    console.log(`\n📧 OTP sent via email to ${email}\n`);
  } else {
    // Fallback: Log to console (for dev/testing)
    console.log(`\n📧 OTP for ${email}: ${otp} (valid for 5 min)`);
    console.log(`   (Email not sent: ${emailResult.error})`);
    if (!process.env.EMAIL_USER) {
      console.log(`   Configure EMAIL_USER and EMAIL_PASS in .env for real email\n`);
    }
  }

  return { sessionId: session._id, emailSent: emailResult.success, otp };
};

const verifyOTP = async (email, otp) => {
  const session = await OTPSession.findOne({
    email: email.toLowerCase(),
    otp,
    expiresAt: { $gt: new Date() }
  });

  if (!session) return { valid: false };

  session.verified = true;
  await session.save();

  // Clean up after successful verification
  await OTPSession.deleteMany({ email: email.toLowerCase() });

  return { valid: true };
};

module.exports = { createOTPSession, verifyOTP };
