import React, { useState, useEffect } from 'react';
import { userAPI, orderAPI } from '../api';
import './Orders.css';
import { generateInvoice } from '../utils/invoiceGenerator';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="orders-page container">
      <h1 className="section-title">Order History</h1>
      {orders.length === 0 ? (
        <p className="empty">No orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o._id} className="order-card">
              <div className="order-header">
                <span>Order #{o.orderId}</span>
                <span className={`status ${o.status}`}>{o.status}</span>
              </div>
              <div className="order-items">
                {o.items?.map((i, idx) => (
                  <div key={idx} className="order-item">
                    <img src={i.image} alt={i.name} />
                    <div>
                      <strong>{i.name}</strong>
                      <p>Qty: {i.quantity} | Size: {i.size} | ₹{i.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: ₹{o.subtotal}</strong>
                  <span className="date">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-actions">
                  <button className="btn btn-secondary btn-sm" onClick={async () => {
                    try {
                      const txn = await orderAPI.getOrderByTxn(o._id); // We'll need this API
                      generateInvoice(o, txn);
                    } catch (err) {
                      alert('Could not download invoice: ' + err.message);
                    }
                  }}>
                    Download Invoice
                  </button>
                </div>
              </div>
              <div className="order-tracking">
                <h4>Order Status</h4>
                <div className="tracking-timeline">
                  {[
                    { key: 'pending', label: 'Order Placed' },
                    { key: 'confirmed', label: 'Payment Confirmed' },
                    { key: 'packed', label: 'Packed' },
                    { key: 'shipped', label: 'Shipped' },
                    { key: 'out-for-delivery', label: 'Out for Delivery' },
                    { key: 'delivered', label: 'Delivered' }
                  ].map((step, idx) => {
                    const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered'];
                    const currentIdx = statusOrder.indexOf(o.status);
                    const stepIdx = statusOrder.indexOf(step.key);
                    const isDone = currentIdx >= stepIdx;
                    return (
                      <div key={idx} className={`tracking-step ${isDone ? 'done' : ''}`}>
                        <div className="step-dot"></div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
