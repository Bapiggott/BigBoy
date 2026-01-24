import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Home() {
  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to Big Boy!</h1>
        <p>America's Favorite Restaurant Since 1936</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/menu" className="btn btn-primary">View Menu</Link>
          <Link to="/locations" className="btn btn-secondary">Find Location</Link>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>🍔 Delicious Menu</h3>
          <p>Explore our famous burgers, breakfast, salads, and more. Over 60 mouthwatering items to choose from!</p>
          <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>

        <div className="card">
          <h3>📍 28 Locations</h3>
          <p>Find a Big Boy near you in Michigan and Ohio. Real addresses, phone numbers, and hours.</p>
          <Link to="/locations" className="btn btn-primary">View Locations</Link>
        </div>

        <div className="card">
          <h3>🏆 Rewards Program</h3>
          <p>Join our 3-tier loyalty program! Earn points with every order and unlock exclusive benefits.</p>
          <Link to="/rewards" className="btn btn-primary">Learn More</Link>
        </div>

        <div className="card">
          <h3>🛒 Easy Ordering</h3>
          <p>Order online for pickup at your favorite location. Fast, easy, and convenient!</p>
          <Link to="/menu" className="btn btn-primary">Order Now</Link>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--bigboy-red)', marginBottom: '1rem' }}>Featured Items</h2>
        <div className="grid">
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--border-color)', height: '150px', borderRadius: '10px', marginBottom: '1rem' }}></div>
            <h4 style={{ color: 'var(--bigboy-blue)' }}>Big Boy Burger</h4>
            <p>Our famous double-decker burger</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--bigboy-red)' }}>$8.99</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--border-color)', height: '150px', borderRadius: '10px', marginBottom: '1rem' }}></div>
            <h4 style={{ color: 'var(--bigboy-blue)' }}>Breakfast Platter</h4>
            <p>Start your day right</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--bigboy-red)' }}>$9.99</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--border-color)', height: '150px', borderRadius: '10px', marginBottom: '1rem' }}></div>
            <h4 style={{ color: 'var(--bigboy-blue)' }}>Chocolate Shake</h4>
            <p>Thick and creamy</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--bigboy-red)' }}>$4.99</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
