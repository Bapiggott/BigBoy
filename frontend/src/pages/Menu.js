import React, { useState, useEffect } from 'react';
import { menuAPI, cartAPI, favoritesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

function Menu() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  useEffect(() => {
    loadMenuItems();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await menuAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getMenuItems(selectedCategory);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (menuItemId) => {
    if (!user) {
      setMessage('Please login to add items to cart');
      return;
    }

    try {
      await cartAPI.addToCart({ menuItemId, quantity: 1 });
      setMessage('Item added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add item to cart');
    }
  };

  const handleAddToFavorites = async (menuItemId) => {
    if (!user) {
      setMessage('Please login to add favorites');
      return;
    }

    try {
      await favoritesAPI.addFavorite(menuItemId);
      setMessage('Added to favorites!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add to favorites');
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: 'var(--bigboy-red)', textAlign: 'center', marginBottom: '2rem' }}>
        Our Menu
      </h1>

      {message && <div className="success">{message}</div>}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => setSelectedCategory('')}
          className={!selectedCategory ? 'btn btn-primary' : 'btn btn-secondary'}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={selectedCategory === cat.name ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : (
        <div className="grid">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item">
              <img src={item.image_url} alt={item.name} />
              <div className="menu-item-content">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                {item.calories && <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{item.calories} cal</p>}
                <p className="price">${item.price}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleAddToCart(item.id)} className="btn btn-primary" style={{ flex: 1 }}>
                    Add to Cart
                  </button>
                  <button onClick={() => handleAddToFavorites(item.id)} className="btn btn-secondary">
                    ❤️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Menu;
