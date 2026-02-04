const { supabaseAdmin } = require('../config/supabase');

const getCartData = async (userId) => {
  const { data: items, error } = await supabaseAdmin
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return { items: items || [] };
};

exports.get = async (req, res) => {
  try {
    const cart = await getCartData(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

exports.add = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;

    // Check product existence and stock
    const { data: product, error: pError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (pError || !product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    // Check if item already exists in cart
    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .eq('size', size)
      .single();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) return res.status(400).json({ error: 'Insufficient stock' });

      const { error: uError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id);

      if (uError) throw uError;
    } else {
      const { error: iError } = await supabaseAdmin
        .from('cart_items')
        .insert([{ user_id: req.user.id, product_id: productId, quantity, size }]);

      if (iError) throw iError;
    }

    const cart = await getCartData(req.user.id);
    res.json(cart);
  } catch (err) {
    console.error('Add to Cart Error:', err);
    res.status(500).json({ error: 'Failed to add to cart: ' + (err.message || err.error_description) });
  }
};

exports.update = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (quantity <= 0) {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', req.user.id);
      if (error) throw error;
    } else {
      // Check stock
      const { data: item } = await supabaseAdmin
        .from('cart_items')
        .select('*, products(stock)')
        .eq('id', itemId)
        .eq('user_id', req.user.id)
        .single();

      if (!item) return res.status(404).json({ error: 'Item not found' });
      if (item.products.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

      const { error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', req.user.id);
      if (error) throw error;
    }

    const cart = await getCartData(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    const cart = await getCartData(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
};
