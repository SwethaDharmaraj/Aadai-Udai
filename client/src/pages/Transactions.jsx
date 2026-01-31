import React, { useState, useEffect } from 'react';
import { userAPI } from '../api';
import './Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getTransactions().then(setTransactions).catch(() => setTransactions([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="transactions-page container">
      <h1 className="section-title">Transaction History</h1>
      {transactions.length === 0 ? (
        <p className="empty">No transactions yet.</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((t) => (
            <div key={t._id} className="transaction-card">
              <div className="txn-row">
                <span className="txn-id">{t.transactionId}</span>
                <span className={`status ${t.paymentStatus}`}>{t.paymentStatus}</span>
              </div>
              <div className="txn-details">
                <p>Order: {t.orderId}</p>
                <p>Amount: ₹{t.amount}</p>
                <p>Method: {t.paymentMethod}</p>
                <p>Date: {new Date(t.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
