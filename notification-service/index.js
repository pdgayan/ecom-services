const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// POST /notify — body: { userId, message }
app.post('/notify', (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  // Simulates sending an email/SMS — just log it
  console.log(`\n📧 [notification-service] NOTIFICATION`);
  console.log(`   To   : User ${userId}`);
  console.log(`   Msg  : ${message}`);
  console.log(`   Time : ${new Date().toISOString()}\n`);

  res.json({ status: 'sent', userId, message, sentAt: new Date().toISOString() });
});

const PORT = 4006;
app.listen(PORT, () => console.log(`notification-service running on http://localhost:${PORT}`));
