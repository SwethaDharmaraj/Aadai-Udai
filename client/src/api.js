const API = (window.location.protocol === 'file:' || window.electronAPI)
  ? 'http://127.0.0.1:5001/api'
  : '/api';

const getToken = () => localStorage.getItem('token');

/**
 * Clean Request Handler
 * Definitive fix for Error: {}
 */
const request = async (path, options = {}) => {
  const token = getToken();

  // LOG EVERYTHING LOUDLY
  console.log(`[API-CLIENT] Calling: ${path}`);
  console.log('[API-CLIENT] Token Status:', token ? 'Bearer present' : 'MISSING');

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.body) {
    console.log('[API-CLIENT] Body:', options.body);
  }

  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    console.log(`[API-CLIENT] Status: ${res.status}`, data);

    if (!res.ok) {
      const msg = data.error || data.message || JSON.stringify(data);
      throw new Error(msg === '{}' ? `Request Failed (${res.status})` : msg);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Connection Error: Is the backend server running?');
    }
    throw err;
  }
};

export const authAPI = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  verifyOTP: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const userAPI = {
  updateProfile: (data) => request('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  addAddress: (data) => request('/users/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (data) => request('/users/addresses', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAddress: (id) => request(`/users/addresses/${id}`, { method: 'DELETE' }),
  getOrders: () => request('/users/orders'),
  getTransactions: () => request('/users/transactions'),
};

export const productAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? '?' + q : ''}`);
  },
  getById: (id) => request(`/products/${id}`),
};

export const cartAPI = {
  get: () => request('/cart'),
  add: (data) => request('/cart', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => request('/cart', { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
};

export const orderAPI = {
  createFromCart: (addressId) => request('/orders/from-cart', { method: 'POST', body: JSON.stringify({ addressId }) }),
  createBuyNow: (data) => request('/orders/buy-now', { method: 'POST', body: JSON.stringify(data) }),
  confirmPayment: (payload) => request('/orders/confirm-payment', { method: 'POST', body: JSON.stringify(payload) }),
  getOrder: (id) => request(`/orders/${id}`),
  getOrderByTxn: (id) => request(`/orders/${id}/transaction`),
};

export const reviewAPI = {
  getProductReviews: (productId) => request(`/reviews/product/${productId}`),
  addReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getMyReviews: () => request('/reviews/my'),
};

export const adminAPI = {
  dashboard: () => request('/admin/dashboard'),
  getUsers: () => request('/admin/users'),
  getUserById: (id) => request(`/admin/users/${id}`),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getProducts: () => request('/admin/products'),
  createProduct: (formData) => request('/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => request(`/admin/products/${id}`, { method: 'PATCH', body: formData }),
  updateStock: (id, stock) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  getOrders: () => request('/admin/orders'),
  getOrderById: (id) => request(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getTransactions: () => request('/admin/transactions'),
  getReviews: () => request('/admin/reviews'),
  approveReview: (id, isApproved) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ isApproved }) }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
