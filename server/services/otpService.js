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
    subject: `🔐 ${otp} is your AADAIUDAI verification code`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #8b1538; margin: 0; font-size: 28px; letter-spacing: 2px;">AADAIUDAI</h1>
          <p style="color: #666; font-style: italic;">Premium Indian Ethnic Wear</p>
        </div>
        <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <h2 style="color: #333; margin-top: 0; text-align: center;">Verify Your Identity</h2>
          <p style="color: #555; line-height: 1.6; text-align: center;">To access your account and complete your purchase, please use the following one-time password:</p>
          <div style="background: #fff5f5; border: 2px dashed #8b1538; padding: 20px; text-align: center; border-radius: 10px; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #8b1538; letter-spacing: 12px; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #777; font-size: 14px; text-align: center;">This code will expire in <strong>5 minutes</strong> for your security.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="text-align: center; padding-top: 20px; color: #aaa; font-size: 12px;">
          &copy; 2026 AADAIUDAI. All rights reserved.
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
