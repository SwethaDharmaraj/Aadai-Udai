import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderAPI, cartAPI, authAPI } from '../api';
import './Checkout.css';
import { generateInvoice } from '../utils/invoiceGenerator';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNow;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('address');

  const [user, setUser] = useState(null);

  useEffect(() => {
    authAPI.getMe().then((u) => {
      // u is { ...user, profile } from Supabase migration
      const userData = {
        id: u.id,
        email: u.email,
        role: u.profile?.role || 'user',
        name: u.profile?.name || u.user_metadata?.name,
        addresses: u.profile?.addresses || []
      };
      setUser(userData);
      setAddresses(userData.addresses);
      const def = userData.addresses.find((a) => a.isDefault);
      setSelectedAddress(def?.id || def?._id || (userData.addresses?.[0]?.id || userData.addresses?.[0]?._id) || '');
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const initiateRazorpay = (orderData) => {
    const options = {
      key: orderData.razorpayKey,
      amount: orderData.razorpayOrder.amount,
      currency: orderData.razorpayOrder.currency,
      name: 'AADAIUDAI',
      description: 'Order Payment',
      order_id: orderData.razorpayOrder.id,
      handler: async (response) => {
        setLoading(true);
        try {
          const txn = orderData.transaction || {};
          const tId = txn.transaction_id || txn.transactionId || txn.id;

          console.log('[PAYMENT-DEBUG] Order Data:', orderData);
          console.log('[PAYMENT-DEBUG] Extracted Txn ID:', tId);
          console.log('[PAYMENT-DEBUG] Razorpay Response:', response);

          await orderAPI.confirmPayment({
            transactionId: tId,
            transaction_id: tId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            isDemo: false
          });
          setOrder(orderData);
          setStep('success');
        } catch (err) {
          console.error('[PAYMENT-DEBUG] Confirm Payment Failed:', err);
          alert('Payment verification failed: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#D4AF37',
      },
    };

    if (!window.Razorpay) {
      alert('Razorpay SDK failed to load. Please check your internet connection and refresh the page.');
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert('Payment failed: ' + response.error.description);
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please add and select a delivery address');
      return;
    }
    setLoading(true);
    try {
      let result;
      if (buyNowItem) {
        result = await orderAPI.createBuyNow({
          productId: buyNowItem.productId,
          quantity: buyNowItem.quantity,
          size: buyNowItem.size,
          addressId: selectedAddress,
        });
      } else {
        result = await orderAPI.createFromCart(selectedAddress);
      }
      setOrder(result);
      if (result.isDemo) {
        setStep('payment');
      } else {
        initiateRazorpay(result);
      }
    } catch (err) {
      alert(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('');

  const handleDemoPayment = async (method) => {
    const tId = order?.transaction?.transaction_id || order?.transaction?.transactionId || order?.transaction?.id;
    if (!tId) {
      alert('Error: Transaction ID missing. Please try placing your order again.');
      return;
    }

    setLoading(true);
    try {
      await orderAPI.confirmPayment({
        transactionId: tId,
        transaction_id: tId, // Send both
        paymentMethod: method,
        isDemo: true
      });
      setPaymentMethod(method);
      setStep('success');
    } catch (err) {
      alert('Payment failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="checkout-page container fade-in">
        <div className="checkout-success">
          <div className="success-icon">✅</div>
          <h1>Order Placed Successfully!</h1>
          <p>Order ID: <strong>{order?.order?.order_id || order?.order?.orderId}</strong></p>
          <p>Payment Mode: <strong>{order?.transaction?.payment_method || order?.transaction?.paymentMethod || paymentMethod}</strong></p>
          <p className="delivery-note">Your beautiful outfit will reach you soon!</p>
          <div className="success-actions">
            <button className="btn btn-gold" onClick={() => generateInvoice(order.order, order.transaction)}>
              📄 Download Invoice
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>View Order Status</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container fade-in">
      <h1 className="section-title">Checkout</h1>

      {step === 'address' && (
        <div className="checkout-form">
          <h2>1. Select Delivery Address</h2>
          {addresses.length === 0 ? (
            <div className="no-address">
              <p>No addresses found.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Add Address in Profile</button>
            </div>
          ) : (
            <div className="address-list">
              {addresses.map((a) => (
                <label key={a.id || a._id} className={`address-option card-hover ${(selectedAddress === a.id || selectedAddress === a._id) ? 'selected' : ''}`}>
                  <input type="radio" name="addr" value={a.id || a._id} checked={selectedAddress === a.id || selectedAddress === a._id} onChange={() => setSelectedAddress(a.id || a._id)} />
                  <div className="addr-details">
                    <strong>{a.name}</strong> <span className="phone">{a.phone}</span><br />
                    <p>{a.addressLine1}, {a.city}, {a.state} - {a.pincode}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={loading || !selectedAddress}>
            {loading ? 'Securing Order...' : 'Proceed to Payment Selection'}
          </button>
        </div>
      )}

      {step === 'payment' && order && (
        <div className="payment-section fade-in">
          <h2>2. How would you like to pay?</h2>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Order ID:</span>
              <strong>{order.order?.order_id || order.order?.orderId}</strong>
            </div>
            <div className="summary-row total">
              <span>Amount to Pay:</span>
              <strong>₹{order.order?.total_amount || order.order?.subtotal}</strong>
            </div>
          </div>

          <div className="payment-methods">
            <button className={`method-tab ${paymentMethod === 'UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('UPI')}>
              <span className="icon">📱</span> UPI / QR Scan
            </button>
            <button className={`method-tab ${paymentMethod === 'Card' ? 'active' : ''}`} onClick={() => setPaymentMethod('Card')}>
              <span className="icon">💳</span> Credit / Debit Card
            </button>
            <button className={`method-tab ${paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setPaymentMethod('COD')}>
              <span className="icon">💵</span> Cash on Delivery
            </button>
          </div>

          <div className="payment-detail-box">
            {paymentMethod === 'UPI' && (
              <div className="upi-payment text-center">
                <h3>Scan to Pay</h3>
                <div className="qr-container">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=aadaiudai@upi&pn=AADAIUDAI&am=${order.order?.total_amount || order.order?.subtotal}&cu=INR`} alt="QR Code" />
                </div>
                <p>Scan this QR using Google Pay, PhonePe, or Any UPI App</p>
                <button className="btn btn-gold" onClick={() => handleDemoPayment('UPI')} disabled={loading}>
                  {loading ? 'Verifying...' : 'Click After Scanning'}
                </button>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="card-payment">
                <h3>Card Details</h3>
                <div className="mock-card-form">
                  <input className="input" placeholder="Card Number" maxLength={16} />
                  <div className="row">
                    <input className="input" placeholder="MM/YY" maxLength={5} />
                    <input className="input" placeholder="CVV" maxLength={3} />
                  </div>
                  <input className="input" placeholder="Name on Card" />
                </div>
                <button className="btn btn-gold w-100" onClick={() => handleDemoPayment('Card')} disabled={loading}>
                  {loading ? 'Processing...' : `Pay ₹${order.order?.total_amount || order.order?.subtotal}`}
                </button>
              </div>
            )}

            {paymentMethod === 'COD' && (
              <div className="cod-payment text-center">
                <h3>Cash on Delivery</h3>
                <p>You can pay via cash or QR when the delivery partner arrives.</p>
                <p className="note">Note: A small fee might apply for COD in some regions.</p>
                <button className="btn btn-gold" onClick={() => handleDemoPayment('COD')} disabled={loading}>
                  {loading ? 'Confirming...' : 'Place Order (COD)'}
                </button>
              </div>
            )}

            {!paymentMethod && (
              <p className="select-prompt">Please select a payment method above to continue.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
