const express = require('express');
const router = express.Router();
const allergyController = require('../controllers/allergyController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all allergies (admin/pharmacist only)
router.get('/', authorize('admin', 'pharmacist'), allergyController.getAllergies);

// Get specific customer's allergies (admin/pharmacist/owner)
router.get('/customer/:customer_id', allergyController.getAllergies);

// Get single allergy
router.get('/:id', allergyController.getAllergy);

// Create new allergy
router.post('/', allergyController.createAllergy);

// Update allergy
router.put('/:id', allergyController.updateAllergy);

// Delete allergy
router.delete('/:id', allergyController.deleteAllergy);

module.exports = router;
