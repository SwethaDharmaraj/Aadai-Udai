import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { productAPI } from '../api';
import './Collections.css';

const CATEGORIES = [
  { slug: 'mens-collection', name: "Men's Collection" },
  { slug: 'womens-collection', name: "Women's Collection" },
  { slug: 'kids-collection', name: "Kids Collection" },
  { slug: 'general-items', name: 'General Items' },
  { slug: 'accessories', name: 'Accessories' },
  { slug: 'god-items', name: 'God Items' },
];

export default function Collections() {
  const [searchParams] = useSearchParams();
  const { category: categoryParam } = useParams();
  const search = searchParams.get('search') || '';
  const category = categoryParam && CATEGORIES.some(c => c.slug === categoryParam) ? categoryParam : searchParams.get('category') || null;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    productAPI.getAll(params).then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="collections-page container">
      <h1 className="section-title">Dress Collections</h1>

      <div className="collections-layout">
        <aside className="filters">
          <h3>Categories</h3>
          <Link to="/collections" className={!category ? 'active' : ''}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/collections/${c.slug}`} className={category === c.slug ? 'active' : ''}>
              {c.name}
            </Link>
          ))}
        </aside>

        <div className="products-section">
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p className="empty">No products found.</p>
          ) : (
            <div className="products-grid">
              {products.map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="product-card">
                  <div className="product-img">
                    <img src={p.images?.[0] || 'https://via.placeholder.com/300'} alt={p.name} />
                    {p.discountedPrice && <span className="badge">Sale</span>}
                    {p.stock === 0 && <span className="badge out">Out of Stock</span>}
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
                    <p className="stock">Sizes: {p.sizes?.join(', ') || 'One Size'} | Stock: {p.stock}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
