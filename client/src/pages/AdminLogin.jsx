import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from './Login';

export default function AdminLogin() {
  const token = localStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (token && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Login isAdmin={true} />;
}
