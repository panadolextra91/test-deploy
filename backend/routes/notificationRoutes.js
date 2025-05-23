const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middleware/authMiddleware');

// Get all notifications for a recipient (user or customer)
router.get('/:recipient_type/:recipient_id', authenticateToken, notificationController.getRecipientNotifications);

// Get resolved notifications (history) for a recipient
router.get('/:recipient_type/:recipient_id/resolved', authenticateToken, notificationController.getResolvedNotifications);

// Get unread notifications count for a recipient
router.get('/:recipient_type/:recipient_id/unread/count', authenticateToken, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read for a recipient
router.patch('/:recipient_type/:recipient_id/read/all', authenticateToken, notificationController.markAllAsRead);

// Create notification
router.post('/', authenticateToken, notificationController.createNotification);

// Delete notification
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// Delete all notifications for a recipient
router.delete('/:recipient_type/:recipient_id/all', authenticateToken, notificationController.deleteAllNotifications);

module.exports = router;


