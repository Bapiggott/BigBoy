import React, { useState, useEffect } from 'react';
import { rewardsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTiers();
    if (user) {
      loadRewards();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRewards = async () => {
    try {
      const response = await rewardsAPI.getRewards();
      setRewards(response.data);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async () => {
    try {
      const response = await rewardsAPI.getTiers();
      setTiers(response.data);
    } catch (error) {
      console.error('Error loading tiers:', error);
    }
  };

  const getTierClass = (tierName) => {
    return `card tier-${tierName.toLowerCase()}`;
  };

  if (!user) {
    return (
      <div className="container">
        <h1 style={{ color: 'var(--bigboy-red)', textAlign: 'center', marginBottom: '2rem' }}>
          Rewards Program
        </h1>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Join Our Loyalty Program!</h3>
          <p>Sign in or create an account to start earning rewards with every order.</p>
        </div>
        <h2 style={{ color: 'var(--bigboy-blue)', marginTop: '2rem' }}>Reward Tiers</h2>
        <div className="grid">
          {tiers.map(tier => (
            <div key={tier.id} className={getTierClass(tier.name)}>
              <h3 style={{ color: tier.color }}>{tier.name}</h3>
              <p><strong>Points Required:</strong> {tier.min_points}+</p>
              <p><strong>Discount:</strong> {tier.discount_percentage}% off orders</p>
              <p style={{ marginTop: '1rem' }}>{tier.benefits}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading rewards...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: 'var(--bigboy-red)', textAlign: 'center', marginBottom: '2rem' }}>
        My Rewards
      </h1>

      {rewards && (
        <div className={getTierClass(rewards.tier_name)} style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: rewards.color }}>{rewards.tier_name} Member</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--bigboy-blue)' }}>
                {rewards.points}
              </p>
              <p>Current Points</p>
            </div>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--bigboy-red)' }}>
                {rewards.lifetime_points}
              </p>
              <p>Lifetime Points</p>
            </div>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 'bold', color: rewards.color }}>
                {rewards.discount_percentage}%
              </p>
              <p>Discount</p>
            </div>
          </div>
          <p style={{ marginTop: '2rem', fontSize: '1.1rem' }}>{rewards.benefits}</p>
        </div>
      )}

      <h2 style={{ color: 'var(--bigboy-blue)', marginTop: '3rem', marginBottom: '1rem' }}>
        All Reward Tiers
      </h2>
      <div className="grid">
        {tiers.map(tier => (
          <div key={tier.id} className={getTierClass(tier.name)}>
            <h3 style={{ color: tier.color }}>{tier.name}</h3>
            <p><strong>Points Required:</strong> {tier.min_points}{tier.max_points ? ` - ${tier.max_points}` : '+'}</p>
            <p><strong>Discount:</strong> {tier.discount_percentage}% off orders</p>
            <p style={{ marginTop: '1rem' }}>{tier.benefits}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, var(--bigboy-blue) 0%, #002d7a 100%)', color: 'white' }}>
        <h3>How to Earn Points</h3>
        <p>• Earn 1 point for every dollar spent (Bronze tier)</p>
        <p>• Earn 1.5 points per dollar at Silver tier</p>
        <p>• Earn 2 points per dollar at Gold tier</p>
        <p>• Points are automatically added to your account with each order</p>
        <p>• Use your points for discounts on future orders!</p>
      </div>
    </div>
  );
}

export default Rewards;
