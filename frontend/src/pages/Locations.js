import React, { useState, useEffect } from 'react';
import { locationsAPI } from '../services/api';
import '../App.css';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, [selectedState]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getLocations(selectedState);
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const michiganLocations = locations.filter(loc => loc.state === 'MI');
  const ohioLocations = locations.filter(loc => loc.state === 'OH');

  return (
    <div className="container">
      <h1 style={{ color: 'var(--bigboy-red)', textAlign: 'center', marginBottom: '2rem' }}>
        Our Locations
      </h1>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Find a Big Boy near you! We have 28 locations across Michigan and Ohio.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => setSelectedState('')}
            className={!selectedState ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All Locations
          </button>
          <button 
            onClick={() => setSelectedState('MI')}
            className={selectedState === 'MI' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Michigan ({michiganLocations.length})
          </button>
          <button 
            onClick={() => setSelectedState('OH')}
            className={selectedState === 'OH' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Ohio ({ohioLocations.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading locations...</div>
      ) : (
        <div className="grid">
          {locations.map(location => (
            <div key={location.id} className="location-card">
              <h3>{location.name}</h3>
              <p><strong>📍 Address:</strong> {location.address}</p>
              <p>{location.city}, {location.state} {location.zip}</p>
              <p><strong>📞 Phone:</strong> {location.phone}</p>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bigboy-cream)', borderRadius: '5px' }}>
                <p><strong>Hours:</strong></p>
                <p style={{ fontSize: '0.9rem' }}>Mon-Thu: {location.hours_monday}</p>
                <p style={{ fontSize: '0.9rem' }}>Fri-Sat: {location.hours_friday}</p>
                <p style={{ fontSize: '0.9rem' }}>Sunday: {location.hours_sunday}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Locations;
