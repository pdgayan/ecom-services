const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// POST /pay — body: { orderIds, amount }
app.post('/pay', (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  console.log(`[payment-service] Processing payment for order ${orderId}, amount: $${amount}`);

  // Simulate async processing delay (500ms)
  setTimeout(() => {
    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    console.log(`[payment-service] Payment SUCCESS — orderId: ${orderId}, txn: ${transactionId}`);
    res.json({
      status: 'success',
      transactionId,
      orderId,
      amount,
      processedAt: new Date().toISOString(),
    });
  }, 500);
});

const PORT = 4005;
app.listen(PORT, () => console.log(`payment-service running on http://localhost:${PORT}`));
