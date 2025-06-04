const express = require('express');
const router = express.Router();
const pharmaSalesRepController = require('../controllers/pharmaSalesRepController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const authenticateSalesRep = require('../middleware/salesRepAuthMiddleware');

// Public routes for sales reps
router.post('/register', pharmaSalesRepController.registerSalesRep);
router.post('/login', pharmaSalesRepController.loginSalesRep);
router.post('/forgot-password', pharmaSalesRepController.forgotSalesRepPassword);
router.post('/reset-password', pharmaSalesRepController.resetSalesRepPassword);

// Protected routes for sales reps (self-service)
router.get('/profile', authenticateSalesRep, pharmaSalesRepController.getSalesRepProfile);
router.put('/profile', authenticateSalesRep, pharmaSalesRepController.updateSalesRepProfile);
router.put('/change-password', authenticateSalesRep, pharmaSalesRepController.changeSalesRepPassword);

// Admin routes for managing sales reps
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

// Create new sales rep (admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.createSalesRep
);

// Update sales rep (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.updateSalesRep
);

// Delete sales rep (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  pharmaSalesRepController.deleteSalesRep
);

// Filter sales reps by supplier
router.get('/supplier/:supplierId', pharmaSalesRepController.getSalesRepsBySupplier);

module.exports = router;
