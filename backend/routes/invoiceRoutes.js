const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();
const InvoiceItem = require('../models/InvoiceItem');
const Medicine = require('../models/Medicines');
//invoiceRoutes.js
// Routes for invoices
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.getAllInvoices);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.getInvoiceById);
router.post('/', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.createInvoice);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.updateInvoice);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.deleteInvoice);
router.get('/revenue/monthly', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.getMonthlyRevenue);
router.get('/sales/selling-medicines', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.getSellingMedicines);
router.get('/sales/daily-income', authenticateToken, authorize('admin', 'pharmacist'), invoiceController.getDailyIncome);

module.exports = router;
