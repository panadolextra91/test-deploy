const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware'); // Role-based authorization middleware
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
//userRoutes.js
// Define routes
router.get('/', authenticateToken, authorize('admin'), userController.getAllUsers); // Only admin can get all users
router.post('/', authenticateToken, authorize('admin'), userController.createUser); // Only admin can create users
router.post('/login', userController.loginUser); // Public route for login
router.get('/profile', authenticateToken, authorize('admin', 'pharmacist'), userController.getUserProfile); // Get user profile
router.put('/profile', authenticateToken, authorize('admin', 'pharmacist'), userController.updateUserProfile); // Update profile
router.put('/change-password', authenticateToken, authorize('admin', 'pharmacist'), userController.changePassword); // Change password
router.post('/forgot-password', userController.forgotPassword);
router.get('/:id', authenticateToken, authorize('admin', 'pharmacist'), userController.getUserById); // Get user by ID
router.delete('/:id', authenticateToken, authorize('admin', 'pharmacist'), userController.deleteUser); // Delete user by ID
router.put('/:id', authenticateToken, authorize('admin', 'pharmacist'), userController.editUserById); // Edit user
// Avatar routes
router.post('/avatar', authenticateToken, upload.single('avatar'), userController.updateAvatar);
router.delete('/avatar', authenticateToken, userController.deleteAvatar);
module.exports = router;
