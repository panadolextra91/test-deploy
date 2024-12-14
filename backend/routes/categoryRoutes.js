const express = require('express');
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();
//categoryRoutes.js
// Define routes
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), categoryController.getAllCategories);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), categoryController.getCategoryById);
router.post('/', authenticateToken, authorize('admin', 'pharmacist'), categoryController.createCategory);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), categoryController.updateCategory);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), categoryController.deleteCategory);

module.exports = router;
