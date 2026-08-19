const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory orders stores
const orders = [];

function generateOrderId() {
  return 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

function totalAmount(items) {
  // items: [{ productId, quantity, price }]
  return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
}

// POST /orders — body: { userId, items: [{ productId, name, quantity, price }] }
app.post('/orders', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ error: 'userId and items are required' });
  }

  const orderId = generateOrderId();
  const amount  = totalAmount(items);

  const order = {
    orderId,
    userId,
    items,
    amount,
    status: 'placed',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  // Fire-and-forget: call payment-service
  fetch('http://localhost:4005/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
  })
    .then(r => r.json())
    .then(result => {
      console.log(`[order-service] Payment result for ${orderId}:`, result);
      // Update order status in memory
      const o = orders.find(x => x.orderId === orderId);
      if (o) o.paymentStatus = result.status;
    })
    .catch(err => console.error('[order-service] Payment call failed:', err.message));

  // Fire-and-forget: call notification-service
  fetch('http://localhost:4006/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      message: `Your order ${orderId} has been placed successfully! Total: $${amount.toFixed(2)}`,
    }),
  })
    .then(r => r.json())
    .then(result => console.log(`[order-service] Notification result for ${orderId}:`, result))
    .catch(err => console.error('[order-service] Notification call failed:', err.message));

  res.status(201).json(order);
});

// GET /orders/:userId
app.get('/orders/:userId', (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.params.userId);
  res.json(userOrders);
});

// GET /orders/detail/:orderId — single order lookup
app.get('/orders/detail/:orderId', (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

const PORT = 4004;
app.listen(PORT, () => console.log(`order-service running on http://localhost:${PORT}`));
