const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Get all orders (requires authentication)
router.get('/', authenticateToken, orderController.getAllOrders);

// Get order by ID (requires authentication)
router.get('/:id', authenticateToken, orderController.getOrderById);

// Create new order (customers can create orders)
router.post('/', orderController.createOrder);

// Update order status (requires pharmacist/admin authentication)
router.patch('/:id/status', authenticateToken, authorize('admin', 'pharmacist'), orderController.updateOrderStatus);

// Delete order (requires admin authentication)
router.delete('/:id', authenticateToken, authorize('admin'), orderController.deleteOrder);

module.exports = router;


