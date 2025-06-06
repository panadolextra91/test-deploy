const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Get all orders (requires authentication)
router.get('/', authenticateToken, orderController.getAllOrders);

// Search orders by ID or customer name (requires authentication)
router.get('/search', authenticateToken, orderController.searchOrders);

// Get all orders for a specific customer
router.get('/customer/:customer_id', authenticateToken, orderController.getOrdersByCustomer);

// Filter orders for a specific customer by status
router.get('/customer/:customer_id/status/:status', authenticateToken, orderController.getOrdersByCustomerAndStatus);

// Get order by ID (requires authentication)
router.get('/:id', authenticateToken, orderController.getOrderById);

// Create new order (customers can create orders, not admin/pharmacist)
router.post('/', authenticateToken, orderController.createOrder);

// Update order status (requires pharmacist/admin authentication)
router.patch('/:id/status', authenticateToken, authorize('admin', 'pharmacist'), orderController.updateOrderStatus);

// Delete order (requires admin authentication)
router.delete('/:id', authenticateToken, orderController.deleteOrder);

module.exports = router;


