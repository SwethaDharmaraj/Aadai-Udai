import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartAPI } from '../api';
import './Cart.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cartAPI.get().then(setCart).catch(() => setCart({ items: [] })).finally(() => setLoading(false));
  }, []);

  const updateQty = async (itemId, quantity) => {
    try {
      const updated = await cartAPI.update({ itemId, quantity });
      setCart(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const updated = await cartAPI.remove(itemId);
      setCart(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container"><p>Loading cart...</p></div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + (i.product?.discountedPrice ?? i.product?.price) * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-page container">
        <h1 className="section-title">Your Cart</h1>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/collections" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="section-title">Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const p = item.product;
            const price = p?.discountedPrice ?? p?.price;
            return (
              <div key={item._id} className="cart-item">
                <img src={p?.images?.[0]} alt={p?.name} />
                <div className="cart-item-info">
                  <h3>{p?.name}</h3>
                  <p>Size: {item.size} | ₹{price} each</p>
                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button onClick={() => updateQty(item._id, Math.max(1, item.quantity - 1))}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeItem(item._id)}>Remove</button>
                  </div>
                </div>
                <div className="cart-item-price">₹{price * item.quantity}</div>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <p>Subtotal: ₹{subtotal}</p>
          <Link to="/checkout" className="btn btn-primary btn-full">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}
