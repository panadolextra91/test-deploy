const express       = require('express');
const router        = express.Router();
const productController = require('../controllers/productController');
const authenticate  = require('../middleware/authMiddleware');
const authorize     = require('../middleware/authorizeMiddleware');
const upload        = require('../middleware/multer')();  // for CSV import

// External CSV import for pharma sales reps (no authentication required)
router.post(
  '/import-external',
  upload.single('file'),
  productController.importCsvExternal
);

// List all products (admin & pharmacist)
router.get(
  '/',
  authenticate,
  authorize('admin','pharmacist'),
  productController.listProducts
);

// Search products by name
router.get(
  '/search',
  authenticate,
  authorize('admin','pharmacist'),
  productController.searchProducts
);

// Bulk CSV import (admin & pharmacist)
router.post(
  '/import',
  authenticate,
  authorize('admin','pharmacist'),
  upload.single('file'),
  productController.importCsv
);

// Bulk email order for multiple products
router.post(
  '/email',
  authenticate,
  authorize('admin','pharmacist'),
  productController.emailBulkOrder
);

// Email order for a single product with quantity
router.post(
    '/:id/email-order',
    authenticate,
    authorize('admin', 'pharmacist'),
    (req, res, next) => {
      const quantity = Number(req.body.quantity) || 1; // default to 1 if not provided
      req.body.items = [{ id: Number(req.params.id), quantity }];
      next();
    },
    productController.emailBulkOrder
  );
  
// Filter products by supplier and month
router.get(
  '/filter',
  authenticate,
  authorize('admin', 'pharmacist'),
  productController.filterBySupplierAndMonth
);

module.exports = router;
