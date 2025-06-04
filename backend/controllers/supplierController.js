const Supplier = require('../models/Supplier');
//supplierController.js
// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve suppliers' });
    }
};

// Get a single supplier by ID
exports.getSupplierById = async (req, res) => {
    const { id } = req.params;
    try {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve supplier' });
    }
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
    const { name, contact_info, address } = req.body;
    try {
        const newSupplier = await Supplier.create({
            name,
            contact_info,
            address
        });
        res.status(201).json(newSupplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create supplier' });
    }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { name, contact_info, address } = req.body;
    try {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        supplier.name = name;
        supplier.contact_info = contact_info;
        supplier.address = address;

        await supplier.save();
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update supplier' });
    }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
    const { id } = req.params;
    try {
        const { Medicine, Product, PharmaSalesRep } = require('../models');
        
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Check for associated medicines
        const medicineCount = await Medicine.count({
            where: { supplier_id: id }
        });

        // Check for associated products
        const productCount = await Product.count({
            where: { supplier_id: id }
        });

        // Check for associated pharma sales reps
        const salesRepCount = await PharmaSalesRep.count({
            where: { supplier_id: id }
        });

        // If there are associated records, prevent deletion
        if (medicineCount > 0 || productCount > 0 || salesRepCount > 0) {
            const associations = [];
            if (medicineCount > 0) associations.push(`${medicineCount} medicine(s)`);
            if (productCount > 0) associations.push(`${productCount} product(s)`);
            if (salesRepCount > 0) associations.push(`${salesRepCount} sales rep(s)`);
            
            return res.status(400).json({ 
                error: `Cannot delete supplier. It has ${associations.join(', ')} associated with it. Please reassign or remove these records first.` 
            });
        }

        await supplier.destroy();
        res.status(204).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        
        // Handle specific database constraint errors
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: 'Cannot delete supplier due to existing references. Please remove all associated records first.' 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to delete supplier',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Find or create supplier by name (for registration)
exports.findOrCreateSupplier = async (req, res) => {
    const { name, contact_info, address } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Supplier name is required' });
    }

    try {
        const { Op } = require('sequelize');
        
        // First, try to find existing supplier by name (case-insensitive)
        let supplier = await Supplier.findOne({
            where: {
                name: {
                    [Op.like]: `%${name.trim()}%`
                }
            }
        });

        // If not found with LIKE, try exact match with different cases
        if (!supplier) {
            const allSuppliers = await Supplier.findAll();
            supplier = allSuppliers.find(s => 
                s.name.toLowerCase() === name.trim().toLowerCase()
            );
        }

        if (supplier) {
            // Supplier exists, return it
            return res.status(200).json({
                supplier,
                created: false,
                message: 'Existing supplier found'
            });
        }

        // Supplier doesn't exist, create new one
        supplier = await Supplier.create({
            name: name.trim(),
            contact_info: contact_info || null,
            address: address || null
        });

        res.status(201).json({
            supplier,
            created: true,
            message: 'New supplier created'
        });
    } catch (error) {
        console.error('Error finding or creating supplier:', error);
        res.status(500).json({ error: 'Failed to find or create supplier' });
    }
};
