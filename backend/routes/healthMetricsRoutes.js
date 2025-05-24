const express = require('express');
const router = express.Router();
const healthMetricsController = require('../controllers/healthMetricsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all metrics (admin/pharmacist only)
router.get('/', authorize('admin', 'pharmacist'), healthMetricsController.getAllMetrics);

// Get metrics for a specific customer
router.get('/customer/:customerId', healthMetricsController.getCustomerMetrics);

// Get metrics history for a customer
router.get('/history/:customerId', healthMetricsController.getMetricsHistory);

// Create or update metrics
router.post('/update', healthMetricsController.updateMetrics);

// Delete metrics history entry (admin only)
router.delete('/history/:id', authorize('admin'), healthMetricsController.deleteMetricsHistory);

module.exports = router; 