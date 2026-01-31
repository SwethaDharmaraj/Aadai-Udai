const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ["MEN'S COLLECTION", "WOMEN'S COLLECTION", "KIDS COLLECTION", "GENERAL ITEMS", "ACCESSORIES", "GOD ITEMS"],
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  images: [{ type: String }],
  sizes: [{ type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] }],
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
