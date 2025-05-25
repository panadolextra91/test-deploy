require('dotenv').config({ path: __dirname + '/.env' });

// Debug output to verify env loading and working directory
console.log('Working directory:', process.cwd());
console.log('Loaded .env → PORT =', process.env.PORT);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Import models and routes
require('./models');
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const invoiceItemRoutes = require('./routes/invoiceItemRoutes');
const locationRoutes = require('./routes/locationRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const otpRoutes = require('./routes/otpRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pharmaSalesRepRoutes = require('./routes/pharmaSalesRepRoutes');
const brandRoutes = require('./routes/brandRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const healthMetricsRoutes = require('./routes/healthMetricsRoutes');
const allergyRoutes = require('./routes/allergyRoutes');
const newsRoutes = require('./routes/newsRoutes');

const app = express();
// Use PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;
console.log('Binding to port:', PORT);

// CORS setup
const allowedOrigins = [
  'https://medimaster-fe.vercel.app',  // Production frontend
  'http://localhost:3001',             // Development frontend
  'http://localhost:3000',
  'http://localhost:8081' // Development app
];
console.log('Current environment:', process.env.NODE_ENV);
console.log('Allowed CORS origins:', allowedOrigins);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      console.log('Origin attempted:', origin);
      return callback(new Error('CORS policy does not allow this origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.error('Unable to connect to DB:', err));

// Note: Database syncing is handled in config/database.js

// Routes
app.get('/', (req, res) => res.send('Welcome to the Pharmacy Management System API'));
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-items', invoiceItemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/otps', otpRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pharma-sales-reps', pharmaSalesRepRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/health-metrics', healthMetricsRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/news', newsRoutes);

// Static file serving
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));
//app.use('/uploads/medicines', express.static(path.join(__dirname, 'uploads/medicines')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, '../frontend/public/robots.txt')));
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, '../frontend/build/sitemap.xml'));
});

// Logging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`Incoming: ${req.method} ${req.url}`);
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
