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
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        await supplier.destroy();
        res.status(204).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
};
