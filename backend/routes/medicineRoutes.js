const express = require('express');
const medicineController = require('../controllers/medicineController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const medicineUpload = require('../middleware/medicineUploadMiddleware');
const router = express.Router();
//medicineRoutes.js
router.get('/low-stock', authenticateToken, medicineController.getLowStockMedicines);
router.get('/near-expiry', authenticateToken, medicineController.getNearExpiryMedicines);
router.get('/out-of-stock', authenticateToken, medicineController.getOutOfStockMedicines);

router.get('/', medicineController.getAllMedicines);
router.get('/:id', medicineController.getMedicineById);
router.get('/name/:name', medicineController.getMedicineByName)

router.post('/', authenticateToken, authorize('admin', 'pharmacist'), medicineUpload.single('image'), medicineController.createMedicine);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), medicineController.updateMedicine);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), medicineController.deleteMedicine);

// Medicine image routes
router.post('/:id/image', authenticateToken, authorize('admin', 'pharmacist'), medicineUpload.single('image'), medicineController.updateMedicineImage);
router.delete('/:id/image', authenticateToken, authorize('admin', 'pharmacist'), medicineController.deleteMedicineImage);

module.exports = router;
