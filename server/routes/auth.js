const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, me, logout } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
