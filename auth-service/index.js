const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Hardcodeds test users — no real password validation
const users = [
  { id: 'u001', username: 'alice', password: 'password', role: 'customer' },
  { id: 'u002', username: 'bob',   password: 'password', role: 'admin' },
];

// In-memory token -> user map (mock JWT)
const tokens = {};

function generateToken(user) {
  // Simple mock token: base64(userId:username:timestamp)
  const payload = `${user.id}:${user.username}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

// POST /auth/login
app.post('auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Mock: accept any password for demo, or check if provided
  // For demo purposes we just require the password field to be present
  if (!password) {
    return res.status(401).json({ error: 'Password required' });
  }

  const token = generateToken(user);
  const userInfo = { id: user.id, username: user.username, role: user.role };
  tokens[token] = userInfo;

  res.json({ token, user: userInfo });
});

// GET /verify — token passed via Authorization header: "Bearer <token>"
app.get('auth/verify', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token || !tokens[token]) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  res.json({ user: tokens[token] });
});

const PORT = 4001;
app.listen(PORT, () => console.log(`auth-service running on http://localhost:${PORT}`));
