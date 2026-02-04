const { supabase, supabaseAdmin } = require('../config/supabase');
const { body, validationResult } = require('express-validator');

const ADMIN_EMAIL = 'swethad2005@gmail.com';

/**
 * ULTRA-ROBUST ERROR STRINGIFIER
 * Handles Supabase's strange "message": "{}" quirk.
 */
const stringifyError = (err) => {
  if (!err) return 'Unknown server error.';
  if (typeof err === 'string') return err;

  console.log('[ERROR-DEBUG] Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

  // 1. Handle explicit status codes (Timeout/Gateway)
  if (err.status === 504 || err.status === 502 || err.name === 'AuthRetryableFetchError') {
    return 'Supabase Auth Timeout: The connection to the authentication server timed out (504). This often happens during email sending. Please check your internet or try again in a few minutes.';
  }

  // 2. Extract message with fallback for Supabase "{}" quirk
  let msg = err.message || err.error_description || err.error || err.msg;
  if (msg === '{}' || !msg || typeof msg !== 'string') {
    // If message is missing or just "{}", try statusText or other properties
    msg = err.statusText || (err.status ? `Error Status ${err.status}` : null);
  }

  if (msg && msg !== '{}') return msg;

  // 3. Scan all properties for ANY useful string
  try {
    const props = Object.getOwnPropertyNames(err);
    for (const p of props) {
      if (typeof err[p] === 'string' && err[p].length > 2 && err[p] !== '{}' && err[p] !== '[object Object]') {
        return err[p];
      }
    }
  } catch (e) { }

  return 'Internal Auth Error (Supabase Connection Issue)';
};

// @route   POST /api/auth/register
exports.register = [
  async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      console.log(`[AUTH-TRACE] Signup Request: ${email} (Admin: ${isAdmin})`);

      // 1. ADMIN BYPASS (Using Service Role for absolute reliability)
      // This ensures the main developer is never blocked by email timeouts
      if (isAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[AUTH-TRACE] Using Admin Service Role for signup bypass');
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Automatically confirm admin
          user_metadata: { name, phone, role: 'admin' }
        });

        if (adminError) {
          if (adminError.message.includes('already registered')) {
            console.log('[AUTH-TRACE] Admin already exists, updating role in profile...');
          } else {
            console.error('[AUTH-TRACE] Admin Creation Error:', stringifyError(adminError));
            return res.status(400).json({ error: stringifyError(adminError) });
          }
        }

        const userId = adminData?.user?.id;
        if (userId) {
          await adminClient.from('profiles').upsert([{ id: userId, name, phone, role: 'admin' }]);
        }

        return res.status(201).json({
          message: 'Admin account initialized successfully! You can now log in.',
          requiresVerification: false
        });
      }

      // 2. NORMAL USER or ADMIN (Fallthrough)
      console.log(`[AUTH-TRACE] Executing Supabase Signup for ${email}...`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, role: isAdmin ? 'admin' : 'user' },
          emailRedirectTo: 'http://localhost:5173/login'
        }
      });

      if (authError) {
        const errMsg = stringifyError(authError);
        console.error('[AUTH-TRACE] Signup Failed:', errMsg);

        if (errMsg.toLowerCase().includes('already registered')) {
          return res.status(400).json({ error: 'This email is already registered. Please try logging in.' });
        }

        if (authError.status === 504 || authError.status === 502 || errMsg.includes('timeout')) {
          return res.status(400).json({
            error: 'The authentication server is busy. Please wait 2 minutes and try again.'
          });
        }

        return res.status(400).json({ error: errMsg });
      }

      if (!authData || !authData.user) {
        return res.status(500).json({ error: 'Auth service failure: No user returned.' });
      }

      const isConfirmed = !!authData.user.email_confirmed_at;

      // 3. Create or Update Profile (CRITICAL: Using supabaseAdmin to bypass RLS)
      const { error: profError } = await supabaseAdmin.from('profiles').upsert([{
        id: authData.user.id,
        name,
        phone,
        role: isAdmin ? 'admin' : 'user'
      }]);

      if (profError) {
        console.error('[AUTH-TRACE] Profile Meta Error:', profError.message);
      }

      console.log('[AUTH-TRACE] Signup Successful for', email, 'Confirmed:', isConfirmed);

      return res.status(201).json({
        message: isConfirmed
          ? 'Signup successful! You can now login.'
          : 'Signup successful! A verification link has been sent to your email. Please check your inbox (and spam folder).',
        requiresVerification: !isConfirmed,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: isAdmin ? 'admin' : 'user'
        }
      });
    } catch (err) {
      console.error('[AUTH-TRACE] Critical System Exception:', err);
      return res.status(500).json({ error: 'Critical System Error: ' + err.message });
    }
  }
];

// @route   POST /api/auth/login
exports.login = [
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const isHardcodedAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      console.log(`[AUTH-TRACE] Login Attempt: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const errMsg = stringifyError(error);
        console.error('[AUTH-TRACE] Login Failed:', errMsg);

        // Specific handling for unconfirmed email
        if (errMsg.toLowerCase().includes('email not confirmed')) {
          return res.status(401).json({
            error: 'Email not verified. Please check your inbox for the verification link.',
            requiresVerification: true
          });
        }

        return res.status(400).json({ error: errMsg });
      }

      // Fetch profile to get role (Using Admin client to ensure it's found)
      const { data: profile } = await supabaseAdmin.from('profiles').select('role, name').eq('id', data.user.id).single();

      // Role logic: Hardcoded email takes priority as admin
      const finalRole = isHardcodedAdmin ? 'admin' : (profile?.role || 'user');

      // Update profile role if it's the hardcoded admin but role isn't set yet
      if (isHardcodedAdmin && profile?.role !== 'admin') {
        await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
      }

      return res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: finalRole,
          name: profile?.name || data.user.user_metadata?.name || 'User'
        },
        session: data.session
      });
    } catch (err) {
      console.error('[AUTH-TRACE] Login Exception:', err.message);
      return res.status(500).json({ error: 'Login service failure' });
    }
  }
];

exports.verifyOTP = async (req, res) => {
  const { email, token, type = 'signup' } = req.body;
  console.log(`[AUTH-TRACE] Verifying ${type} OTP for ${email}`);

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });

  if (error) {
    console.error('[AUTH-TRACE] OTP Verification Failed:', error.message);
    return res.status(400).json({ error: stringifyError(error) });
  }

  return res.json({
    message: 'Email verified successfully!',
    session: data.session,
    user: data.user
  });
};

exports.me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No Token' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Session Expired' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const isHardcodedAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const finalRole = isHardcodedAdmin ? 'admin' : (profile?.role || 'user');

    res.json({
      ...user,
      role: finalRole,
      profile: { ...profile, role: finalRole }
    });
  } catch (err) {
    res.status(500).json({ error: 'Identity check failed' });
  }
};

exports.logout = async (req, res) => {
  await supabase.auth.signOut();
  res.json({ success: true });
};
