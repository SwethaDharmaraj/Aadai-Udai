import React from 'react';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>About AADAIUDAI</h1>
          <p className="tagline">Where Tradition Meets Modern Elegance</p>
        </div>
      </section>

      <section className="about-content container">
        <div className="about-intro">
          <h2>Our Story</h2>
          <p>
            AADAIUDAI was founded with a vision to bring authentic Indian ethnic wear to every doorstep.
            We believe that traditional clothing is not just fabric—it's heritage, culture, and identity.
            From handwoven sarees to designer kurtis, we curate collections that celebrate Indian craftsmanship.
          </p>
        </div>

        <div className="about-values">
          <h2>Vision & Mission</h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="value-icon">🎯</span>
              <h3>Vision</h3>
              <p>To be India's most trusted ethnic wear brand, preserving traditional artistry while embracing contemporary style.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">💫</span>
              <h3>Mission</h3>
              <p>To offer premium quality ethnic wear at fair prices, with exceptional customer service and nationwide delivery.</p>
            </div>
          </div>
        </div>

        <div className="about-location">
          <h2>Store Location & Contact</h2>
          <div className="location-card">
            <div className="location-info">
              <h4>📍 Our Store</h4>
              <p>AadaiUdai, 4/463, VPN Towers , Vijayapuri Main Road, Vijayamangalam,Erode - 638056, Tamilnadu, India
              </p>
              <h4>📞 Phone</h4>
              <p>+91 8122635618</p>
              <h4>✉️ Email</h4>
              <p>support@ aadaiudai21@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="trust-badges">
          <h2>Why Choose Us</h2>
          <div className="badges-grid">
            <div className="badge-item">
              <span>🚚</span>
              <h4>Fast Delivery</h4>
              <p>Pan-India shipping. Free delivery on orders above ₹999.</p>
            </div>
            <div className="badge-item">
              <span>✓</span>
              <h4>Authentic Products</h4>
              <p>100% genuine fabrics. Quality assured.</p>
            </div>
            <div className="badge-item">
              <span>🔄</span>
              <h4>Easy Returns</h4>
              <p>7-day return policy. No questions asked.</p>
            </div>
            <div className="badge-item">
              <span>💳</span>
              <h4>Secure Payment</h4>
              <p>UPI, Google Pay. Safe & secure checkout.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
