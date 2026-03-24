const { supabase, supabaseAdmin } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

// Dashboard with comprehensive stats
exports.dashboard = async (req, res) => {
  try {
    // Basic counts
    const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user');
    const { count: productsCount } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const { count: ordersCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });

    // Recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email, name)')
      .order('created_at', { ascending: false })
      .limit(5);

    // Stats
    const { data: deliveredOrders } = await supabaseAdmin.from('orders').select('total_amount').eq('status', 'delivered');
    const totalSales = deliveredOrders?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;

    const { data: lowStockProducts } = await supabaseAdmin.from('products').select('id, name, stock').lt('stock', 5);
    const { count: pendingReviews } = await supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false);

    res.json({
      users: usersCount || 0,
      products: productsCount || 0,
      orders: ordersCount || 0,
      totalSales: Math.round(totalSales),
      lowStockCount: lowStockProducts?.length || 0,
      lowStockProducts: lowStockProducts || [],
      pendingReviews: pendingReviews || 0,
      recentOrders
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ error: `Failed to fetch dashboard: ${err.message}` });
  }
};

// ============ USER MANAGEMENT ============
exports.getUsers = async (req, res) => {
  try {
    // Get profiles from database
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Get all users from Supabase Auth to get emails
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Return profiles without emails if auth fetch fails
      return res.json(profiles);
    }

    // Create a map of user IDs to emails
    const emailMap = {};
    users.forEach(user => {
      emailMap[user.id] = user.email;
    });

    // Merge emails into profiles
    const usersWithEmails = profiles.map(profile => ({
      ...profile,
      email: emailMap[profile.id] || profile.email || 'N/A'
    }));

    res.json(usersWithEmails);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'User not found' });

    const { data: orders } = await supabaseAdmin.from('orders').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });

    res.json({ user, orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const nameRegex = /^[a-zA-Z\s.]*$/;
    const phoneRegex = /^\d{10}$/;

    if (name && (!nameRegex.test(name) || !name.includes('.'))) {
      return res.status(400).json({ error: 'Invalid name. Must contain only alphabets and dots, and include an initial (dot).' });
    }
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
    }

    const { data, error } = await supabaseAdmin.from('profiles').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ error: 'Failed to update user: ' + (err.message || 'Internal Error') });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ============ PRODUCT MANAGEMENT ============
exports.getProducts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, price, discountedPrice, sizes, stock, featured } = req.body;
    let variantStock = {};
    try {
      if (req.body.variantStock) variantStock = JSON.parse(req.body.variantStock);
    } catch (e) { console.error('Error parsing variantStock', e); }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabaseAdmin.storage
          .from('products')
          .upload(fileName, fs.readFileSync(file.path), {
            contentType: file.mimetype
          });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);
        images.push(urlData.publicUrl);
      }
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          name,
          description,
          category,
          sub_category: subCategory,
          price: parseFloat(price),
          discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
          sizes: typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes,
          sizes: typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes,
          stock: parseInt(stock) || 0,
          variant_stock: variantStock,
          featured: featured === 'true' || featured === true,
          images
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: `Failed to create product: ${err.message}` });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, price, discountedPrice, sizes, stock, featured } = req.body;
    let variantStock = null;
    try {
      if (req.body.variantStock) variantStock = JSON.parse(req.body.variantStock);
    } catch (e) { console.error('Error parsing variantStock', e); }

    // Fetch current product to handle images
    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', req.params.id).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let images = product.images || [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabaseAdmin.storage
          .from('products')
          .upload(fileName, fs.readFileSync(file.path), {
            contentType: file.mimetype
          });
        if (!error) {
          const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);
          images.push(urlData.publicUrl);
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        category: category || product.category,
        sub_category: subCategory || product.sub_category,
        price: price ? parseFloat(price) : product.price,
        discounted_price: discountedPrice !== undefined ? (discountedPrice ? parseFloat(discountedPrice) : null) : product.discounted_price,
        sizes: sizes ? (typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes) : product.sizes,
        sizes: sizes ? (typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes) : product.sizes,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        variant_stock: variantStock || product.variant_stock,
        featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
        images
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ stock: parseInt(req.body.stock) })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

// ============ ORDER MANAGEMENT ============
exports.getOrders = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email, name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email, name, phone), order_items(*, products(name))')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};
// ============ TRANSACTION MANAGEMENT ============
exports.getTransactions = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*, profiles(email, name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email)')
      .eq('status', 'delivered');

    if (error) throw error;

    let csv = 'Order ID,User,Amount,Status,Date\n';
    orders.forEach(o => {
      csv += `${o.order_id},${o.profiles?.email},${o.total_amount},${o.status},${o.created_at}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('sales-report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// ============ REVIEW MANAGEMENT ============
exports.getReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(email), products(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: req.body.isApproved })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
