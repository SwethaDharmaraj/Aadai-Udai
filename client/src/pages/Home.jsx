import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api';
import './Home.css';

const BANNERS = [
  { img: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200', title: 'New Collection 2025' },
  { img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200', title: 'Traditional Elegance' },
  { img: 'https://images.unsplash.com/photo-1583391730479-43c8a2e2f614?w=1200', title: 'Festive Special' },
];

const CATEGORIES = [
  { slug: 'mens-collection', name: "Men's Collection", img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400' },
  { slug: 'womens-collection', name: "Women's Collection", img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' },
  { slug: 'kids-collection', name: "Kids Collection", img: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400' },
  { slug: 'general-items', name: 'General Items', img: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=400' },
  { slug: 'accessories', name: 'Accessories', img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
  { slug: 'god-items', name: 'God Items', img: 'https://images.unsplash.com/photo-1608508644127-ba99d7732fee?w=400' },
];

export default function Home() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    productAPI.getAll({ featured: 'true' }).then(setFeatured).catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="home">
      <section className="banner">
        <div className="banner-slides">
          {BANNERS.map((b, i) => (
            <div key={i} className={`banner-slide ${i === bannerIdx ? 'active' : ''}`}>
              <img src={b.img} alt={b.title} />
              <div className="banner-overlay">
                <h1>{b.title}</h1>
                <Link to="/collections" className="btn btn-gold">Shop Now</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="banner-dots">
          {BANNERS.map((_, i) => (
            <button key={i} className={i === bannerIdx ? 'active' : ''} onClick={() => setBannerIdx(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="categories-section container fade-in">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/collections/${c.slug}`} className="category-card card-hover">
              <img src={c.img} alt={c.name} />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section container fade-in">
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {featured.map((p) => (
            <Link key={p._id} to={`/product/${p._id}`} className="product-card card-hover">
              <div className="product-img">
                <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} />
                {p.discountedPrice && <span className="badge">Sale</span>}
              </div>
              <div className="product-info">
                <h3>{p.name}</h3>
                <div className="price">
                  {p.discountedPrice ? (
                    <><span className="old">₹{p.price}</span> <span>₹{p.discountedPrice}</span></>
                  ) : (
                    <span>₹{p.price}</span>
                  )}
                </div>
                <p className="category-tag">{p.category}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/collections" className="btn btn-primary view-all">View All Products</Link>
      </section>

      <section className="trust-section">
        <div className="container trust-grid">
          <div className="trust-item">
            <span className="trust-icon">🚚</span>
            <h4>Free Delivery</h4>
            <p>On orders above ₹999</p>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔄</span>
            <h4>Easy Returns</h4>
            <p>7-day return policy</p>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <h4>Authentic Products</h4>
            <p>100% genuine fabrics</p>
          </div>
        </div>
      </section>
    </div>
  );
}
