const express = require('express');
const invoiceItemController = require('../controllers/invoiceItemController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();
//invoiceItemRoutes.js
// Routes for invoice items
router.post('/', authenticateToken, authorize('admin', 'pharmacist'), invoiceItemController.createInvoiceItem);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceItemController.updateInvoiceItem);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceItemController.deleteInvoiceItem);
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), invoiceItemController.getAllInvoiceItems);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceItemController.getInvoiceItemById); // <-- Add this line

module.exports = router;
