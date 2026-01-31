const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, me, logout } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
