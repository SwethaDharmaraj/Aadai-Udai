import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Signup, 2: OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Basic format check
        if (!form.email.includes('@') || !form.email.includes('.')) {
            setError('Please enter a valid email address.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const data = await authAPI.register({
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password
            });

            if (data.requiresVerification) {
                setStep(2); // Move to "Check Email" step
            } else {
                alert('Account ready! You can now log in.');
                navigate('/login');
            }
        } catch (err) {
            console.error('[SIGNUP-FAIL]', err);
            setError(err.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page signup-mode">
            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="aadai-badge">{step === 1 ? 'JOIN US' : 'VERIFY'}</div>
                    <h1>{step === 1 ? 'Create Account' : 'Check Your Inbox'}</h1>
                    <p>{step === 1 ? 'Be part of the AADAIUDAI family' : `We've sent a verification link to ${form.email}`}</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSignup} className="login-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={form.name}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email ID</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="10-digit mobile"
                                value={form.phone}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full shadow-hover" disabled={loading}>
                            {loading ? 'Processing...' : 'Sign Up Now'}
                        </button>
                    </form>
                ) : (
                    <div className="verification-notice">
                        <div className="icon-box">✉️</div>
                        <p>A verification link has been sent to <strong>{form.email}</strong>.</p>
                        <p>Please click the link in the email to activate your account. Check your spam folder if you don't see it!</p>
                        <button onClick={() => navigate('/login')} className="btn btn-primary btn-full mt-4">
                            Go to Login
                        </button>
                        <button onClick={() => setStep(1)} className="btn btn-outline btn-full mt-2">
                            Back to Signup
                        </button>
                    </div>
                )}

                {error && <div className="error-box">{error}</div>}

                <div className="login-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
}
