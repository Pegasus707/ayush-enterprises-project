// server.js

// 1. IMPORTS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// 2. CONFIGURATION
const app = express();
const PORT = 3001;
// Your actual connection string. Remember to use a secure password for real projects.
const MONGO_URI = 'mongodb+srv://architsurve82:SUPERCELL@cluster0.1wjybzi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 4. DATABASE CONNECTION
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => console.error('Connection error:', err));

// 5. DATA BLUEPRINTS (SCHEMAS & MODELS)

// --- Product Schema & Model ---
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});
const Product = mongoose.model('Product', productSchema);

// --- User Schema & Model ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// --- Order Schema & Model ---
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);


// 6. API ENDPOINTS (ROUTES)

// Welcome route
app.get('/', (request, response) => {
  response.send('Welcome to the Ayush Enterprises Backend API!');
});

// --- Product Routes ---
// GET: All products
app.get('/api/products', async (request, response) => {
  try {
    const products = await Product.find();
    response.json(products);
  } catch (error) {
    response.status(500).json({ message: 'Error fetching products', error: error });
  }
});

// POST: Create a new product (for a future admin panel)
app.post('/api/products', async (request, response) => {
  try {
      const newProduct = new Product({
          name: request.body.name,
          price: request.body.price,
      });
      const savedProduct = await newProduct.save();
      response.status(201).json(savedProduct);
  } catch (error) {
      response.status(400).json({ message: 'Error creating product', error: error });
  }
});


// --- User Routes ---
// POST: Register a new user
app.post('/api/users/register', async (request, response) => {
  try {
    const { email, password } = request.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return response.status(400).json({ message: 'User with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email: email, password: hashedPassword });
    await newUser.save();
    response.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    response.status(500).json({ message: 'Server error', error: error });
  }
});

// POST: Login a user
app.post('/api/users/login', async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return response.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.status(400).json({ message: 'Invalid credentials.' });
    }
    response.status(200).json({ message: 'Login successful!', user: { id: user._id, email: user.email } });
  } catch (error) {
    response.status(500).json({ message: 'Server error', error: error });
  }
});


// --- Order Routes ---
// POST: Create a new order
app.post('/api/orders', async (request, response) => {
  try {
    const { userId, products, totalAmount } = request.body;

    const newOrder = new Order({
      userId,
      products,
      totalAmount,
    });

    const savedOrder = await newOrder.save();
    response.status(201).json({ message: 'Order created successfully!', order: savedOrder });

  } catch (error) {
    response.status(500).json({ message: 'Server error while creating order', error: error });
  }
});


// 7. START THE SERVER
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});