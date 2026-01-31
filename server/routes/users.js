const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  updateProfile, addAddress, updateAddress, deleteAddress,
  getOrders, getTransactions
} = require('../controllers/userController');

router.use(auth);
router.patch('/profile', updateProfile);
router.post('/addresses', addAddress);
router.patch('/addresses', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.get('/orders', getOrders);
router.get('/transactions', getTransactions);

module.exports = router;
