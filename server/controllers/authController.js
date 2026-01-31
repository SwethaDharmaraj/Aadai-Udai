const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createOTPSession, verifyOTP } = require('../services/otpService');
const { body, validationResult } = require('express-validator');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.sendOTP = [
  body('email').trim().isEmail().withMessage('Valid email address required').normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      const result = await createOTPSession(email.toLowerCase());
      const response = {
        message: result.emailSent ? 'OTP sent to your email' : 'Dev Mode: Use OTP from response or console',
        emailSent: result.emailSent
      };

      // Include OTP in response ONLY in development mode for easier debugging/testing
      if (process.env.NODE_ENV === 'development') {
        response.devOtp = result.otp;
        console.log(`[DEV] OTP for ${email}: ${result.otp}`);
      }

      res.json(response);
    } catch (err) {
      console.error('Send OTP error:', err);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
];

exports.verifyOTP = [
  body('email').trim().isEmail().normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, otp } = req.body;
      const normalizedEmail = email.toLowerCase();

      // Admin bypass for development/testing
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@aadaiudai.com';
      const adminOTP = process.env.ADMIN_OTP_CODE || '123456';

      if (normalizedEmail === adminEmail && otp === adminOTP) {
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          user = await User.create({ email: normalizedEmail, role: 'admin', name: 'Admin' });
        } else if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
        const token = generateToken(user._id, user.role);
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
        return res.json({
          user: { id: user._id, email: user.email, role: user.role, name: user.name },
          token
        });
      }

      // Universal Dev OTP (123456) for any user in development mode
      if (process.env.NODE_ENV === 'development' && otp === '123456') {
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          user = await User.create({ email: normalizedEmail });
        }
        const token = generateToken(user._id, user.role);
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
        return res.json({
          user: { id: user._id, email: user.email, role: user.role, name: user.name },
          token
        });
      }

      // Normal OTP verification
      const { valid } = await verifyOTP(normalizedEmail, otp);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        user = await User.create({ email: normalizedEmail });
      }

      const token = generateToken(user._id, user.role);
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
      res.json({
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
        token
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
];

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
