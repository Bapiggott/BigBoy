const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get user's orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, l.name as location_name, l.address, l.city, l.state 
       FROM orders o 
       LEFT JOIN locations l ON o.location_id = l.id 
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, l.name as location_name, l.address, l.city, l.state, l.phone 
       FROM orders o 
       LEFT JOIN locations l ON o.location_id = l.id 
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, mi.name, mi.image_url 
       FROM order_items oi 
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create new order
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { locationId, paymentMethod, pickupTime, specialInstructions } = req.body;

    // Get cart items
    const cartResult = await client.query(
      `SELECT c.*, mi.price, mi.name 
       FROM cart c 
       JOIN menu_items mi ON c.menu_item_id = mi.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const totalAmount = cartResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Generate order number
    const orderNumber = 'BB' + Date.now();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, location_id, order_number, total_amount, payment_method, pickup_time, special_instructions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, locationId, orderNumber, totalAmount, paymentMethod, pickupTime, specialInstructions]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cartResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.menu_item_id, item.quantity, item.price]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    // Add reward points (1 point per dollar spent)
    const pointsToAdd = Math.floor(totalAmount);
    await client.query(
      'UPDATE rewards SET points = points + $1, lifetime_points = lifetime_points + $1 WHERE user_id = $2',
      [pointsToAdd, req.user.id]
    );

    // Create notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, 'Order Confirmed', 'Your order #${orderNumber} has been confirmed!', 'success')`,
      [req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
