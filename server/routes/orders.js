const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createFromCart, createBuyNow, confirmPayment, getOrder, getOrderTransaction
} = require('../controllers/orderController');

router.use(auth);
router.post('/from-cart', createFromCart);
router.post('/buy-now', createBuyNow);
router.post('/confirm-payment', confirmPayment);
router.get('/:id', getOrder);
router.get('/:id/transaction', getOrderTransaction);

module.exports = router;
