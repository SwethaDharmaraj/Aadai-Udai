const { supabase, supabaseAdmin } = require('../config/supabase');
const { body, validationResult } = require('express-validator');

exports.updateProfile = [
  body('name').optional().trim(),
  body('phone').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { name, phone } = req.body;
      const updates = { id: req.user.id, updated_at: new Date() };
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;

      // Check if profile exists first to decide between update or insert (to preserve other fields on update)
      const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('id', req.user.id).single();

      let query;
      if (existing) {
        query = supabaseAdmin.from('profiles').update(updates).eq('id', req.user.id);
      } else {
        // New profile, ensure defaults
        updates.role = 'user';
        updates.addresses = [];
        query = supabaseAdmin.from('profiles').insert(updates);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Update Profile Error:', err);
      res.status(500).json({ error: 'Failed to update profile: ' + (err.message || err.error_description) });
    }
  }
];

exports.addAddress = [
  body('name').trim().notEmpty(),
  body('phone').trim().matches(/^[6-9]\d{9}$/),
  body('addressLine1').trim().notEmpty(),
  body('addressLine2').optional().trim(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').trim().matches(/^\d{6}$/),
  body('isDefault').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*') // Get all fields to preserve them if we fall back to upsert, but update is safer
        .eq('id', req.user.id)
        .single();

      let addresses = profile?.addresses || [];
      const newAddr = { ...req.body, id: Date.now().toString() };

      if (newAddr.isDefault) {
        addresses.forEach(a => a.isDefault = false);
      }
      addresses.push(newAddr);

      let data, error;

      if (profile) {
        // Safe Update
        ({ data, error } = await supabaseAdmin
          .from('profiles')
          .update({ addresses })
          .eq('id', req.user.id)
          .select()
          .single());
      } else {
        // Create new profile if missing
        ({ data, error } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: req.user.id,
            addresses,
            role: 'user',
            name: req.user.user_metadata?.name || '',
            phone: req.user.user_metadata?.phone || ''
          })
          .select()
          .single());
      }

      if (error) throw error;
      res.json(data.addresses);
    } catch (err) {
      console.error('Add Address Error:', err);
      res.status(500).json({ error: 'Failed to add address: ' + (err.message || err.error_description) });
    }
  }
];

exports.updateAddress = [
  body('addressId').notEmpty(),
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('addressLine1').optional().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('isDefault').optional().isBoolean(),
  async (req, res) => {
    try {
      const { addressId, ...updates } = req.body;
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('addresses')
        .eq('id', req.user.id)
        .single();

      if (!profile) return res.status(404).json({ error: 'Profile not found. Please update your profile details first.' });

      let addresses = profile.addresses || [];
      const index = addresses.findIndex(a => a.id === addressId || a._id === addressId);
      if (index === -1) return res.status(404).json({ error: 'Address not found' });

      addresses[index] = { ...addresses[index], ...updates };
      if (updates.isDefault) {
        addresses.forEach((a, i) => { if (i !== index) a.isDefault = false; });
        addresses[index].isDefault = true;
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ addresses })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data.addresses);
    } catch (err) {
      console.error('Update Address Error:', err);
      res.status(500).json({ error: 'Failed to update address: ' + (err.message || err.error_description) });
    }
  }
];

exports.deleteAddress = async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('addresses')
      .eq('id', req.user.id)
      .single();

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    let addresses = (profile.addresses || []).filter(a => a.id !== req.params.id && a._id !== req.params.id);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ addresses })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data.addresses);
  } catch (err) {
    console.error('Delete Address Error:', err);
    res.status(500).json({ error: 'Failed to delete address: ' + (err.message || err.error_description) });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, orders(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
