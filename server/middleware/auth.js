const { supabase } = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required: No token found' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session validation failed' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

    // VERBOSE SERVER LOGGING
    console.log('[AUTH-ADMIN] Inbound Request:', req.path);
    console.log('[AUTH-ADMIN] Token Present:', token ? 'YES (Len: ' + token.length + ')' : 'NO');

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[AUTH-ADMIN] Token validation failed:', error?.message || 'No user');
      return res.status(401).json({ error: 'Admin session invalid or expired' });
    }

    // Role Bypass for designated admin
    const emailStr = user.email.toLowerCase();
    const isSpecialAdmin = emailStr === 'swethad2005@gmail.com';

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (!isSpecialAdmin && (!profile || profile.role !== 'admin')) {
      console.warn('[AUTH-ADMIN] Denial for:', emailStr);
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    req.user = user;
    req.user.role = isSpecialAdmin ? 'admin' : profile.role;

    console.log('[AUTH-ADMIN] Access GRANTED for:', emailStr);
    next();
  } catch (err) {
    console.error('[AUTH-ADMIN] Fatal Error:', err.message);
    res.status(401).json({ error: 'Admin authorization failed' });
  }
};

module.exports = { auth, adminAuth };
