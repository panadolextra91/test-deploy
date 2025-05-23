const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const medicineUpload = require('../middleware/medicineUploadMiddleware');

// Get all brands (public for customers to filter)
router.get('/', brandController.getAllBrands);

// Get brand by ID (public)
router.get('/:id', brandController.getBrandById);

// Create new brand with optional logo upload (admin only)
router.post('/', authenticateToken, authorize('admin'), medicineUpload.single('logo'), brandController.createBrand);

// Update brand with optional logo upload (admin only)
router.put('/:id', authenticateToken, authorize('admin'), medicineUpload.single('logo'), brandController.updateBrand);

// Delete brand (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), brandController.deleteBrand);

// Brand logo management routes
router.post('/:id/logo', authenticateToken, authorize('admin'), medicineUpload.single('logo'), brandController.updateBrandLogo);
router.delete('/:id/logo', authenticateToken, authorize('admin'), brandController.deleteBrandLogo);

module.exports = router; 