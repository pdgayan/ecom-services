const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());



const products = [
  {
    id: 'p1',
    name: 'Margherita Pizza',
    price: 12.99,
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500',
    stock: 15,
    description: 'Classic Italian pizza with fresh mozzarella, tomato sauce, and basil.',
  },
  {
    id: 'p2',
    name: 'Beef Burger',
    price: 9.99,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    stock: 20,
    description: 'Juicy grilled beef burger with cheese, lettuce, tomato, and special sauce.',
  },
  {
    id: 'p3',
    name: 'Chicken Fried Rice',
    price: 10.99,
    category: 'Rice',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    stock: 18,
    description: 'Flavorful fried rice with tender chicken, vegetables, and soy sauce.',
  },
  {
    id: 'p4',
    name: 'Caesar Salad',
    price: 7.99,
    category: 'Salads',
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
    stock: 25,
    description: 'Fresh romaine lettuce, parmesan cheese, croutons, and Caesar dressing.',
  },
  {
    id: 'p5',
    name: 'Spaghetti Bolognese',
    price: 11.99,
    category: 'Pasta',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500',
    stock: 14,
    description: 'Traditional Italian pasta with rich beef Bolognese sauce.',
  },
  {
    id: 'p6',
    name: 'Chocolate Cake',
    price: 5.99,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
    stock: 30,
    description: 'Moist chocolate cake topped with creamy chocolate frosting.',
  },
  {
    id: 'p7',
    name: 'Sushi Platter',
    price: 18.99,
    category: 'Japanese',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500',
    stock: 10,
    description: 'Fresh assortment of salmon, tuna, and shrimp sushi rolls.',
  },
  {
    id: 'p8',
    name: 'Chicken Tacos',
    price: 8.99,
    category: 'Mexican',
    image_url: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=500',
    stock: 22,
    description: 'Soft tortillas filled with grilled chicken, salsa, lettuce, and cheese.',
  },
];

// GET /catalog/products
app.get('/catalog/products', (req, res) => {
  res.json(products);
});

// GET /products/:id
app.get('/catalog/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

const PORT = 4002;
app.listen(PORT, () => console.log(`catalog-service running on http://localhost:${PORT}`));
