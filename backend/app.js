require('dotenv').config();
const db = require('./config/database');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/database');
const path = require('path');

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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
    'https://medimaster-fe.vercel.app',
    'http://localhost:3001'
];

if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

console.log("Allowed CORS origins:", allowedOrigins);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Database Connection
sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Sync all models with the database (only in development)
if (process.env.NODE_ENV !== 'production') {
    sequelize.sync({ alter: true })
        .then(() => console.log('All models were synchronized successfully.'))
        .catch(err => console.error('Error syncing models:', err));
}

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Pharmacy Management System API');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-items', invoiceItemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/customers', customerRoutes);

// Serve static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/robots.txt'));
});
app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(path.join(__dirname, '../frontend/build/sitemap.xml'));
});

// Logging (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`Incoming request: ${req.method} ${req.url}`);
        next();
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
