const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');

// Dashboard with comprehensive stats
exports.dashboard = async (req, res) => {
  try {
    const [userCount, productCount, orderCount, txnCount, reviewCount, totalSales, lowStock, pendingReviews] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Transaction.countDocuments(),
      Review.countDocuments(),
      Transaction.aggregate([{ $match: { paymentStatus: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Product.countDocuments({ stock: { $lt: 10 } }),
      Review.countDocuments({ isApproved: false })
    ]);

    const recentOrders = await Order.find().populate('user', 'email name').sort({ createdAt: -1 }).limit(5);
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).select('name stock category').limit(10);

    res.json({
      users: userCount,
      products: productCount,
      orders: orderCount,
      transactions: txnCount,
      reviews: reviewCount,
      totalSales: totalSales[0]?.total || 0,
      lowStockCount: lowStock,
      pendingReviews,
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

// ============ USER MANAGEMENT ============
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    const reviews = await Review.find({ user: user._id }).populate('product', 'name');

    res.json({ user, orders, reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, role, isActive },
      { new: true }
    ).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ============ PRODUCT MANAGEMENT ============
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, price, discountedPrice, sizes, stock, featured } = req.body;

    // Handle uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => `/uploads/products/${f.filename}`);
    } else if (req.body.images) {
      // Handle URL-based images
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.create({
      name,
      description,
      category,
      subCategory,
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
      sizes: typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes,
      stock: parseInt(stock) || 0,
      featured: featured === 'true' || featured === true,
      images
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, price, discountedPrice, sizes, stock, featured } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Handle new uploaded images
    let images = product.images;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/products/${f.filename}`);
      images = [...images, ...newImages];
    }
    if (req.body.images) {
      const urlImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      images = [...new Set([...images, ...urlImages])]; // Avoid duplicates
    }
    if (req.body.removeImages) {
      const toRemove = Array.isArray(req.body.removeImages) ? req.body.removeImages : [req.body.removeImages];
      images = images.filter(img => !toRemove.includes(img));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        category: category || product.category,
        subCategory: subCategory || product.subCategory,
        price: price ? parseFloat(price) : product.price,
        discountedPrice: discountedPrice !== undefined ? (discountedPrice ? parseFloat(discountedPrice) : null) : product.discountedPrice,
        sizes: sizes ? (typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes) : product.sizes,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
        images
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: parseInt(stock) },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Delete associated images
    product.images.forEach(img => {
      if (img.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../..', img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// ============ ORDER MANAGEMENT ============
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'email name')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'email name phone')
      .populate('items.product');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const transaction = await Transaction.findOne({ order: order._id });
    res.json({ order, transaction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('user', 'email');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// ============ TRANSACTION MANAGEMENT ============
exports.getTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find()
      .populate('user', 'email name')
      .populate('order')
      .sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const txns = await Transaction.find({ paymentStatus: 'success' })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    let csv = 'Date,TransactionID,OrderID,User,Amount,Method\n';
    txns.forEach(t => {
      csv += `${new Date(t.createdAt).toLocaleDateString()},${t.transactionId},${t.orderId},${t.user?.email || 'N/A'},${t.amount},${t.paymentMethod}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// ============ REVIEW MANAGEMENT ============
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'email name')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    ).populate('user', 'email name').populate('product', 'name');
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
