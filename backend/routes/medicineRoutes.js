const express = require('express');
const medicineController = require('../controllers/medicineController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const router = express.Router();
//medicineRoutes.js
router.get('/low-stock', authenticateToken, medicineController.getLowStockMedicines);
router.get('/near-expiry', authenticateToken, medicineController.getNearExpiryMedicines);
router.get('/out-of-stock', authenticateToken, medicineController.getOutOfStockMedicines);

router.get('/', authenticateToken, medicineController.getAllMedicines);
router.get('/:id', medicineController.getMedicineById);
router.get('/name/:name', medicineController.getMedicineByName)

router.post('/', authenticateToken, authorize('admin', 'pharmacist'), medicineController.createMedicine);
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), medicineController.updateMedicine);
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), medicineController.deleteMedicine);

module.exports = router;
