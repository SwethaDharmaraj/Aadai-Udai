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
            <p key={p.id}>{p.name} - Only {p.stock} left</p>
          ))}
        </div>
      )}

      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>User</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {(data.recentOrders || []).map(o => (
              <tr key={o.id}>
                <td>{o.orderId || o.id}</td>
                <td>{o.profiles?.email || o.user?.email}</td>
                <td>₹{o.total_amount || o.subtotal}</td>
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
  const [form, setForm] = useState({ name: '', description: '', category: 'MEN\'S COLLECTION', price: '', discountedPrice: '', sizes: 'S,M,L', stock: '0', featured: false, imageUrl: '', variantStock: {} });
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
    // Calculate total stock if variantStock is used
    const sizeList = form.sizes.split(',').map(s => s.trim()).filter(s => s);
    const hasVariants = sizeList.length > 0;

    // Clean variantStock to only include current sizes
    const cleanVariantStock = {};
    let totalVariantStock = 0;

    if (hasVariants) {
      sizeList.forEach(size => {
        const qty = parseInt(form.variantStock[size] || 0);
        cleanVariantStock[size] = qty;
        totalVariantStock += qty;
      });
      formData.append('variantStock', JSON.stringify(cleanVariantStock));
      formData.append('stock', totalVariantStock); // Override manual stock with calculated total
    } else {
      formData.append('stock', form.stock);
    }

    imageFiles.forEach(f => formData.append('images', f));

    try {
      if (editing) {
        await adminAPI.updateProduct(editing.id, formData);
      } else {
        await adminAPI.createProduct(formData);
      }
      loadProducts();
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'MEN\'S COLLECTION', price: '', discountedPrice: '', sizes: 'S,M,L', stock: '0', featured: false, imageUrl: '', variantStock: {} });
    setImageFiles([]);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category,
      price: p.price,
      discountedPrice: p.discounted_price || p.discountedPrice || '',
      sizes: p.sizes?.join(',') || 'S,M,L',
      stock: p.stock,
      featured: p.featured,
      imageUrl: '',
      variantStock: p.variant_stock || {}
    });
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

          {/* Variant Stock Inputs */}
          {form.sizes && (
            <div className="variant-stock-inputs">
              <label>Stock per Size:</label>
              <div className="stock-grid">
                {form.sizes.split(',').map(s => s.trim()).filter(s => s).map(size => (
                  <div key={size} className="stock-item">
                    <span>{size}:</span>
                    <input
                      type="number"
                      min="0"
                      value={form.variantStock[size] || 0}
                      onChange={e => setForm({
                        ...form,
                        variantStock: { ...form.variantStock, [size]: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <input type="number" placeholder="Total Stock (Auto-calculated if sizes exist)" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} disabled={form.sizes.length > 0 && form.sizes.split(',').filter(s => s.trim()).length > 0} required />
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
            <tr key={p.id}>
              <td><img src={p.images?.[0] || '/placeholder.jpg'} alt="" className="product-thumb" /></td>
              <td>{p.name} {p.featured && <span className="badge">Featured</span>}</td>
              <td>{p.category}</td>
              <td>₹{p.discounted_price || p.discountedPrice || p.price}</td>
              <td>
                <input type="number" className="stock-input" value={p.stock} onChange={e => handleStockUpdate(p.id, e.target.value)} min="0" />
              </td>
              <td>
                <button className="btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                <button className="btn-sm danger" onClick={() => handleDelete(p.id)}>Delete</button>
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
            <tr key={o.id}>
              <td>{o.orderId || o.id}</td>
              <td>{o.profiles?.email || o.user?.email}</td>
              <td>{o.order_items?.length || o.items?.length} items</td>
              <td>₹{o.total_amount || o.subtotal}</td>
              <td><span className={`status ${o.status}`}>{o.status}</span></td>
              <td>{new Date(o.created_at || o.createdAt).toLocaleDateString()}</td>
              <td>
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
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
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.name || '-'}</td>
              <td>{u.phone || '-'}</td>
              <td>
                <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td><span className={`status ${u.is_active !== false ? 'active' : 'inactive'}`}>{u.is_active !== false ? 'Active' : 'Inactive'}</span></td>
              <td>{new Date(u.created_at || u.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn-sm" onClick={() => toggleActive(u.id, !u.is_active)}>{u.is_active !== false ? 'Deactivate' : 'Activate'}</button>
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
            <tr key={r.id}>
              <td>{r.products?.name || r.product?.name}</td>
              <td>{r.profiles?.email || r.user?.email}</td>
              <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
              <td>{r.comment}</td>
              <td><span className={`status ${r.is_approved ? 'approved' : 'pending'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span></td>
              <td>{new Date(r.created_at || r.createdAt).toLocaleDateString()}</td>
              <td>
                {!r.is_approved && <button className="btn-sm" onClick={() => approve(r.id, true)}>Approve</button>}
                {r.is_approved && <button className="btn-sm" onClick={() => approve(r.id, false)}>Reject</button>}
                <button className="btn-sm danger" onClick={() => deleteReview(r.id)}>Delete</button>
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
            <tr key={t.id}>
              <td>{t.transaction_id || t.transactionId}</td>
              <td>{t.order_id || t.orderId}</td>
              <td>{t.profiles?.email || t.user?.email}</td>
              <td>₹{t.amount}</td>
              <td>{t.payment_method || t.paymentMethod}</td>
              <td><span className={`status ${t.payment_status || t.paymentStatus}`}>{t.payment_status || t.paymentStatus}</span></td>
              <td>{new Date(t.created_at || t.createdAt).toLocaleString()}</td>
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
