const Review = require('../models/Review');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// User: Add review
exports.addReview = [
  body('productId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().trim(),
  body('comment').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId, rating, title, comment } = req.body;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // Check for existing review
      const existing = await Review.findOne({ product: productId, user: req.user._id });
      if (existing) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating,
        title,
        comment,
        isApproved: false // Admin must approve
      });

      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
];

// User: Get my reviews
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Public: Get approved reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    res.json({ reviews, averageRating: avgRating.toFixed(1), totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Admin: Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Admin: Approve/reject review
exports.updateReviewStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('user', 'name email').populate('product', 'name');
    
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Admin: Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
