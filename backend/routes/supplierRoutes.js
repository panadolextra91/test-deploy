const express = require('express');
const supplierController = require('../controllers/supplierController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();
//supplierRoutes.js

// Public route for registration purposes
router.get('/public', supplierController.getAllSuppliers);
router.post('/find-or-create', supplierController.findOrCreateSupplier);

// Define routes
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), supplierController.getAllSuppliers);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), supplierController.getSupplierById);
router.post('/', authenticateToken, authorize('admin', 'pharmacist'), supplierController.createSupplier);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), supplierController.updateSupplier);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), supplierController.deleteSupplier);

module.exports = router;
