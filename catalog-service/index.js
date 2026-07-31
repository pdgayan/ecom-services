const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());



const products = [
  {
    id: 'p1',
    name: 'Advanced Ballistic Helmet',
    price: 1299.99,
    category: 'Personal Protection',
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    stock: 48,
    description: 'Lightweight ballistic helmet designed for military and law-enforcement operations with integrated accessory rails.',
  },
  {
    id: 'p2',
    name: 'Modular Tactical Plate Carrier',
    price: 899.99,
    category: 'Personal Protection',
    image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500',
    stock: 65,
    description: 'MOLLE-compatible tactical vest supporting modular mission equipment and ballistic plate integration.',
  },
  {
    id: 'p3',
    name: 'Night Vision Binocular System',
    price: 6850.00,
    category: 'Optics',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
    stock: 14,
    description: 'Dual-tube night vision system for reconnaissance, surveillance and navigation in low-light environments.',
  },
  {
    id: 'p4',
    name: 'Thermal Observation Camera',
    price: 9450.00,
    category: 'Surveillance',
    image_url: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=500',
    stock: 10,
    description: 'Long-range thermal imaging camera for perimeter monitoring and critical infrastructure security.',
  },
  {
    id: 'p5',
    name: 'Secure Tactical Radio',
    price: 2450.00,
    category: 'Communications',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
    stock: 52,
    description: 'Encrypted multi-band communication device supporting secure voice and data transmission.',
  },
  {
    id: 'p6',
    name: 'Rugged Command Tablet',
    price: 3199.99,
    category: 'Command Systems',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
    stock: 28,
    description: 'MIL-STD rugged tablet engineered for command-and-control applications in harsh environments.',
  },
  {
    id: 'p7',
    name: 'ISR Reconnaissance Drone',
    price: 18999.00,
    category: 'Unmanned Systems',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500',
    stock: 8,
    description: 'Medium-range unmanned aerial platform for intelligence, surveillance and reconnaissance missions.',
  },
  {
    id: 'p8',
    name: 'Portable Field Power Generator',
    price: 4799.00,
    category: 'Field Logistics',
    image_url: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=500',
    stock: 19,
    description: 'High-capacity portable generator providing reliable electrical power for remote operational bases.',
  }
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
