const { Allergy, Customer } = require('../models');

// Create a new allergy
exports.createAllergy = async (req, res) => {
    try {
        const { name, description, customer_id } = req.body;

        // Check if user has permission to create allergy for this customer
        if (!req.user.role) {
            // User is a customer, can only create allergies for themselves
            if (req.user.id !== parseInt(customer_id)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Customers can only create allergies for themselves'
                });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to create allergy for this customer'
            });
        }

        // Check if customer exists
        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        const allergy = await Allergy.create({
            name,
            description,
            customer_id
        });

        res.status(201).json({
            status: 'success',
            data: allergy
        });
    } catch (error) {
        console.error('Error creating allergy:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create allergy'
        });
    }
};

// Get all allergies (for users) or customer's allergies (for customers)
exports.getAllergies = async (req, res) => {
    try {
        let whereClause = {};
        
        // Handle customer access
        if (!req.user.role) {
            // If user is a customer, only show their allergies
            whereClause.customer_id = req.user.id;
        } else if (req.user.role === 'admin' || req.user.role === 'pharmacist') {
            // If admin/pharmacist and customer_id provided in query
            const { customer_id } = req.query;
            if (customer_id) {
                whereClause.customer_id = customer_id;
            }
        } else {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to view allergies'
            });
        }

        const allergies = await Allergy.findAll({
            where: whereClause,
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(200).json({
            status: 'success',
            data: allergies
        });
    } catch (error) {
        console.error('Error getting allergies:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve allergies'
        });
    }
};

// Get a single allergy
exports.getAllergy = async (req, res) => {
    try {
        const { id } = req.params;
        const allergy = await Allergy.findByPk(id, {
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        if (!allergy) {
            return res.status(404).json({
                status: 'error',
                message: 'Allergy not found'
            });
        }

        // Check if user has permission to view this allergy
        if (!req.user.role) {
            // User is a customer, can only view their own allergies
            if (req.user.id !== allergy.customer_id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Customers can only view their own allergies'
                });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to view this allergy'
            });
        }

        res.status(200).json({
            status: 'success',
            data: allergy
        });
    } catch (error) {
        console.error('Error getting allergy:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve allergy'
        });
    }
};

// Update an allergy
exports.updateAllergy = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const allergy = await Allergy.findByPk(id);
        if (!allergy) {
            return res.status(404).json({
                status: 'error',
                message: 'Allergy not found'
            });
        }

        // Check if user has permission to update this allergy
        if (!req.user.role) {
            // User is a customer, can only update their own allergies
            if (req.user.id !== allergy.customer_id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Customers can only update their own allergies'
                });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to update this allergy'
            });
        }

        await allergy.update({
            name: name || allergy.name,
            description: description || allergy.description
        });

        const updatedAllergy = await Allergy.findByPk(id, {
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(200).json({
            status: 'success',
            data: updatedAllergy
        });
    } catch (error) {
        console.error('Error updating allergy:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update allergy'
        });
    }
};

// Delete an allergy
exports.deleteAllergy = async (req, res) => {
    try {
        const { id } = req.params;
        
        const allergy = await Allergy.findByPk(id);
        if (!allergy) {
            return res.status(404).json({
                status: 'error',
                message: 'Allergy not found'
            });
        }

        // Check if user has permission to delete this allergy
        if (!req.user.role) {
            // User is a customer, can only delete their own allergies
            if (req.user.id !== allergy.customer_id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Customers can only delete their own allergies'
                });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to delete this allergy'
            });
        }

        await allergy.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Allergy deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting allergy:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete allergy'
        });
    }
};
