import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/collections?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = [
    { name: "Men's Collection", slug: 'mens-collection' },
    { name: "Women's Collection", slug: 'womens-collection' },
    { name: "Kids Collection", slug: 'kids-collection' },
    { name: 'General Items', slug: 'general-items' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'God Items', slug: 'god-items' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="header-top">
          <div className="container header-inner">
            <Link to="/" className="logo">
              <span className="logo-icon">அ</span>
              <span className="logo-text">AADAIUDAI</span>
            </Link>
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search sarees, kurtis, dresses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <select className="search-category" onChange={(e) => e.target.value && navigate(`/collections/${e.target.value}`)}>
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary search-btn">Search</button>
            </form>
            <nav className="header-nav">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-link">Admin Panel</Link>
                  )}
                  <Link to="/cart" className="nav-link">Cart</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <button onClick={handleLogout} className="btn btn-secondary nav-btn">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/cart" className="nav-link">Cart</Link>
                  <Link to="/admin/login" className="nav-link">Admin</Link>
                  <Link to="/login" className="btn btn-primary nav-btn">Login</Link>
                </>
              )}
            </nav>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              ☰
            </button>
          </div>
        </div>
        <nav className={`nav-main ${menuOpen ? 'open' : ''}`}>
          <div className="container">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            {categories.map((c) => (
              <Link key={c.slug} to={`/collections/${c.slug}`}>{c.name}</Link>
            ))}
            <Link to="/collections">All Collections</Link>
          </div>
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-section">
            <h3>AADAIUDAI</h3>
            <p>Your trusted destination for authentic Indian ethnic wear. Quality fabrics, traditional designs, modern comfort.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/collections">Collections</Link>
          </div>
          <div className="footer-section">
            <h4>Categories</h4>
            {categories.map((c) => (
              <Link key={c.slug} to={`/collections/${c.slug}`}>{c.name}</Link>
            ))}
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📍 123 Fashion Street, Chennai, TN 600001</p>
            <p>📞 +91 98765 43210</p>
            <p>✉️ support@aadaiudai.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AADAIUDAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
