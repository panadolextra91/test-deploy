const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authMiddleware');

// All schedule routes require authentication
router.use(authenticateToken);

// Get all schedules for the authenticated customer
router.get('/', scheduleController.getSchedules);

// Get a specific schedule by ID
router.get('/:id', scheduleController.getScheduleById);

// Create a new medication schedule
router.post('/', scheduleController.createSchedule);

// Update an existing schedule
router.put('/:id', scheduleController.updateSchedule);

// Delete a schedule
router.delete('/:id', scheduleController.deleteSchedule);

// Toggle schedule active/inactive status
//router.patch('/:id/toggle', scheduleController.toggleScheduleStatus);

// Log medication action (taken, skipped, snoozed, missed)
router.post('/log', scheduleController.logMedicationAction);

// Get medication logs with filtering options
router.get('/logs/history', scheduleController.getMedicationLogs);

// Get adherence statistics
router.get('/stats/adherence', scheduleController.getAdherenceStats);

// Get pending notifications for the user
router.get('/notifications/pending', scheduleController.getPendingNotifications);

module.exports = router; 