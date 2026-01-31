const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { addReview, getMyReviews, getProductReviews } = require('../controllers/reviewController');

// Public - get reviews for a product
router.get('/product/:productId', getProductReviews);

// Protected - user reviews
router.post('/', auth, addReview);
router.get('/my', auth, getMyReviews);

module.exports = router;
