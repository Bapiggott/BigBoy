const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get user's gift cards
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gift_cards WHERE (purchased_by = $1 OR used_by = $1) AND is_active = true ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get gift cards error:', error);
    res.status(500).json({ error: 'Failed to get gift cards' });
  }
});

// Purchase gift card
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, expiresAt } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Amount must be at least $10' });
    }

    // Generate unique code
    const code = 'BB' + Math.random().toString(36).substr(2, 12).toUpperCase();

    const result = await pool.query(
      'INSERT INTO gift_cards (code, balance, original_amount, purchased_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [code, amount, amount, req.user.id, expiresAt || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Purchase gift card error:', error);
    res.status(500).json({ error: 'Failed to purchase gift card' });
  }
});

// Apply gift card
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Gift card code required' });
    }

    const result = await pool.query(
      'SELECT * FROM gift_cards WHERE code = $1 AND is_active = true AND balance > 0',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired gift card' });
    }

    const giftCard = result.rows[0];

    // Check expiration
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Gift card has expired' });
    }

    // Update used_by if not already set
    if (!giftCard.used_by) {
      await pool.query(
        'UPDATE gift_cards SET used_by = $1 WHERE id = $2',
        [req.user.id, giftCard.id]
      );
    }

    res.json(giftCard);
  } catch (error) {
    console.error('Apply gift card error:', error);
    res.status(500).json({ error: 'Failed to apply gift card' });
  }
});

// Check gift card balance
router.get('/balance/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      'SELECT balance, is_active, expires_at FROM gift_cards WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift card not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Check balance error:', error);
    res.status(500).json({ error: 'Failed to check balance' });
  }
});

module.exports = router;
