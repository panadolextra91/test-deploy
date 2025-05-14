const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary using the CLOUDINARY_URL from environment variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  console.error('CLOUDINARY_URL is not set in environment variables');
}

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
        // Log the login attempt
        console.log('Login attempt for username:', username);

        // Check if username and password are provided
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find the user
        const user = await User.findOne({ 
            where: { username },
            raw: false // Ensure we get a model instance
        });

        // Log user lookup result
        console.log('User found:', !!user);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'Anhthu@91',
            { expiresIn: '1h' }
        );

        // Send successful response
        res.status(200).json({ 
            token, 
            role: user.role,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                avatar: user.avatarUrl
            }
        });
    } catch (error) {
        // Detailed error logging
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            error: 'Login failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'name', 'email', 'role', 'created_at', 'avatar', 'avatarUrl']
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User profile data:', user.toJSON()); // Add this for debugging
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

        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'A valid email is required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'webappanhthu@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

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
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'name', 'email', 'role', 'created_at']
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ error: 'Failed to retrieve user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await user.destroy();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Edit user by ID
exports.editUserById = async (req, res) => {
    const { id } = req.params;
    const { username, name, email, role } = req.body;
    
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username) user.username = username;
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Upload or update avatar
exports.updateAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!process.env.CLOUDINARY_URL) {
        console.error('CLOUDINARY_URL is not configured');
        return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Uploading file to Cloudinary:', req.file.path);
        
        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            width: 150,
            height: 150,
            crop: 'fill',
            resource_type: 'auto'
        });

        console.log('File uploaded to Cloudinary:', result.secure_url);

        // Delete the temporary file
        try {
            await fs.unlink(req.file.path);
            console.log('Temporary file deleted:', req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

        // If user already has an avatar, delete the old one from Cloudinary
        if (user.avatarPublicId) {
            try {
                console.log('Deleting old avatar from Cloudinary:', user.avatarPublicId);
                await cloudinary.uploader.destroy(user.avatarPublicId);
                console.log('Old avatar deleted successfully');
            } catch (deleteError) {
                console.error('Error deleting old avatar from Cloudinary:', deleteError);
                // Continue with the update even if deletion of old avatar fails
            }
        }

        // Update user with new avatar URL and public ID
        await user.update({
            avatar: result.secure_url,
            avatarPublicId: result.public_id
        });

        console.log('User avatar updated successfully');
        
        res.json({
            success: true,
            message: 'Avatar updated successfully',
            avatarUrl: result.secure_url
        });
    } catch (error) {
        console.error('Error in updateAvatar:', {
            message: error.message,
            stack: error.stack,
            ...(error.response && { response: error.response.data })
        });
        
        // Clean up the temporary file in case of error
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up temporary file after error:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update avatar',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
    if (!process.env.CLOUDINARY_URL) {
        console.error('CLOUDINARY_URL is not configured');
        return res.status(500).json({ 
            success: false,
            message: 'Server configuration error' 
        });
    }

    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        if (user.avatarPublicId) {
            try {
                console.log('Deleting avatar from Cloudinary:', user.avatarPublicId);
                await cloudinary.uploader.destroy(user.avatarPublicId);
                console.log('Avatar deleted from Cloudinary successfully');
                
                // Update user record
                await user.update({ 
                    avatar: null,
                    avatarPublicId: null 
                });
                
                return res.json({ 
                    success: true,
                    message: 'Avatar deleted successfully',
                    avatarUrl: null
                });
            } catch (deleteError) {
                console.error('Error deleting avatar from Cloudinary:', {
                    message: deleteError.message,
                    stack: deleteError.stack,
                    ...(deleteError.response && { response: deleteError.response.data })
                });
                
                // Even if Cloudinary deletion fails, we still want to update the user record
                // to maintain consistency in our database
                await user.update({ 
                    avatar: null,
                    avatarPublicId: null 
                });
                
                return res.json({
                    success: true,
                    message: 'Avatar reference removed, but there was an issue cleaning up the file in storage',
                    avatarUrl: null
                });
            }
        }

        // If no avatar exists, just return success
        res.json({ 
            success: true,
            message: 'No avatar to delete',
            avatarUrl: null
        });
    } catch (error) {
        console.error('Error in deleteAvatar:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete avatar',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

