const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login with password
router.post('/login', authController.loginWithPassword);

module.exports = router; 