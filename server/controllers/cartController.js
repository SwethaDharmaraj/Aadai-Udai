const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

exports.get = async (req, res) => {
  try {
    const cart = await getCart(req.user._id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

exports.add = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId && i.size === size);
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > product.stock) return res.status(400).json({ error: 'Insufficient stock' });
    } else {
      cart.items.push({ product: productId, quantity, size });
    }
    cart.updatedAt = new Date();
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

exports.update = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      if (item.product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
      item.quantity = quantity;
    }
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

exports.remove = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items.pull(req.params.id);
    cart.updatedAt = new Date();
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
};
