const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const medicineUpload = require('../middleware/medicineUploadMiddleware');

// Public routes (no authentication required)
// GET /api/news - Get all news with filtering and pagination
router.get('/', newsController.getAllNews);

// GET /api/news/featured - Get featured news articles
router.get('/featured', newsController.getFeaturedNews);

// GET /api/news/category/:category - Get news by category
router.get('/category/:category', newsController.getNewsByCategory);

// GET /api/news/:id - Get single news article by ID
router.get('/:id', newsController.getNewsById);

// Protected routes (admin only)
// POST /api/news - Create new news article
router.post('/', 
  authenticateToken, 
  authorize('admin'), 
  medicineUpload.single('image'), 
  newsController.createNews
);

// PUT /api/news/:id - Update news article
router.put('/:id', 
  authenticateToken, 
  authorize('admin'), 
  medicineUpload.single('image'), 
  newsController.updateNews
);

// DELETE /api/news/:id - Delete news article
router.delete('/:id', 
  authenticateToken, 
  authorize('admin'), 
  newsController.deleteNews
);

// DELETE /api/news/:id/image - Remove image from news article
router.delete('/:id/image', 
  authenticateToken, 
  authorize('admin'), 
  newsController.removeNewsImage
);

module.exports = router;
