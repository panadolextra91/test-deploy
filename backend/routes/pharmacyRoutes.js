const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authenticateToken = require('../middleware/authMiddleware');

// Get all pharmacies
router.get('/', authenticateToken, pharmacyController.getAllPharmacies);

// Get pharmacy by ID
router.get('/:id', authenticateToken, pharmacyController.getPharmacyById);

// Find nearest pharmacies based on customer's real-time location
router.post('/nearest', authenticateToken, pharmacyController.getNearestPharmacies);

// Get all pharmacies with distances (no radius filter)
router.post('/with-distance', authenticateToken, pharmacyController.getPharmaciesWithDistance);

module.exports = router; 