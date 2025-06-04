const { Op } = require('sequelize');
const PharmaSalesRep = require('../models/PharmaSalesRep');
const Supplier = require('../models/Supplier');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Get all pharma sales reps with their supplier info
exports.getAllSalesReps = async (req, res) => {
  try {
    const salesReps = await PharmaSalesRep.findAll({
      include: [{ 
        model: Supplier, 
        attributes: ['id', 'name'],
        as: 'supplier'
      }]
    });
    res.json(salesReps);
  } catch (err) {
    console.error('Error getting sales reps:', err);
    res.status(500).json({ error: 'Failed to get sales reps' });
  }
};

// Get sales rep by ID
exports.getSalesRepById = async (req, res) => {
  try {
    const salesRep = await PharmaSalesRep.findByPk(req.params.id, {
      include: [{ 
        model: Supplier, 
        attributes: ['id', 'name'],
        as: 'supplier'
      }]
    });
    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }
    res.json(salesRep);
  } catch (err) {
    console.error('Error getting sales rep:', err);
    res.status(500).json({ error: 'Failed to get sales rep' });
  }
};

// Get sales rep by name
exports.getSalesRepByName = async (req, res) => {
  try {
    const salesRep = await PharmaSalesRep.findOne({
      where: { name: req.params.name },
      include: [{ 
        model: Supplier, 
        attributes: ['id', 'name'],
        as: 'supplier'
      }]
    });
    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }
    res.json(salesRep);
  } catch (err) {
    console.error('Error getting sales rep:', err);
    res.status(500).json({ error: 'Failed to get sales rep' });
  }
};

// Filter sales reps by supplier
exports.getSalesRepsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const salesReps = await PharmaSalesRep.findAll({
      where: { supplier_id: supplierId },
      include: [{ 
        model: Supplier, 
        attributes: ['id', 'name'],
        as: 'supplier'
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.name
      },
      sales_reps: salesReps,
      count: salesReps.length
    });
  } catch (err) {
    console.error('Error filtering sales reps by supplier:', err);
    res.status(500).json({ error: 'Failed to filter sales reps by supplier' });
  }
};

// Create new sales rep
exports.createSalesRep = async (req, res) => {
  try {
    const { name, email, phone, supplier_id } = req.body;

    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if email already exists
    const existingRep = await PharmaSalesRep.findOne({ where: { email } });
    if (existingRep) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salesRep = await PharmaSalesRep.create({
      name,
      email,
      phone,
      supplier_id
    });

    res.status(201).json(salesRep);
  } catch (err) {
    console.error('Error creating sales rep:', err);
    res.status(500).json({ error: 'Failed to create sales rep' });
  }
};

// Update sales rep
exports.updateSalesRep = async (req, res) => {
  try {
    const { name, email, phone, supplier_id } = req.body;
    const salesRep = await PharmaSalesRep.findByPk(req.params.id);

    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    // If email is being changed, check if new email exists
    if (email && email !== salesRep.email) {
      const existingRep = await PharmaSalesRep.findOne({ where: { email } });
      if (existingRep) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // If supplier is being changed, check if new supplier exists
    if (supplier_id && supplier_id !== salesRep.supplier_id) {
      const supplier = await Supplier.findByPk(supplier_id);
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
    }

    await salesRep.update({
      name: name || salesRep.name,
      email: email || salesRep.email,
      phone: phone || salesRep.phone,
      supplier_id: supplier_id || salesRep.supplier_id
    });

    res.json(salesRep);
  } catch (err) {
    console.error('Error updating sales rep:', err);
    res.status(500).json({ error: 'Failed to update sales rep' });
  }
};

// Delete sales rep
exports.deleteSalesRep = async (req, res) => {
  try {
    const salesRep = await PharmaSalesRep.findByPk(req.params.id);
    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    await salesRep.destroy();
    res.json({ message: 'Sales rep deleted successfully' });
  } catch (err) {
    console.error('Error deleting sales rep:', err);
    res.status(500).json({ error: 'Failed to delete sales rep' });
  }
};

// Register new sales rep
exports.registerSalesRep = async (req, res) => {
  try {
    const { name, email, password, phone, supplier_id } = req.body;

    // Validate required fields
    if (!name || !email || !password || !supplier_id) {
      return res.status(400).json({ error: 'Name, email, password, and supplier are required' });
    }

    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if email already exists
    const existingRep = await PharmaSalesRep.findOne({ where: { email } });
    if (existingRep) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new sales rep
    const salesRep = await PharmaSalesRep.create({
      name,
      email,
      password,
      phone,
      supplier_id,
      is_active: true
    });

    // Remove password from response
    const repResponse = { ...salesRep.toJSON() };
    delete repResponse.password;

    res.status(201).json({
      message: 'Registration successful',
      salesRep: repResponse
    });
  } catch (error) {
    console.error('Error registering sales rep:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login sales rep
exports.loginSalesRep = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find sales rep by email
    const salesRep = await PharmaSalesRep.findOne({
      where: { email, is_active: true },
      include: [{
        model: Supplier,
        attributes: ['id', 'name'],
        as: 'supplier'
      }]
    });

    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found or inactive' });
    }

    // Check if password is set (for existing records)
    if (!salesRep.password) {
      return res.status(400).json({ 
        error: 'Account not activated. Please contact admin to set up your password.' 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, salesRep.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: salesRep.id, 
        email: salesRep.email, 
        role: 'sales_rep',
        supplier_id: salesRep.supplier_id 
      },
      process.env.JWT_SECRET || 'Anhthu@91',
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      salesRep: {
        id: salesRep.id,
        name: salesRep.name,
        email: salesRep.email,
        phone: salesRep.phone,
        supplier: salesRep.supplier,
        role: 'sales_rep'
      }
    });
  } catch (error) {
    console.error('Error logging in sales rep:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get sales rep profile
exports.getSalesRepProfile = async (req, res) => {
  try {
    const salesRep = await PharmaSalesRep.findByPk(req.salesRep.id, {
      attributes: ['id', 'name', 'email', 'phone', 'supplier_id', 'is_active', 'created_at'],
      include: [{
        model: Supplier,
        attributes: ['id', 'name'],
        as: 'supplier'
      }]
    });

    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    res.status(200).json(salesRep);
  } catch (error) {
    console.error('Error getting sales rep profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update sales rep profile
exports.updateSalesRepProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const salesRep = await PharmaSalesRep.findByPk(req.salesRep.id);

    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    // Update allowed fields
    if (name) salesRep.name = name;
    if (phone) salesRep.phone = phone;

    await salesRep.save();

    // Remove password from response
    const repResponse = { ...salesRep.toJSON() };
    delete repResponse.password;

    res.status(200).json(repResponse);
  } catch (error) {
    console.error('Error updating sales rep profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
exports.changeSalesRepPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    const salesRep = await PharmaSalesRep.findByPk(req.salesRep.id);
    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    // Verify old password
    if (salesRep.password) {
      const validPassword = await bcrypt.compare(oldPassword, salesRep.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Incorrect old password' });
      }
    }

    // Update password
    salesRep.password = newPassword; // Will be hashed by the hook
    await salesRep.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Forgot password
exports.forgotSalesRepPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const salesRep = await PharmaSalesRep.findOne({ where: { email, is_active: true } });
    if (!salesRep) {
      return res.status(404).json({ error: 'Sales rep not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await salesRep.update({
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires
    });

    // Send email with reset link
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'webappanhthu@gmail.com',
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales-rep/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: '"MediMaster" <webappanhthu@gmail.com>',
      to: salesRep.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your sales rep account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Reset password with token
exports.resetSalesRepPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const salesRep = await PharmaSalesRep.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [Op.gt]: new Date() },
        is_active: true
      }
    });

    if (!salesRep) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    await salesRep.update({
      password: newPassword, // Will be hashed by the hook
      reset_token: null,
      reset_token_expires: null
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
