const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticateToken = require('../middleware/authMiddleware');

// All cart routes require authentication
router.use(authenticateToken);

// Get customer's cart with all items
router.get('/', cartController.getCart);

// Get cart item count
router.get('/count', cartController.getCartItemCount);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/item/:id', cartController.updateCartItem);

// Toggle cart item selection for checkout
router.patch('/item/:id/select', cartController.toggleItemSelection);

// Remove specific item from cart
router.delete('/item/:id', cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Get selected items for checkout
router.get('/checkout', cartController.getSelectedItems);

// Checkout selected items - Create order from cart
router.post('/checkout', cartController.checkout);

// Remove selected items after successful checkout (called by order creation)
router.delete('/checkout', cartController.removeSelectedItems);

module.exports = router; 