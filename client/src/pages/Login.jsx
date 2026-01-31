import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login({ isAdmin = false }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(isAdmin ? 'admin@aadaiudai.com' : '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevOtp('');
    
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(email);
      setMessage(res.message || 'OTP sent');
      setDevOtp(res.devOtp || '');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email, otp);
      login(res.user, res.token);
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const title = isAdmin ? 'Admin Login' : 'User Login';
  const subtitle = isAdmin ? 'Admin dashboard access' : 'Shop and place orders';

  return (
    <div className={`login-page ${isAdmin ? 'admin-login' : ''}`}>
      <div className="login-card">
        <div className="login-header">
          <h1>AADAIUDAI</h1>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="login-form">
            <label>Email Address</label>
            <input
              type="email"
              placeholder={isAdmin ? "admin@aadaiudai.com" : "Enter your email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <p className="otp-sent">OTP sent to {email}</p>
            {message && <p className="success-msg">{message}</p>}
            {devOtp && (
              <div className="dev-otp-box">
                <p>Your OTP (for testing):</p>
                <p className="otp-display">{devOtp}</p>
              </div>
            )}
            <label>Enter OTP</label>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input"
              maxLength={6}
              required
            />
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" className="link-btn" onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); setDevOtp(''); }}>
              Change email
            </button>
          </form>
        )}

        {error && <p className="error-msg">{error}</p>}

        {isAdmin && (
          <p className="login-note">
            <strong>Admin:</strong> admin@aadaiudai.com | OTP: 123456
          </p>
        )}
        {!isAdmin && (
          <p className="login-note">
            New? Enter your email to register. OTP valid for 5 min.
          </p>
        )}

        {isAdmin ? (
          <Link to="/" className="back-home">← Back to Store</Link>
        ) : (
          <Link to="/admin/login" className="admin-link">Admin? Login here</Link>
        )}
      </div>
    </div>
  );
}
