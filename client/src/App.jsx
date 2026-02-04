import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import Register from './pages/Register';
import Admin from './pages/Admin';

function Protected({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!token || !user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:category" element={<Collections />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Protected><Cart /></Protected>} />
          <Route path="checkout" element={<Protected><Checkout /></Protected>} />
          <Route path="profile" element={<Protected><Profile /></Protected>} />
          <Route path="orders" element={<Protected><Orders /></Protected>} />
          <Route path="transactions" element={<Protected><Transactions /></Protected>} />
          <Route path="admin/*" element={<AdminRoute><Admin /></AdminRoute>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
