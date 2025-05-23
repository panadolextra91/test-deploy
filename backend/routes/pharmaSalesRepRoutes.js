const express = require('express');
const router = express.Router();
const pharmaSalesRepController = require('../controllers/pharmaSalesRepController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Get all sales reps
router.get(
  '/',
  authenticate,
  authorize('admin', 'pharmacist'),
  pharmaSalesRepController.getAllSalesReps
);

// Get sales rep by ID
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'pharmacist'),
  pharmaSalesRepController.getSalesRepById
);

// Get sales rep by name
router.get(
  '/name/:name',
  authenticate,
  authorize('admin', 'pharmacist'),
  pharmaSalesRepController.getSalesRepByName
);

// Create new sales rep
router.post(
  '/',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.createSalesRep
);

// Update sales rep
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.updateSalesRep
);

// Delete sales rep
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.deleteSalesRep
);

module.exports = router;
