import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      sessionStorage.removeItem('user');
      setLoading(false);
      return;
    }
    try {
      const data = await authAPI.getMe();
      // data is { ...user, profile: { ... } }
      const userData = {
        id: data.id,
        email: data.email,
        role: data.profile?.role || 'user',
        name: data.profile?.name || data.user_metadata?.name
      };
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch {
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch { }
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser((u) => (u ? { ...u, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
