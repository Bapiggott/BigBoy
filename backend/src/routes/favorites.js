const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get user's favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, mi.name, mi.description, mi.price, mi.image_url, mi.calories 
       FROM favorites f 
       JOIN menu_items mi ON f.menu_item_id = mi.id 
       WHERE f.user_id = $1 
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add item to favorites
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { menuItemId } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ error: 'Menu item ID required' });
    }

    const result = await pool.query(
      'INSERT INTO favorites (user_id, menu_item_id) VALUES ($1, $2) ON CONFLICT (user_id, menu_item_id) DO NOTHING RETURNING *',
      [req.user.id, menuItemId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Item already in favorites' });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove item from favorites
router.delete('/:menuItemId', authMiddleware, async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND menu_item_id = $2 RETURNING *',
      [req.user.id, menuItemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
