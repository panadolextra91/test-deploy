const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//userController.js
// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    const { username, password, name, email, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            name,
            email,
            role
        });

        res.status(201).json(newUser);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('Unique constraint error:', error.errors);
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        if (error.name === 'SequelizeValidationError') {
            console.error('Validation error:', error.errors);
            return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        console.error('Error creating user:', error.message || error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// User login
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'Anhthu@91',
            { expiresIn: '1h' }
        );

        // Include the role in the response
        res.status(200).json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id; // Get user ID from the authenticated request
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'name', 'email', 'role', 'created_at']
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user profile details
        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};

// Change user password
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if old password is correct
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

//forgot password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Validate email
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'A valid email is required' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a random secure password
        const newPassword = crypto.randomBytes(8).toString('hex'); // 16-character password

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        await user.update({ password: hashedPassword });

        // Configure the nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'webappanhthu@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Send the email
        await transporter.sendMail({
            from: '"MediMaster" <webappanhthu@gmail.com>',
            to: user.email,
            subject: 'Password Reset',
            text: `Your new password is: ${newPassword}`,
        });

        res.status(200).json({ message: 'A new password has been sent to your email.' });
    } catch (error) {
        console.error('Error in forgotPassword:', error.message || error);
        res.status(500).json({ error: 'Failed to process password reset request.' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params; // Extract ID from the request parameters

    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'name', 'email', 'role', 'created_at'] // Limit the fields returned
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user by ID:', error.message || error);
        res.status(500).json({ error: 'Failed to retrieve user' });
    }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
    const { id } = req.params; // Extract ID from the request parameters

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.destroy(); // Delete the user from the database

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error.message || error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Edit user by ID
exports.editUserById = async (req, res) => {
    const { id } = req.params; // Extract user ID from request parameters
    const { name, email, role } = req.body; // Get fields to update from request body

    try {
        // Find the user by ID
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user details
        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role; // Ensure role validation if required

        // Save the updated user details to the database
        await user.save();

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user by ID:', error.message || error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

