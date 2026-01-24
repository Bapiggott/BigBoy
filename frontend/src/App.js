import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Locations from './pages/Locations';
import Rewards from './pages/Rewards';
import Account from './pages/Account';
import Login from './pages/Login';
import './App.css';

function Navigation() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">🍔 Big Boy</Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/locations">Locations</Link>
          <Link to="/rewards">Rewards</Link>
          {user ? (
            <Link to="/account">Account</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2024 Big Boy Restaurants. All rights reserved.</p>
      <p>America's Favorite Restaurant Since 1936</p>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        28 Locations in Michigan & Ohio | 60+ Menu Items | 3-Tier Loyalty Program
      </p>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
