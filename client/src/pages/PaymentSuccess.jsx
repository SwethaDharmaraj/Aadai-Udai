import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../api';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');

    const transactionId = searchParams.get('txnId');
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (transactionId) {
            // Simulate/Confirm payment
            orderAPI.confirmPayment({
                transactionId: transactionId,
                paymentMethod: 'UPI-QR',
                isDemo: true
            })
                .then(() => setStatus('success'))
                .catch(err => {
                    console.error('QR Payment Verification Failed:', err);
                    setError(err.message || 'Verification failed');
                    setStatus('error');
                });
        } else {
            setStatus('error');
            setError('Invalid request: Missing Transaction ID');
        }
    }, [transactionId]);

    return (
        <div className="payment-success-dummy container fade-in">
            <div className="success-card">
                {status === 'processing' && (
                    <div className="loader-box">
                        <div className="spinner"></div>
                        <h2>Processing QR Payment...</h2>
                        <p>Please do not close this window.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="success-content">
                        <div className="crown-icon">👑</div>
                        <div className="success-check">✓</div>
                        <h1>Transaction Complete!</h1>
                        <p>Payment for Order <strong>#{orderId}</strong> was successful.</p>
                        <div className="order-details">
                            <div className="detail-row">
                                <span>Transaction ID:</span>
                                <code>{transactionId}</code>
                            </div>
                        </div>
                        <p className="note">This is a secure simulation of a real QR payment flow.</p>
                        <button className="btn btn-gold" onClick={() => navigate('/orders')}>
                            Go to My Orders
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="error-content">
                        <div className="error-icon">❌</div>
                        <h1>Payment Failed</h1>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
