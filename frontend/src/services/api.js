import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Menu endpoints
export const menuAPI = {
  getCategories: () => api.get('/menu/categories'),
  getMenuItems: (category) => api.get('/menu', { params: { category } }),
  getMenuItem: (id) => api.get(`/menu/${id}`),
};

// Locations endpoints
export const locationsAPI = {
  getLocations: (state) => api.get('/locations', { params: { state } }),
  getLocation: (id) => api.get(`/locations/${id}`),
};

// Cart endpoints
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  updateCartItem: (id, data) => api.put(`/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/cart/${id}`),
  clearCart: () => api.delete('/cart'),
};

// Orders endpoints
export const ordersAPI = {
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

// Favorites endpoints
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (menuItemId) => api.post('/favorites', { menuItemId }),
  removeFavorite: (menuItemId) => api.delete(`/favorites/${menuItemId}`),
};

// Rewards endpoints
export const rewardsAPI = {
  getRewards: () => api.get('/rewards'),
  getTiers: () => api.get('/rewards/tiers'),
};

// Gift cards endpoints
export const giftCardsAPI = {
  getGiftCards: () => api.get('/giftcards'),
  purchaseGiftCard: (data) => api.post('/giftcards', data),
  applyGiftCard: (code) => api.post('/giftcards/apply', { code }),
  checkBalance: (code) => api.get(`/giftcards/balance/${code}`),
};

// Notifications endpoints
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default api;
