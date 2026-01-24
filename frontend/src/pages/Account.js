import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, favoritesAPI, notificationsAPI, rewardsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccountData();
  }, [user, navigate]);

  const loadAccountData = async () => {
    try {
      const [ordersRes, favoritesRes, notificationsRes, rewardsRes] = await Promise.all([
        ordersAPI.getOrders(),
        favoritesAPI.getFavorites(),
        notificationsAPI.getNotifications(),
        rewardsAPI.getRewards()
      ]);
      setOrders(ordersRes.data);
      setFavorites(favoritesRes.data);
      setNotifications(notificationsRes.data);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadAccountData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading account...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: 'var(--bigboy-red)', textAlign: 'center', marginBottom: '2rem' }}>
        My Account
      </h1>

      <div className="card">
        <h3>Profile Information</h3>
        <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
        <button onClick={handleLogout} className="btn btn-danger" style={{ marginTop: '1rem' }}>
          Logout
        </button>
      </div>

      {rewards && (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--bigboy-blue) 0%, #002d7a 100%)', color: 'white' }}>
          <h3>Rewards Status</h3>
          <p><strong>Tier:</strong> {rewards.tier_name}</p>
          <p><strong>Points:</strong> {rewards.points}</p>
          <p><strong>Lifetime Points:</strong> {rewards.lifetime_points}</p>
          <p><strong>Discount:</strong> {rewards.discount_percentage}%</p>
        </div>
      )}

      <h2 style={{ color: 'var(--bigboy-blue)', marginTop: '2rem' }}>Recent Orders</h2>
      {orders.length === 0 ? (
        <div className="card">
          <p>No orders yet. Start ordering to see your history!</p>
        </div>
      ) : (
        <div>
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h4>Order #{order.order_number}</h4>
                  <p>{order.location_name}</p>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--bigboy-blue)' }}>
                    ${order.total_amount}
                  </p>
                  <p style={{ 
                    color: order.status === 'completed' ? 'var(--success)' : 'var(--bigboy-red)',
                    fontWeight: 'bold'
                  }}>
                    {order.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ color: 'var(--bigboy-blue)', marginTop: '2rem' }}>Favorites</h2>
      {favorites.length === 0 ? (
        <div className="card">
          <p>No favorites yet. Add items from the menu!</p>
        </div>
      ) : (
        <div className="grid">
          {favorites.slice(0, 6).map(fav => (
            <div key={fav.id} className="menu-item">
              <img src={fav.image_url} alt={fav.name} />
              <div className="menu-item-content">
                <h3>{fav.name}</h3>
                <p>{fav.description}</p>
                <p className="price">${fav.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ color: 'var(--bigboy-blue)', marginTop: '2rem' }}>Notifications</h2>
      {notifications.length === 0 ? (
        <div className="card">
          <p>No notifications</p>
        </div>
      ) : (
        <div>
          {notifications.slice(0, 5).map(notif => (
            <div 
              key={notif.id} 
              className="card" 
              style={{ 
                background: notif.is_read ? 'white' : 'var(--bigboy-cream)',
                borderLeft: `4px solid var(--bigboy-${notif.type === 'success' ? 'blue' : 'red'})`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Account;
