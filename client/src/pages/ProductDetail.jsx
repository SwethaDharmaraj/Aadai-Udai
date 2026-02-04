import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { productAPI, cartAPI } from '../api';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    productAPI.getById(id).then((p) => {
      setProduct(p);
      setSize(''); // Force user to select a size
      setSelectedImageIndex(0); // Reset image on product load
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

  const price = product.discounted_price || product.discountedPrice || product.price;
  const images = product.images || [];
  const mainImage = images[selectedImageIndex] || images[0] || '';


  const getStockForSize = (s) => {
    if (!product) return 0;
    if (product.variant_stock && product.variant_stock[s] !== undefined) {
      return parseInt(product.variant_stock[s]);
    }
    // Fallback logic: if no variant stock, assume global stock applies to all (or just checking global)
    // But if variant_stock exists for ANY size, we should probably assume it exists for all.
    // If variant_stock is empty/null, return product.stock
    if (product.variant_stock && Object.keys(product.variant_stock).length > 0) {
      return 0; // If variant stock system is active but this size missing, assume 0
    }
    return product.stock;
  };

  const currentStock = size ? getStockForSize(size) : product.stock;
  const isOutOfStock = size ? currentStock === 0 : product.stock === 0;

  return (
    <div className="product-detail-page container">
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="main-image">
            {mainImage ? (
              <Zoom>
                <img src={mainImage} alt={product.name} />
              </Zoom>
            ) : (
              <div className="placeholder-image">No Image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumbnail-strip">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  className={`thumb ${selectedImageIndex === i ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="category">{product.category} {(product.sub_category || product.subCategory) && `> ${product.sub_category || product.subCategory}`}</p>
          <div className="price-row">
            {(product.discounted_price || product.discountedPrice) ? (
              <><span className="old">₹{product.price}</span> <span className="price">₹{product.discounted_price || product.discountedPrice}</span></>
            ) : (
              <span className="price">₹{product.price}</span>
            )}
          </div>
          <p className="description">{product.description}</p>
          <div className="sizes">
            <label>Select Size <span className="required">*</span></label>
            <div className="size-options">
              {(product.sizes || []).map((s) => {
                const stock = getStockForSize(s);
                return (
                  <button
                    key={s}
                    className={`${size === s ? 'active' : ''} ${stock === 0 ? 'out-of-stock' : ''}`}
                    onClick={() => setSize(s)}
                    disabled={stock === 0}
                    title={stock === 0 ? 'Out of Stock' : `${stock} available`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {!size && <p className="size-warning">Please select a size to continue</p>}
          </div>

          <div className="quantity">
            <label>Quantity</label>
            <input
              type="number"
              min={1}
              max={size ? currentStock : product.stock}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(parseInt(e.target.value) || 1, size ? currentStock : product.stock)))}
              disabled={isOutOfStock}
            />
          </div>

          <p className={`stock-status ${currentStock < 5 ? 'low' : ''} ${currentStock === 0 ? 'out' : ''}`}>
            {size
              ? (currentStock > 0 ? `In Stock: ${currentStock} units` : 'Out of Stock')
              : (product.stock > 0 ? 'In Stock' : 'Out of Stock')}
          </p>

          <div className="actions">
            <button className="btn btn-primary" onClick={addToCart} disabled={isOutOfStock || !size}>
              Add to Cart
            </button>
            <button className="btn btn-gold" onClick={buyNow} disabled={isOutOfStock || !size}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
