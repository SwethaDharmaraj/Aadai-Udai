const { supabase } = require('../config/supabase');
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
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // Check for existing review
      const { data: existing } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', req.user.id)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .insert([{
          product_id: productId,
          user_id: req.user.id,
          rating,
          comment: comment || title,
          is_approved: false
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
];

// User: Get my reviews
exports.getMyReviews = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, images)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Public: Get approved reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(name, email)')
      .eq('product_id', req.params.productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(name, email), products(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Admin: Approve/reject review
exports.updateReviewStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', req.params.id)
      .select('*, profiles(name, email), products(name)')
      .single();

    if (error) return res.status(404).json({ error: 'Review not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Admin: Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
