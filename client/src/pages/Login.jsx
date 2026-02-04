import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login({ isAdmin = false }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(isAdmin ? 'admin@aadaiudai.com' : '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      // res is { user, session }
      login(res.user, res.session.access_token);

      // Force navigation based on role
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('[LOGIN-FAIL]', err);
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed') || msg.includes('not verified')) {
        setError('Your email is not verified yet. Please check your inbox for the link.');
      } else if (msg.includes('invalid login credentials')) {
        setError('Invalid email or password. If you don\'t have an account, please Register first.');
      } else {
        setError(err.message || 'Login failed. Check your credentials.');
      }
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
      const res = await authAPI.verifyOTP({ email, token: otp, type: 'signup' });
      // If verification returns a session, log them in
      if (res.session) {
        login(res.user, res.session.access_token);
        navigate(res.user?.role === 'admin' ? '/admin' : '/');
      } else {
        setMessage('Email verified! You can now login.');
        setStep(1);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP or code expired');
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
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder={isAdmin ? "admin@aadaiudai.com" : "Enter your email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full shadow-hover" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
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
            <div className="form-group">
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
            </div>
            <button type="submit" className="btn btn-primary btn-full shadow-hover" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Complete Login'}
            </button>
            <button type="button" className="link-btn" onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); setDevOtp(''); }}>
              Back to Login
            </button>
          </form>
        )}

        {error && <p className="error-msg">{error}</p>}

        {isAdmin && (
          <p className="login-note">
            <strong>Admin:</strong> admin@aadaiudai.com | Pass: admin123 (after setup)
          </p>
        )}
        {!isAdmin && step === 1 && (
          <div className="login-footer">
            <p>New here? <Link to="/register">Create an account</Link></p>
          </div>
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
