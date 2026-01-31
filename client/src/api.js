const API = '/api';

const getToken = () => localStorage.getItem('token');

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const authAPI = {
  sendOTP: (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOTP: (email, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  me: () => request('/auth/me'),
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
  confirmPayment: (transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature, isDemo = false, paymentMethod = 'Razorpay') =>
    request('/orders/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature, isDemo, paymentMethod })
    }),
  getOrder: (id) => request(`/orders/${id}`),
  getOrderByTxn: (orderId) => request(`/orders/${orderId}/transaction`),
};

export const reviewAPI = {
  getProductReviews: (productId) => request(`/reviews/product/${productId}`),
  addReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getMyReviews: () => request('/reviews/my'),
};

export const adminAPI = {
  dashboard: () => request('/admin/dashboard'),
  // Users
  getUsers: () => request('/admin/users'),
  getUserById: (id) => request(`/admin/users/${id}`),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  // Products
  getProducts: () => request('/admin/products'),
  createProduct: (formData) => request('/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => request(`/admin/products/${id}`, { method: 'PATCH', body: formData }),
  updateStock: (id, stock) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  // Orders
  getOrders: () => request('/admin/orders'),
  getOrderById: (id) => request(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // Transactions
  getTransactions: () => request('/admin/transactions'),
  // Reviews
  getReviews: () => request('/admin/reviews'),
  approveReview: (id, isApproved) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ isApproved }) }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
