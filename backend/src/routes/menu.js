const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE mi.is_available = true
    `;
    const params = [];

    if (category) {
      query += ' AND c.name = $1';
      params.push(category);
    }

    query += ' ORDER BY c.display_order, mi.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

// Get menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Failed to get menu item' });
  }
});

module.exports = router;
