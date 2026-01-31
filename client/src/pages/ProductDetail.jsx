import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, cartAPI } from '../api';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getById(id).then((p) => {
      setProduct(p);
      setSize(''); // Force user to select a size
    }).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!size) {
      alert('Please select a size first');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await cartAPI.add({ productId: id, quantity: qty, size });
      navigate('/cart');
    } catch (err) {
      alert(err.message);
    }
  };

  const buyNow = () => {
    if (!size) {
      alert('Please select a size first');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { buyNow: { productId: id, quantity: qty, size } } });
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!product) return <div className="container"><p>Product not found.</p></div>;

  const price = product.discountedPrice ?? product.price;

  return (
    <div className="product-detail-page container">
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="main-image">
            <img src={size ? (product.images?.[0] || '') : (product.images?.[0] || '')} alt={product.name} />
          </div>
          <div className="thumbnail-strip">
            {(product.images || []).map((img, i) => (
              <img key={i} src={img} alt={`${product.name} ${i + 1}`} className="thumb" />
            ))}
          </div>
        </div>
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="category">{product.category} {product.subCategory && `> ${product.subCategory}`}</p>
          <div className="price-row">
            {product.discountedPrice ? (
              <><span className="old">₹{product.price}</span> <span className="price">₹{product.discountedPrice}</span></>
            ) : (
              <span className="price">₹{product.price}</span>
            )}
          </div>
          <p className="description">{product.description}</p>
          <div className="sizes">
            <label>Select Size <span className="required">*</span></label>
            <div className="size-options">
              {(product.sizes || []).map((s) => (
                <button key={s} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
            {!size && <p className="size-warning">Please select a size to continue</p>}
          </div>
          <div className="quantity">
            <label>Quantity</label>
            <input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <p className="stock-status">In stock: {product.stock}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={addToCart} disabled={product.stock === 0 || !size}>
              Add to Cart
            </button>
            <button className="btn btn-gold" onClick={buyNow} disabled={product.stock === 0 || !size}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
