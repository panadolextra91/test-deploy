const { HealthRecord, Customer } = require('../models');
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

// Helper function to handle file cleanup
const cleanupFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
};

// Get all health records (admin/pharmacist only)
exports.getAllRecords = async (req, res) => {
    try {
        const records = await HealthRecord.findAll({
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }],
            order: [['date_recorded', 'DESC']]
        });

        // Add file URL to each record
        const recordsWithUrls = records.map(record => ({
            ...record.toJSON(),
            fileUrl: record.file_url || null
        }));

        res.status(200).json(recordsWithUrls);
    } catch (error) {
        console.error('Error getting all health records:', error);
        res.status(500).json({ error: 'Failed to retrieve health records' });
    }
};

// Get a specific health record by ID
exports.getRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await HealthRecord.findByPk(id, {
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        if (!record) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Check if user has permission to view this record
        if (!req.user.role) {
            // User is a customer, can only view their own records
            if (req.user.id !== record.customer_id) {
                return res.status(403).json({ error: 'Customers can only view their own records' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to view this record' });
        }

        res.status(200).json({
            ...record.toJSON(),
            fileUrl: record.file_url || null
        });
    } catch (error) {
        console.error('Error getting health record:', error);
        res.status(500).json({ error: 'Failed to retrieve health record' });
    }
};

// Get all health records for a specific customer
exports.getCustomerRecords = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Check if user has permission to view these records
        if (!req.user.role) {
            // User is a customer, can only view their own records
            if (req.user.id !== parseInt(customerId)) {
                return res.status(403).json({ error: 'Customers can only view their own records' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to view these records' });
        }

        const records = await HealthRecord.findAll({
            where: { customer_id: customerId },
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }],
            order: [['date_recorded', 'DESC']]
        });

        res.status(200).json(records);
    } catch (error) {
        console.error('Error getting customer health records:', error);
        res.status(500).json({ error: 'Failed to retrieve customer health records' });
    }
};

// Create a new health record
exports.createRecord = async (req, res) => {
    try {
        const {
            customer_id,
            record_type,
            title,
            description,
            date_recorded,
            provider_name
        } = req.body;

        console.log('📝 Creating health record - Request body:', req.body);
        console.log('📎 File received:', req.file ? 'Yes' : 'No');

        // Check if user has permission to create record for this customer
        if (!req.user.role) {
            // User is a customer, can only create records for themselves
            if (req.user.id !== parseInt(customer_id)) {
                if (req.file) {
                    await cleanupFile(req.file.path);
                }
                return res.status(403).json({ error: 'Customers can only create records for themselves' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            if (req.file) {
                await cleanupFile(req.file.path);
            }
            return res.status(403).json({ error: 'Not authorized to create record for this customer' });
        }

        // Handle Cloudinary upload for file
        let fileUrl = null;
        let imagePublicId = null;
        if (req.file) {
            console.log('☁️ Uploading file to Cloudinary...');
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'health-records',
                resource_type: 'auto'
            });
            fileUrl = result.secure_url;
            imagePublicId = result.public_id;
            console.log('✅ Cloudinary upload successful:', fileUrl);
            await cleanupFile(req.file.path);
        }

        const newRecord = await HealthRecord.create({
            customer_id,
            record_type,
            title,
            description,
            date_recorded: date_recorded || new Date(),
            provider_name,
            file_url: fileUrl,
            imagePublicId
        });

        const recordWithCustomer = await HealthRecord.findByPk(newRecord.id, {
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(201).json({
            ...recordWithCustomer.toJSON(),
            fileUrl: recordWithCustomer.file_url || null
        });
    } catch (error) {
        // Cleanup uploaded file if there's an error
        if (req.file) {
            await cleanupFile(req.file.path);
        }
        console.error('Error creating health record:', error);
        res.status(500).json({ error: 'Failed to create health record' });
    }
};

// Update a health record
exports.updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        const record = await HealthRecord.findByPk(id);
        if (!record) {
            if (req.file) {
                await cleanupFile(req.file.path);
            }
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Check if user has permission to update this record
        if (!req.user.role) {
            // User is a customer, can only update their own records
            if (req.user.id !== record.customer_id) {
                if (req.file) {
                    await cleanupFile(req.file.path);
                }
                return res.status(403).json({ error: 'Customers can only update their own records' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            if (req.file) {
                await cleanupFile(req.file.path);
            }
            return res.status(403).json({ error: 'Not authorized to update this record' });
        }

        // Handle file upload if present
        if (req.file) {
            console.log('☁️ Uploading new file to Cloudinary...');
            // Delete old file from Cloudinary if exists
            if (record.imagePublicId) {
                await cloudinary.uploader.destroy(record.imagePublicId);
            }

            // Upload new file
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'health-records',
                resource_type: 'auto'
            });
            updateData.file_url = result.secure_url;
            updateData.imagePublicId = result.public_id;
            console.log('✅ New file upload successful:', updateData.file_url);
            await cleanupFile(req.file.path);
        }

        // Update record
        await record.update(updateData);

        const updatedRecord = await HealthRecord.findByPk(id, {
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(200).json({
            ...updatedRecord.toJSON(),
            fileUrl: updatedRecord.file_url || null
        });
    } catch (error) {
        // Cleanup uploaded file if there's an error
        if (req.file) {
            await cleanupFile(req.file.path);
        }
        console.error('Error updating health record:', error);
        res.status(500).json({ error: 'Failed to update health record' });
    }
};

// Delete a health record
exports.deleteRecord = async (req, res) => {
    try {
        const { id } = req.params;
        
        const record = await HealthRecord.findByPk(id);
        if (!record) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Check if user has permission to delete this record
        if (!req.user.role) {
            // User is a customer, can only delete their own records
            if (req.user.id !== record.customer_id) {
                return res.status(403).json({ error: 'Customers can only delete their own records' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to delete this record' });
        }

        // Delete file from Cloudinary if exists
        if (record.imagePublicId) {
            await cloudinary.uploader.destroy(record.imagePublicId);
        }

        await record.destroy();
        res.status(200).json({ message: 'Health record deleted successfully' });
    } catch (error) {
        console.error('Error deleting health record:', error);
        res.status(500).json({ error: 'Failed to delete health record' });
    }
};

// Get records by type
exports.getRecordsByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { customerId } = req.query;

        let whereClause = { record_type: type };

        // Handle customer access
        if (!req.user.role) {
            // If user is a customer, only show their records
            whereClause.customer_id = req.user.id;
        } else if (customerId) {
            // If admin/pharmacist and customerId provided
            whereClause.customer_id = customerId;
        }

        console.log('Search criteria:', whereClause); // Debug log

        const records = await HealthRecord.findAll({
            where: whereClause,
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }],
            order: [['date_recorded', 'DESC']]
        });

        console.log('Records found:', records.length); // Debug log

        // Add file URL to each record
        const recordsWithUrls = records.map(record => ({
            ...record.toJSON(),
            fileUrl: record.file_url || null
        }));

        res.status(200).json(recordsWithUrls);
    } catch (error) {
        console.error('Error getting records by type:', error);
        res.status(500).json({ error: 'Failed to retrieve records' });
    }
};
