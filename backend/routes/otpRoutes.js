const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Check if phone number is verified
router.post('/check-phone', otpController.checkPhoneStatus);

// Request OTP for customer login
router.post('/request-otp', otpController.requestOTP);

// Verify OTP and authenticate customer
router.post('/verify-otp', otpController.verifyOTP);

module.exports = router;
