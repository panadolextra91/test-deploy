const Medicine = require('../models/Medicines');
const sequelize = require('../config/database');
const {QueryTypes} = require('sequelize');
const {Op} = require('sequelize');
const Location = require('../models/Location');
//medicineController.js
// Get all medicines
exports.getAllMedicines = async (req, res) => {
    try {
        const query = `
            SELECT 
                medicines.id,
                medicines.name,
                medicines.description,
                medicines.price,
                medicines.quantity,
                medicines.expiry_date,
                suppliers.name AS supplier,
                locations.name AS location,
                categories.name AS category
            FROM 
                medicines
            LEFT JOIN 
                suppliers ON medicines.supplier_id = suppliers.id
            LEFT JOIN 
                locations ON medicines.location_id = locations.id
            LEFT JOIN 
                categories ON medicines.category_id = categories.id;
        `;

        // Use sequelize to execute raw SQL query
        const rows = await sequelize.query(query, { type: QueryTypes.SELECT });
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching medicines data:', error);
        res.status(500).json({ message: "Failed to retrieve medicines" });
    }
};

// Get a single medicine by ID
exports.getMedicineById = async (req, res) => {
    const { id } = req.params;
    try {
        const medicine = await Medicine.findByPk(id);
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve medicine' });
    }
};

//Get med by name
exports.getMedicineByName = async (req, res) => {
    const { name } = req.params;

    try {
        const medicines = await Medicine.findAll({
            where: {
                name: {
                    [Op.like]: `%${name}%`, // Matches any part of the name
                },
            },
        });

        if (medicines.length === 0) {
            return res.status(404).json({ error: 'No medicines found' });
        }

        res.status(200).json(medicines);
    } catch (error) {
        console.error('Error retrieving medicines by name:', error);
        res.status(500).json({ error: 'Failed to retrieve medicines' });
    }
};

// Create a new medicine
exports.createMedicine = async (req, res) => {
    const { name, category_id, description, price, quantity, supplier_id, location_id, image_url, expiry_date } = req.body;
    try {
        const newMedicine = await Medicine.create({
            name,
            category_id,
            description,
            price,
            quantity,
            supplier_id,
            location_id,
            image_url,
            expiry_date
        });
        res.status(201).json(newMedicine);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create medicine' });
    }
};

// Update a medicine
exports.updateMedicine = async (req, res) => {
    const { id } = req.params;
    const { name, category_id, description, price, quantity, supplier_id, location_id, image_url, expiry_date } = req.body;
    try {
        const medicine = await Medicine.findByPk(id);
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        medicine.name = name;
        medicine.category_id = category_id;
        medicine.description = description;
        medicine.price = price;
        medicine.quantity = quantity;
        medicine.supplier_id = supplier_id;
        medicine.location_id = location_id;
        medicine.image_url = image_url;
        medicine.expiry_date = expiry_date;

        await medicine.save();
        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medicine' });
    }
};

// Delete a medicine
exports.deleteMedicine = async (req, res) => {
    const { id } = req.params; // Get medicine ID from the request parameters
    try {
        const medicine = await Medicine.findByPk(id); // Find medicine by ID
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' }); // Return 404 if not found
        }
        await medicine.destroy(); // Delete the medicine from the database
        res.status(204).json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error("Error deleting medicine:", error);
        res.status(500).json({ error: 'Failed to delete medicine' });
    }
};

// Get low-stock medicines with location data
exports.getLowStockMedicines = async (req, res) => {
    const LOW_STOCK_THRESHOLD = 20;
    try {
        const lowStockMedicines = await Medicine.findAll({
            where: {
                quantity: { [Op.lt]: LOW_STOCK_THRESHOLD, [Op.gt]: 0 }
            },
            include: [{ model: Location, attributes: ['name'] }] // Include only location name
        });
        res.status(200).json(lowStockMedicines);
    } catch (error) {
        console.error("Error fetching low-stock medicines:", error);
        res.status(500).json({ message: "Failed to fetch low-stock medicines" });
    }
};

// Get near-expiry medicines with location data
exports.getNearExpiryMedicines = async (req, res) => {
    const expiryThreshold = new Date();
    expiryThreshold.setMonth(expiryThreshold.getMonth() + 1); // 1 month before expiry

    try {
        const nearExpiryMedicines = await Medicine.findAll({
            where: {
                expiry_date: { [Op.lt]: expiryThreshold, [Op.gt]: new Date() }
            },
            include: [{ model: Location, attributes: ['name'] }] // Include only location name
        });
        res.status(200).json(nearExpiryMedicines);
    } catch (error) {
        console.error("Error fetching near-expiry medicines:", error);
        res.status(500).json({ message: "Failed to fetch near-expiry medicines" });
    }
};

// Get out-of-stock medicines with location data
exports.getOutOfStockMedicines = async (req, res) => {
    try {
        const outOfStockMedicines = await Medicine.findAll({
            where: { quantity: 0 },
            include: [{ model: Location, attributes: ['name'] }] // Include only location name
        });
        res.status(200).json(outOfStockMedicines);
    } catch (error) {
        console.error("Error fetching out-of-stock medicines:", error);
        res.status(500).json({ message: "Failed to fetch out-of-stock medicines" });
    }
};