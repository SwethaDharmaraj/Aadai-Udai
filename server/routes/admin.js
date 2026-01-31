const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  dashboard,
  // Users
  getUsers, getUserById, updateUser, deleteUser,
  // Products
  getProducts, createProduct, updateProduct, updateStock, deleteProduct,
  // Orders
  getOrders, getOrderById, updateOrderStatus,
  // Transactions
  getTransactions, getSalesReport,
  // Reviews
  getReviews, approveReview, deleteReview
} = require('../controllers/adminController');

router.use(adminAuth);

// Dashboard
router.get('/dashboard', dashboard);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Products (with image upload)
router.get('/products', getProducts);
router.post('/products', upload.array('images', 10), createProduct);
router.patch('/products/:id', upload.array('images', 10), updateProduct);
router.patch('/products/:id/stock', updateStock);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

// Transactions
router.get('/transactions', getTransactions);
router.get('/sales-report', getSalesReport);

// Reviews
router.get('/reviews', getReviews);
router.patch('/reviews/:id', approveReview);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
