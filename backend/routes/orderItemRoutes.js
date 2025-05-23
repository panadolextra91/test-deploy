const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');

// Create order item
router.post('/', orderItemController.createOrderItem);

// Get order item by ID
router.get('/:id', orderItemController.getOrderItemById);

// Update order item
router.patch('/:id', orderItemController.updateOrderItem);

// Delete order item
router.delete('/:id', orderItemController.deleteOrderItem);

module.exports = router;


