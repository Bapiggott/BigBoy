const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get user's rewards
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, rt.name as tier_name, rt.min_points, rt.max_points, rt.discount_percentage, rt.benefits, rt.color 
       FROM rewards r 
       LEFT JOIN reward_tiers rt ON r.tier_id = rt.id 
       WHERE r.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rewards not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to get rewards' });
  }
});

// Get all reward tiers
router.get('/tiers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reward_tiers ORDER BY min_points');
    res.json(result.rows);
  } catch (error) {
    console.error('Get reward tiers error:', error);
    res.status(500).json({ error: 'Failed to get reward tiers' });
  }
});

module.exports = router;
