const { Customer } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.loginWithPassword = async (req, res) => {
    const { phone, password } = req.body;

    try {
        // Find customer
        const customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if customer is verified and has password
        if (!customer.verified || !customer.password) {
            return res.status(401).json({ 
                error: 'Account not verified or password not set',
                requiresOTP: true
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, customer.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: customer.id, phone: customer.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            }
        });
    } catch (error) {
        console.error('Error in loginWithPassword:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 