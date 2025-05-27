const { Op } = require('sequelize');
const PharmaSalesRep = require('../models/PharmaSalesRep');
const Supplier = require('../models/Supplier');

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
