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
        phone: u.profile?.phone || u.user_metadata?.phone,
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
      // Force UPI and other methods
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Methods',
              instruments: [
                { method: 'upi' },
                { method: 'card' },
                { method: 'netbanking' }
              ]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: true
          }
        }
      }
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

  const [gateway, setGateway] = useState(''); // 'razorpay', 'upi-qr', 'cod'

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
      setStep('payment');
    } catch (err) {
      alert(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleGatewaySelect = (choice) => {
    setGateway(choice);
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
        transaction_id: tId,
        paymentMethod: method,
        isDemo: true
      });
      setGateway('cod'); // For success message reference
      setStep('success');

      // Post-success prompt for invoice
      if (window.confirm('Order Successful! Would you like to download your invoice receipt?')) {
        generateInvoice(order.order, { ...order.transaction, payment_method: method });
      }
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
          {!gateway ? (
            <div className="gateway-selection">
              <h2>2. Select Payment Gateway</h2>
              <div className="gateway-options">
                <div className="gateway-card card-hover" onClick={() => handleGatewaySelect('razorpay')}>
                  <div className="gateway-icon">💳</div>
                  <div className="gateway-info">
                    <h3>Razorpay</h3>
                    <p>Pay via Cards, Netbanking, or Wallet (Secure)</p>
                  </div>
                  <span className="arrow">→</span>
                </div>

                <div className="gateway-card card-hover" onClick={() => handleGatewaySelect('upi-qr')}>
                  <div className="gateway-icon">📱</div>
                  <div className="gateway-info">
                    <h3>UPI / QR Scan</h3>
                    <p>Instant scan & pay with any UPI App</p>
                  </div>
                  <span className="arrow">→</span>
                </div>

                <div className="gateway-card card-hover" onClick={() => handleGatewaySelect('cod')}>
                  <div className="gateway-icon">💵</div>
                  <div className="gateway-info">
                    <h3>Cash on Delivery</h3>
                    <p>Pay when you receive the product</p>
                  </div>
                  <span className="arrow">→</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="payment-gateway-gateway fade-in">
              <button className="btn-back-selection" onClick={() => setGateway('')}>← Back to Options</button>

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

              <div className="payment-detail-box">
                {gateway === 'upi-qr' && (
                  <div className="upi-payment text-center">
                    <h3>Scan to Pay</h3>
                    <div
                      className="qr-container qr-interactive"
                      onClick={() => {
                        const tId = order?.transaction?.transaction_id || order?.transaction?.transactionId || order?.transaction?.id;
                        const oId = order?.order?.order_id || order?.order?.orderId;
                        window.open(`#/payment-success?txnId=${tId}&orderId=${oId}`, '_blank', 'width=600,height=800');
                      }}
                      title="Click to simulate scanning"
                    >
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=aadaiudai@upi&pn=AADAIUDAI&am=${order.order?.total_amount || order.order?.subtotal}&cu=INR`} alt="QR Code" />
                      <div className="qr-overlay">Click to Scan</div>
                    </div>
                    <p>Scan this QR or <strong>Click it</strong> to simulate a mobile scan</p>
                    <button className="btn btn-gold" onClick={() => handleDemoPayment('UPI-QR')} disabled={loading}>
                      {loading ? 'Verifying...' : 'Confirm Payment Status'}
                    </button>
                  </div>
                )}

                {gateway === 'razorpay' && (
                  <div className="razorpay-direct text-center">
                    <h3>Razorpay Secure Checkout</h3>
                    <div className="gateway-placeholder">
                      <div className="gateway-logos">🔒 💳 📄</div>
                      <p>You will be redirected to the secure Razorpay payment gateway.</p>
                    </div>
                    <button
                      className="btn btn-gold w-100"
                      onClick={() => initiateRazorpay(order)}
                      disabled={loading}
                    >
                      {loading ? 'Launching...' : `Launch Razorpay (Pay ₹${order.order?.total_amount || order.order?.subtotal})`}
                    </button>
                  </div>
                )}

                {gateway === 'cod' && (
                  <div className="cod-payment text-center">
                    <h3>Cash on Delivery</h3>
                    <p>Pay ₹<strong>{order.order?.total_amount || order.order?.subtotal}</strong> in cash or via mobile scanner when our delivery partner arrives at your door.</p>
                    <button className="btn btn-gold" onClick={() => handleDemoPayment('COD')} disabled={loading}>
                      {loading ? 'Confirming...' : 'Place Order (COD)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
