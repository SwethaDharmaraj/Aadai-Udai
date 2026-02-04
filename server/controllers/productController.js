const { supabase } = require('../config/supabase');

exports.getAll = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let query = supabase.from('products').select('*');

    if (category) {
      const categoryMap = {
        'mens-collection': "MEN'S COLLECTION",
        'womens-collection': "WOMEN'S COLLECTION",
        'kids-collection': "KIDS COLLECTION",
        'general-items': "GENERAL ITEMS",
        'accessories': "ACCESSORIES",
        'god-items': "GOD ITEMS"
      };
      query = query.eq('category', categoryMap[category] || category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching all products:', error);
      throw error;
    }
    res.json(products);
  } catch (err) {
    console.error('Get all products error:', err);
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Supabase error fetching product by ID:', error);
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Get product by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch product', details: err.message });
  }
};
