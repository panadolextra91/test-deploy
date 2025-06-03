const { OTP, Customer } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to customer's email
const sendOTP = async (email, otp) => {
  try {
    if (!email) {
      throw new Error('No email provided for sending OTP');
    }

    console.log(`Sending OTP to email: ${email}`);
    
    // Send email using Nodemailer
    await transporter.sendMail({
      from: `"MediMaster" <${process.env.EMAIL_HOST}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your One-Time Password (OTP)</h2>
          <p>Use the following OTP to verify your identity:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px;">
            <strong>${otp}</strong>
          </div>
          <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `
    });
    
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Check if phone number is verified
exports.checkPhoneStatus = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if customer exists
    const customer = await Customer.findOne({ 
      where: { phone } 
    });

    if (!customer) {
      return res.json({
        exists: false,
        verified: false,
        hasPassword: false,
        message: 'Phone number not registered'
      });
    }

    res.json({
      exists: true,
      verified: customer.verified,
      hasPassword: !!customer.password,
      hasEmail: !!customer.email,
      message: customer.verified ? 'Phone number is verified' : 'Phone number exists but not verified'
    });
  } catch (error) {
    console.error('Error in checkPhoneStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request OTP for customer login
exports.requestOTP = async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if customer exists
    let customer = await Customer.findOne({ 
      where: { phone } 
    });
    
    if (!customer) {
      // Customer doesn't exist - auto-register
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required for new customer registration',
          requiresEmail: true,
          isNewCustomer: true
        });
      }

      try {
        // Create new customer with phone as name
        customer = await Customer.create({
          name: phone, // Use phone as name
          phone: phone,
          email: email,
          verified: false
        });
        console.log(`New customer auto-registered: ${phone}`);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ 
            error: 'Email is already registered with another account' 
          });
        }
        throw error;
      }
    } else {
      // Customer exists but has no email
      if (!customer.email) {
        if (!email) {
          return res.status(400).json({ 
            error: 'Email is required for this account',
            requiresEmail: true,
            isNewCustomer: false
          });
        }
        
        // Update existing customer with the provided email
        try {
          customer = await customer.update({ email });
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
              error: 'Email is already registered with another account' 
            });
          }
          throw error;
        }
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + 5); // OTP expires in 5 minutes

    // Hash the OTP before saving
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Save OTP to database
    await OTP.create({
      phone,
      otp: hashedOTP,
      expires_at,
      is_used: false
    });

    // Send OTP to customer's email
    try {
      await sendOTP(customer.email, otp);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return res.status(500).json({ 
        error: 'Failed to send OTP email',
        details: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: `OTP sent to your email: ${customer.email}`,
      expires_at,
      email: customer.email,
      emailSent: true,
      isNewCustomer: !customer.verified && !customer.password
    });
  } catch (error) {
    console.error('Error in requestOTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify OTP and log in customer
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // Find the most recent unused OTP for this phone
    const otpRecord = await OTP.findOne({
      where: {
        phone,
        is_used: false,
        expires_at: { [Op.gt]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark OTP as used
    await otpRecord.update({ is_used: true });

    // Find customer
    const customer = await Customer.findOne({ where: { phone } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        hasPassword: !!customer.password,
        verified: customer.verified
      },
      message: 'OTP verified successfully. You can now set your password.'
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
