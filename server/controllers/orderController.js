const { supabase, supabaseAdmin } = require('../config/supabase');
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

    // Get user and address (Use Admin to ensure we can read all profiles if needed, though usually profiles are public-ish)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('addresses')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Order Error: Profile missing for user', req.user.id);
      return res.status(400).json({ error: 'User profile not found. Please save a delivery address first.' });
    }

    const address = profile.addresses?.find(a => a.id === addressId || a._id === addressId);
    if (!address) {
      return res.status(400).json({ error: 'Selected Delivery Address is invalid or missing.' });
    }

    // Get cart items and product details
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', req.user.id);

    if (cartError || !cartItems?.length) return res.status(400).json({ error: 'Cart is empty' });

    let subtotal = 0;
    const orderItemsData = [];
    for (const ci of cartItems) {
      const p = ci.products;
      if (!p) return res.status(400).json({ error: `Product info missing for cart item` });

      const price = p.discounted_price || p.discountedPrice || p.price;
      if (p.stock < ci.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });

      orderItemsData.push({
        product_id: p.id,
        price,
        quantity: ci.quantity,
        size: ci.size
      });
      subtotal += price * ci.quantity;
    }

    // 1. Create Order
    const orderIdCode = generateOrderId();
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: req.user.id,
        order_id: orderIdCode,
        total_amount: subtotal,
        status: 'pending',
        shipping_address: address
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const itemsToInsert = orderItemsData.map(item => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    // 3. Create (or try to create) Razorpay Order
    let razorpayOrder = null;
    if (razorpay) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(subtotal * 100),
          currency: 'INR',
          receipt: orderIdCode
        });
      } catch (rzpErr) {
        console.warn('Razorpay order creation failed, falling back to demo mode:', rzpErr);
      }
    }

    // 4. Create Transaction
    const txnIdCode = generateTxnId();
    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        order_id: order.id,
        transaction_id: txnIdCode,
        amount: subtotal,
        payment_method: razorpayOrder ? 'Razorpay' : 'Demo',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder?.id
      }])
      .select()
      .single();

    if (txnError) {
      console.error('Transaction Creation Error (Cart):', txnError);
      throw txnError;
    }
    console.log('Transaction Created (Cart):', txn);

    // 5. Update stock and clear cart
    // 5. Update stock and clear cart
    for (const ci of cartItems) {
      const p = ci.products;
      const updates = { stock: p.stock - ci.quantity };

      if (p.variant_stock && p.variant_stock[ci.size] !== undefined) {
        const currentVariantStock = parseInt(p.variant_stock[ci.size]) || 0;
        const newVariantStock = Math.max(0, currentVariantStock - ci.quantity);
        updates.variant_stock = { ...p.variant_stock, [ci.size]: newVariantStock };
      }

      await supabaseAdmin.from('products').update(updates).eq('id', ci.product_id);
    }
    await supabaseAdmin.from('cart_items').delete().eq('user_id', req.user.id);

    res.status(201).json({
      order,
      transaction: txn,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      isDemo: !razorpayOrder
    });
  } catch (err) {
    console.error('Create from cart error:', err);
    res.status(500).json({ error: 'Order creation failed: ' + (err.message || err.error_description || 'Unknown Error') });
  }
};

exports.createBuyNow = async (req, res) => {
  try {
    const { productId, quantity, size, addressId } = req.body;

    // Get user and address
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('addresses')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      console.error('BuyNow Error: Profile missing for user', req.user.id);
      return res.status(400).json({ error: 'User profile not found. Please save a delivery address first.' });
    }

    const address = profile.addresses?.find(a => a.id === addressId || a._id === addressId);
    if (!address) {
      return res.status(400).json({ error: 'Selected Delivery Address is invalid or missing.' });
    }

    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', productId).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const price = product.discounted_price || product.discountedPrice || product.price;
    const subtotal = price * quantity;

    const orderIdCode = generateOrderId();
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: req.user.id,
        order_id: orderIdCode,
        total_amount: subtotal,
        status: 'pending',
        shipping_address: address
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    await supabaseAdmin.from('order_items').insert([{
      order_id: order.id,
      product_id: product.id,
      price,
      quantity,
      size
    }]);

    let razorpayOrder = null;
    if (razorpay) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(subtotal * 100),
          currency: 'INR',
          receipt: orderIdCode
        });
      } catch (rzpErr) {
        console.warn('Razorpay order creation failed, falling back to demo mode:', rzpErr);
      }
    }

    const txnIdCode = generateTxnId();
    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        order_id: order.id,
        transaction_id: txnIdCode,
        amount: subtotal,
        payment_method: razorpayOrder ? 'Razorpay' : 'Demo',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder?.id
      }])
      .select()
      .single();

    if (txnError) {
      console.error('Transaction Creation Error (BuyNow):', txnError);
      throw txnError;
    }
    console.log('Transaction Created (BuyNow):', txn);

    const updates = { stock: product.stock - quantity };
    if (product.variant_stock && product.variant_stock[size] !== undefined) {
      const currentVariantStock = parseInt(product.variant_stock[size]) || 0;
      const newVariantStock = Math.max(0, currentVariantStock - quantity);
      updates.variant_stock = { ...product.variant_stock, [size]: newVariantStock };
    }

    await supabaseAdmin.from('products').update(updates).eq('id', product.id);

    res.status(201).json({
      order,
      transaction: txn,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      isDemo: !razorpayOrder
    });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed: ' + (err.message || 'Unknown') });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const {
      transactionId,
      transaction_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentMethod,
      isDemo
    } = req.body;

    const tId = transactionId || transaction_id;
    const rzpPaymentId = razorpay_payment_id || razorpayPaymentId;
    const rzpOrderId = razorpay_order_id || razorpayOrderId;
    const rzpSignature = razorpay_signature || razorpaySignature;

    console.log('[PAYMENT-DEBUG-SERVER] Received Body:', req.body);
    console.log('Confirming Payment for Transaction:', {
      receivedId: tId,
      rzpPaymentId,
      rzpOrderId,
      userId: req.user.id
    });

    if (!tId) {
      console.error('[PAYMENT-DEBUG-SERVER] Error: tId is missing!');
      return res.status(400).json({ error: 'Transaction ID (transactionId) is required' });
    }

    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('transaction_id', tId)
      .eq('user_id', req.user.id)
      .single();

    if (txnError || !txn) {
      console.error('Confirm Payment Error: Transaction not found in DB', { tId, userId: req.user.id, txnError });
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updates = { payment_status: 'success' };

    if (txn.payment_method === 'Razorpay' && !isDemo) {
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${rzpOrderId}|${rzpPaymentId}`);
      const digest = shasum.digest('hex');

      if (digest !== rzpSignature) {
        await supabaseAdmin.from('transactions').update({ payment_status: 'failed' }).eq('id', txn.id);
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
      updates.razorpay_payment_id = rzpPaymentId;
      updates.razorpay_signature = rzpSignature;
    } else {
      updates.payment_method = paymentMethod || 'Demo';
    }

    await supabaseAdmin.from('transactions').update(updates).eq('id', txn.id);
    await supabaseAdmin.from('orders').update({ status: 'confirmed' }).eq('id', txn.order_id);

    res.json({ message: 'Payment confirmed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.getOrderTransaction = async (req, res) => {
  try {
    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('order_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};
