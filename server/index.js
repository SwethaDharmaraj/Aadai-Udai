const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');

const app = express();
app.use(cors({
  origin: true, // Allow any origin (reflects request origin), needed for Electron file://
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const { supabaseAdmin } = require('./config/supabase');

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);

  // Auto-Diagnostic
  try {
    console.log('Checking database connection...');
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('CRITICAL ERROR: Database tables not found!');
      console.error('Error detail:', error.message);
      console.error('PLEASE RUN server/supabase_schema.sql IN SUPABASE SQL EDITOR');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    } else {
      console.log('Database tables verified. System ready.');
    }
  } catch (e) { console.error('DB Check Failed:', e); }
});
