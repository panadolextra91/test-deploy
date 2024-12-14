const express = require('express');
const locationController = require('../controllers/locationController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();

// Define routes
router.get('/', authenticateToken, authorize('admin', 'pharmacist'), locationController.getAllLocations);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), locationController.getLocationById);
router.post('/', authenticateToken, authorize('admin', 'pharmacist'), locationController.createLocation);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), locationController.updateLocation);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), locationController.deleteLocation);

module.exports = router;
