const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all locations
router.get('/', async (req, res) => {
  try {
    const { state } = req.query;
    let query = 'SELECT * FROM locations WHERE is_active = true';
    const params = [];

    if (state) {
      query += ' AND state = $1';
      params.push(state);
    }

    query += ' ORDER BY state, city, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM locations WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
});

module.exports = router;
