const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { body, validationResult } = require('express-validator');

exports.updateProfile = [
  body('name').optional().trim(),
  body('phone').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { name, phone } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }) },
        { new: true }
      ).select('-__v');
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
];

exports.addAddress = [
  body('name').trim().notEmpty(),
  body('phone').trim().matches(/^[6-9]\d{9}$/),
  body('addressLine1').trim().notEmpty(),
  body('addressLine2').optional().trim(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').trim().matches(/^\d{6}$/),
  body('isDefault').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findById(req.user._id);
      const addr = { ...req.body };
      if (addr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }
      user.addresses.push(addr);
      await user.save();
      res.json(user.addresses);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add address' });
    }
  }
];

exports.updateAddress = [
  body('addressId').notEmpty(),
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('addressLine1').optional().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('isDefault').optional().isBoolean(),
  async (req, res) => {
    try {
      const { addressId, ...updates } = req.body;
      const user = await User.findById(req.user._id);
      const addr = user.addresses.id(addressId);
      if (!addr) return res.status(404).json({ error: 'Address not found' });
      Object.assign(addr, updates);
      if (updates.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
        addr.isDefault = true;
      }
      await user.save();
      res.json(user.addresses);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update address' });
    }
  }
];

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find({ user: req.user._id })
      .populate('order')
      .sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
