const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const upload = require('../middleware/healthRecordUploadMiddleware');

// Routes that require authentication
router.use(authenticateToken);

// Get all records (admin/pharmacist only)
router.get('/', authorize('admin', 'pharmacist'), healthRecordController.getAllRecords);

// Get records by type with optional customer filter
router.get('/type/:type', healthRecordController.getRecordsByType);

// Get all records for a specific customer
router.get('/customer/:customerId', healthRecordController.getCustomerRecords);

// Get specific record by ID
router.get('/:id', healthRecordController.getRecordById);

// Create new record with file upload
router.post('/', upload.single('file'), healthRecordController.createRecord);

// Update record with optional file upload
router.put('/:id', upload.single('file'), healthRecordController.updateRecord);

// Delete record
router.delete('/:id', healthRecordController.deleteRecord);

module.exports = router; 