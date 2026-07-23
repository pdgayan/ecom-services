const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const products = [
  {
    id: 'p1',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 79.99,
    category: 'Electronics',
    image_url: 'https://placehold.co/300x200?text=Headphones',
    stock: 15,
    description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
  },
  {
    id: 'p2',
    name: 'Mechanical Keyboard',
    price: 49.99,
    category: 'Electronics',
    image_url: 'https://placehold.co/300x200?text=Keyboard',
    stock: 8,
    description: 'Tactile mechanical keyboard with RGB backlight and detachable USB-C cable.',
  },
  {
    id: 'p3',
    name: 'Running Shoes',
    price: 89.95,
    category: 'Footwear',
    image_url: 'https://placehold.co/300x200?text=Shoes',
    stock: 22,
    description: 'Lightweight breathable running shoes with extra cushioning for long-distance comfort.',
  },
  {
    id: 'p4',
    name: 'Stainless Steel Water Bottle',
    price: 24.99,
    category: 'Lifestyle',
    image_url: 'https://placehold.co/300x200?text=Bottle',
    stock: 50,
    description: 'Double-walled vacuum insulated bottle keeps drinks cold for 24h or hot for 12h.',
  },
  {
    id: 'p5',
    name: 'Portable Bluetooth Speaker',
    price: 39.99,
    category: 'Electronics',
    image_url: 'https://placehold.co/300x200?text=Speaker',
    stock: 12,
    description: 'Compact waterproof speaker with 360° sound and 10-hour playtime.',
  },
  {
    id: 'p6',
    name: 'Yoga Mat',
    price: 29.00,
    category: 'Fitness',
    image_url: 'https://placehold.co/300x200?text=Yoga+Mat',
    stock: 35,
    description: 'Eco-friendly non-slip yoga mat with alignment lines, 6mm thick.',
  },
  {
    id: 'p7',
    name: 'Desk Lamp with USB Port',
    price: 34.99,
    category: 'Home Office',
    image_url: 'https://placehold.co/300x200?text=Desk+Lamp',
    stock: 18,
    description: 'Adjustable LED desk lamp with 5 colour temperatures and a built-in USB charging port.',
  },
  {
    id: 'p8',
    name: 'Sunglasses - Polarised',
    price: 19.99,
    category: 'Accessories',
    image_url: 'https://placehold.co/300x200?text=Sunglasses',
    stock: 40,
    description: 'UV400 polarised lenses in a lightweight TR90 frame — ideal for outdoor activities.',
  },
];

// GET /products
app.get('/products', (req, res) => {
  res.json(products);
});

// GET /products/:id
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

const PORT = 4002;
app.listen(PORT, () => console.log(`catalog-service running on http://localhost:${PORT}`));
