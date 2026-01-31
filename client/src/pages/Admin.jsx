import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

function AdminLayout({ children }) {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <Link to="/admin" className={path === '/admin' ? 'active' : ''}>Dashboard</Link>
          <Link to="/admin/products" className={path.includes('products') ? 'active' : ''}>Products</Link>
          <Link to="/admin/orders" className={path.includes('orders') ? 'active' : ''}>Orders</Link>
          <Link to="/admin/users" className={path.includes('users') ? 'active' : ''}>Users</Link>
          <Link to="/admin/reviews" className={path.includes('reviews') ? 'active' : ''}>Reviews</Link>
          <Link to="/admin/transactions" className={path.includes('transactions') ? 'active' : ''}>Transactions</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="sidebar-link">← Back to Store</Link>
          <button onClick={handleLogout} className="sidebar-logout">Logout</button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { adminAPI.dashboard().then(setData).catch(() => setData({})); }, []);
  if (!data) return <p>Loading...</p>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <button className="btn btn-gold" onClick={() => window.open('/api/admin/sales-report', '_blank')}>
          Download Sales Report (CSV)
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span>{data.users || 0}</span><p>Users</p></div>
        <div className="stat-card"><span>{data.products || 0}</span><p>Products</p></div>
        <div className="stat-card"><span>{data.orders || 0}</span><p>Orders</p></div>
        <div className="stat-card"><span>₹{data.totalSales || 0}</span><p>Total Sales</p></div>
        <div className="stat-card alert"><span>{data.lowStockCount || 0}</span><p>Low Stock</p></div>
        <div className="stat-card alert"><span>{data.pendingReviews || 0}</span><p>Pending Reviews</p></div>
      </div>

      {data.lowStockProducts?.length > 0 && (
        <div className="alert-box">
          <h3>Low Stock Alert</h3>
          {data.lowStockProducts.map(p => (
            <p key={p._id}>{p.name} - Only {p.stock} left</p>
          ))}
        </div>
      )}

      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>User</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {(data.recentOrders || []).map(o => (
              <tr key={o._id}>
                <td>{o.orderId}</td>
                <td>{o.user?.email}</td>
                <td>₹{o.subtotal}</td>
                <td><span className={`status ${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'MEN\'S COLLECTION', price: '', discountedPrice: '', sizes: 'S,M,L', stock: '0', featured: false, imageUrl: '' });
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => { loadProducts(); }, []);
  const loadProducts = () => adminAPI.getProducts().then(setProducts).catch(() => setProducts([]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('category', form.category);
    formData.append('price', form.price);
    if (form.discountedPrice) formData.append('discountedPrice', form.discountedPrice);
    formData.append('sizes', form.sizes);
    formData.append('stock', form.stock);
    formData.append('featured', form.featured);
    if (form.imageUrl) formData.append('images', form.imageUrl);
    imageFiles.forEach(f => formData.append('images', f));

    try {
      if (editing) {
        await adminAPI.updateProduct(editing._id, formData);
      } else {
        await adminAPI.createProduct(formData);
      }
      loadProducts();
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'MEN\'S COLLECTION', price: '', discountedPrice: '', sizes: 'S,M,L', stock: '0', featured: false, imageUrl: '' });
    setImageFiles([]);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', category: p.category, price: p.price, discountedPrice: p.discountedPrice || '', sizes: p.sizes?.join(',') || 'S,M,L', stock: p.stock, featured: p.featured, imageUrl: '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await adminAPI.deleteProduct(id); loadProducts(); } catch (err) { alert(err.message); }
  };

  const handleStockUpdate = async (id, stock) => {
    try { await adminAPI.updateStock(id, stock); loadProducts(); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form product-form">
          <input placeholder="Product Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="MEN'S COLLECTION">Men's Collection</option>
            <option value="WOMEN'S COLLECTION">Women's Collection</option>
            <option value="KIDS COLLECTION">Kids Collection</option>
            <option value="GENERAL ITEMS">General Items</option>
            <option value="ACCESSORIES">Accessories</option>
            <option value="GOD ITEMS">God Items</option>
          </select>
          <input type="number" placeholder="Price *" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input type="number" placeholder="Discounted Price" value={form.discountedPrice} onChange={e => setForm({ ...form, discountedPrice: e.target.value })} />
          <input placeholder="Sizes (comma separated)" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} />
          <input type="number" placeholder="Stock *" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
          <label className="checkbox-label">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
            Featured Product
          </label>
          <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
          <input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files))} />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'} Product</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td><img src={p.images?.[0] || '/placeholder.jpg'} alt="" className="product-thumb" /></td>
              <td>{p.name} {p.featured && <span className="badge">Featured</span>}</td>
              <td>{p.category}</td>
              <td>₹{p.discountedPrice || p.price}</td>
              <td>
                <input type="number" className="stock-input" value={p.stock} onChange={e => handleStockUpdate(p._id, e.target.value)} min="0" />
              </td>
              <td>
                <button className="btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                <button className="btn-sm danger" onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { adminAPI.getOrders().then(setOrders).catch(() => setOrders([])); }, []);

  const updateStatus = async (id, status) => {
    try { await adminAPI.updateOrderStatus(id, status); setOrders(await adminAPI.getOrders()); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1>Orders</h1>
      <table className="admin-table">
        <thead><tr><th>Order ID</th><th>User</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o.orderId}</td>
              <td>{o.user?.email}</td>
              <td>{o.items?.length} items</td>
              <td>₹{o.subtotal}</td>
              <td><span className={`status ${o.status}`}>{o.status}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>
                <select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => { adminAPI.getUsers().then(setUsers).catch(() => setUsers([])); }, []);

  const updateRole = async (id, role) => {
    try { await adminAPI.updateUser(id, { role }); setUsers(await adminAPI.getUsers()); } catch (err) { alert(err.message); }
  };

  const toggleActive = async (id, isActive) => {
    try { await adminAPI.updateUser(id, { isActive }); setUsers(await adminAPI.getUsers()); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1>Users</h1>
      <table className="admin-table">
        <thead><tr><th>Email</th><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td>{u.name || '-'}</td>
              <td>{u.phone || '-'}</td>
              <td>
                <select value={u.role} onChange={e => updateRole(u._id, e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td><span className={`status ${u.isActive !== false ? 'active' : 'inactive'}`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn-sm" onClick={() => toggleActive(u._id, !u.isActive)}>{u.isActive !== false ? 'Deactivate' : 'Activate'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => { adminAPI.getReviews().then(setReviews).catch(() => setReviews([])); }, []);

  const approve = async (id, isApproved) => {
    try { await adminAPI.approveReview(id, isApproved); setReviews(await adminAPI.getReviews()); } catch (err) { alert(err.message); }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try { await adminAPI.deleteReview(id); setReviews(await adminAPI.getReviews()); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1>Reviews</h1>
      <table className="admin-table">
        <thead><tr><th>Product</th><th>User</th><th>Rating</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {reviews.map(r => (
            <tr key={r._id}>
              <td>{r.product?.name}</td>
              <td>{r.user?.email}</td>
              <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
              <td>{r.title} - {r.comment}</td>
              <td><span className={`status ${r.isApproved ? 'approved' : 'pending'}`}>{r.isApproved ? 'Approved' : 'Pending'}</span></td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>
                {!r.isApproved && <button className="btn-sm" onClick={() => approve(r._id, true)}>Approve</button>}
                {r.isApproved && <button className="btn-sm" onClick={() => approve(r._id, false)}>Reject</button>}
                <button className="btn-sm danger" onClick={() => deleteReview(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Transactions() {
  const [txns, setTxns] = useState([]);
  useEffect(() => { adminAPI.getTransactions().then(setTxns).catch(() => setTxns([])); }, []);

  return (
    <div>
      <h1>Transactions</h1>
      <table className="admin-table">
        <thead><tr><th>Txn ID</th><th>Order</th><th>User</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {txns.map(t => (
            <tr key={t._id}>
              <td>{t.transactionId}</td>
              <td>{t.orderId}</td>
              <td>{t.user?.email}</td>
              <td>₹{t.amount}</td>
              <td>{t.paymentMethod}</td>
              <td><span className={`status ${t.paymentStatus}`}>{t.paymentStatus}</span></td>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="transactions" element={<Transactions />} />
      </Routes>
    </AdminLayout>
  );
}
