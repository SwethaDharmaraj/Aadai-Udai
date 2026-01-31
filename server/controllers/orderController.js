const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = process.env.RAZORPAY_KEY_ID?.startsWith('YOUR_') || !process.env.RAZORPAY_KEY_ID
  ? null
  : new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

const generateOrderId = () => 'ORD' + Date.now() + crypto.randomInt(100, 999);
const generateTxnId = () => 'TXN' + Date.now() + crypto.randomInt(100, 999);

exports.createFromCart = async (req, res) => {
  try {
    const { addressId } = req.body;
    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ error: 'Invalid address' });

    const cart = await Cart.findOne({ user: user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    let subtotal = 0;
    const items = [];
    for (const ci of cart.items) {
      const p = ci.product;
      const price = p.discountedPrice ?? p.price;
      if (p.stock < ci.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      items.push({
        product: p._id,
        name: p.name,
        price,
        quantity: ci.quantity,
        size: ci.size,
        image: p.images?.[0] || ''
      });
      subtotal += price * ci.quantity;
    }

    const orderId = generateOrderId();
    const order = await Order.create({
      orderId,
      user: user._id,
      items,
      subtotal,
      shippingAddress: address.toObject()
    });

    // Create Razorpay Order if configured
    let razorpayOrder = null;
    if (razorpay) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(subtotal * 100), // Amount in paise
          currency: 'INR',
          receipt: orderId
        });
      } catch (rzpErr) {
        console.warn('Razorpay order creation failed, falling back to demo mode:', rzpErr);
      }
    }

    const txnId = generateTxnId();
    const txn = await Transaction.create({
      transactionId: txnId,
      order: order._id,
      orderId,
      user: user._id,
      amount: subtotal,
      paymentMethod: razorpayOrder ? 'Razorpay' : 'Demo',
      paymentStatus: 'pending',
      razorpayOrderId: razorpayOrder?.id
    });

    // Reserve stock
    for (const ci of cart.items) {
      await Product.findByIdAndUpdate(ci.product._id, { $inc: { stock: -ci.quantity } });
    }
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({
      order: await Order.findById(order._id).populate('items.product'),
      transaction: txn,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      isDemo: !razorpayOrder
    });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed' });
  }
};

exports.createBuyNow = async (req, res) => {
  try {
    const { productId, quantity, size, addressId } = req.body;
    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ error: 'Invalid address' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const price = product.discountedPrice ?? product.price;
    const subtotal = price * quantity;

    const orderId = generateOrderId();
    const order = await Order.create({
      orderId,
      user: user._id,
      items: [{ product: product._id, name: product.name, price, quantity, size, image: product.images?.[0] || '' }],
      subtotal,
      shippingAddress: address.toObject()
    });

    // Create Razorpay Order if configured
    let razorpayOrder = null;
    if (razorpay) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(subtotal * 100),
          currency: 'INR',
          receipt: orderId
        });
      } catch (rzpErr) {
        console.warn('Razorpay order creation failed, falling back to demo mode:', rzpErr);
      }
    }

    const txnId = generateTxnId();
    const txn = await Transaction.create({
      transactionId: txnId,
      order: order._id,
      orderId,
      user: user._id,
      amount: subtotal,
      paymentMethod: razorpayOrder ? 'Razorpay' : 'Demo',
      paymentStatus: 'pending',
      razorpayOrderId: razorpayOrder?.id
    });

    await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });

    res.status(201).json({
      order: await Order.findById(order._id).populate('items.product'),
      transaction: txn,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      isDemo: !razorpayOrder
    });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const {
      transactionId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentMethod
    } = req.body;

    const txn = await Transaction.findOne({ transactionId, user: req.user._id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    // Verify signature only for real Razorpay orders
    if (txn.paymentMethod === 'Razorpay' && !req.body.isDemo) {
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpaySignature) {
        txn.paymentStatus = 'failed';
        await txn.save();
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
      txn.razorpayPaymentId = razorpayPaymentId;
      txn.razorpaySignature = razorpaySignature;
    } else {
      // Demo mode confirmation
      txn.paymentMethod = paymentMethod || 'Demo';
    }

    txn.paymentStatus = 'success';
    await txn.save();

    await Order.findByIdAndUpdate(txn.order, { status: 'confirmed' });
    res.json({ message: 'Payment confirmed', transaction: txn });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.getOrderTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findOne({ order: req.params.id, user: req.user._id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    console.error('Fetch transaction error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};
