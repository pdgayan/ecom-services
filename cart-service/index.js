const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/// In-memory store: { [userId]: { [productId]: { productId, quantity } } }
const carts = {};

function getCart(userId) {
  if (!carts[userId]) carts[userId] = {};
  return carts[userId];
}

// GET /cart/:userId
app.get('/cart/cart/:userId', (req, res) => {
  const cart = getCart(req.params.userId);
  const items = Object.values(cart);
  res.json({ userId: req.params.userId, items });
});

// POST /cart/:userId/add  — body: { productId, quantity }
app.post('/cart/cart/:userId/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const cart = getCart(req.params.userId);
  if (cart[productId]) {
    cart[productId].quantity += quantity;
  } else {
    cart[productId] = { productId, quantity };
  }

  res.json({ userId: req.params.userId, items: Object.values(cart) });
});

// DELETE /cart/:userId/remove/:productId
app.delete('/cart/cart/:userId/remove/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const cart = getCart(userId);

  if (!cart[productId]) {
    return res.status(404).json({ error: 'Item not in cart' });
  }

  delete cart[productId];
  res.json({ userId, items: Object.values(cart) });
});

// DELETE /cart/:userId/clear — clears entire cart (used after order placed)
app.delete('/cart/cart/:userId/clear', (req, res) => {
  carts[req.params.userId] = {};
  res.json({ userId: req.params.userId, items: [] });
});

const PORT = 4003;
app.listen(PORT, () => console.log(`cart-service running on http://localhost:${PORT}`));
