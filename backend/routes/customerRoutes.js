const express = require ('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authenticateToken = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

router.post('/', authenticateToken, authorize('admin', 'pharmacist'), customerController.createCustomer); // Create a new customer
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), customerController.deleteCustomer); // Delete a customer
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'),  customerController.updateCustomer); // Update a customer
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'),  customerController.getCustomerById); // Get customer by ID
router.get('/phone/:phone', authenticateToken, authorize('admin', 'pharmacist'),  customerController.getCustomerByPhone); // Get customer by phone
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), customerController.getAllCustomers); // Get all customers

module.exports = router;