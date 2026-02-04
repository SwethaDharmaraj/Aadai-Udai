import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getMe()
      .then((data) => {
        const userData = data.profile || data;
        setProfile(data);
        setName(userData?.name || '');
        setPhone(userData?.phone || '');
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile({ name, phone });
      setProfile({ ...profile, profile: { ...profile.profile, name, phone } });
      setEditing(false);
      refreshUser();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  const currentProfile = profile?.profile || profile;

  return (
    <div className="profile-page container">
      <h1 className="section-title">My Profile</h1>

      <div className="profile-card">
        <h2>Personal Details</h2>
        {editing ? (
          <form onSubmit={handleSave}>
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
            <label>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="10-digit mobile" />
            <p className="readonly">Email: {profile?.email} (read-only)</p>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Name:</strong> {currentProfile?.name || '-'}</p>
            <p><strong>Phone:</strong> {currentProfile?.phone || '-'}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>

      <div className="profile-links">
        <Link to="/orders" className="profile-link">Order History</Link>
        <Link to="/transactions" className="profile-link">Transaction History</Link>
      </div>

      <AddressManager onUpdate={() => authAPI.getMe().then(setProfile)} />
    </div>
  );
}

function AddressManager({ onUpdate }) {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false
  });

  useEffect(() => {
    authAPI.getMe().then((u) => setAddresses(u?.profile?.addresses || u?.addresses || [])).catch(() => { });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingId) {
        data = await userAPI.updateAddress({ addressId: editingId, ...form });
      } else {
        data = await userAPI.addAddress(form);
      }
      setAddresses(data);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false });
      onUpdate?.();
    } catch (err) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleEdit = (a) => {
    setForm({
      name: a.name, phone: a.phone, addressLine1: a.addressLine1, addressLine2: a.addressLine2,
      city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this address?')) return;
    try {
      const data = await userAPI.deleteAddress(id);
      setAddresses(data);
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const data = await userAPI.updateAddress({ addressId: id, isDefault: true });
      setAddresses(data);
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="profile-card">
      <h2>Delivery Addresses</h2>
      <div className="address-grid">
        {addresses.map((a) => (
          <div key={a.id} className={`address-item ${a.isDefault ? 'default' : ''}`}>
            {a.isDefault && <span className="badge">Default</span>}
            <p><strong>{a.name}</strong> {a.phone}</p>
            <p>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
            <div className="address-actions">
              <button className="btn-link" onClick={() => handleEdit(a)}>Edit</button>
              <button className="btn-link" onClick={() => handleDelete(a.id)}>Remove</button>
              {!a.isDefault && <button className="btn-link" onClick={() => handleSetDefault(a.id)}>Set as Default</button>}
            </div>
          </div>
        ))}
      </div>
      {showForm ? (
        <form onSubmit={handleSubmit} className="address-form">
          <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className="input" placeholder="Address Line 1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} required />
          <input className="input" placeholder="Address Line 2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
          <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <input className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          <input className="input" placeholder="Pincode (6 digits)" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required maxLength={6} />
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default address
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-secondary" onClick={() => setShowForm(true)}>Add New Address</button>
      )}
    </div>
  );
}
