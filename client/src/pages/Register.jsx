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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.register(form);
            login(res.user, res.token);
            alert('Welcome to AADAIUDAI! Registration successful.');
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page signup-mode">
            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="aadai-badge">JOIN US</div>
                    <h1>Create Account</h1>
                    <p>Be part of the AADAIUDAI family</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
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
                        {loading ? 'Creating Account...' : 'Sign Up Now'}
                    </button>
                </form>

                {error && <div className="error-box">{error}</div>}

                <div className="login-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
}
