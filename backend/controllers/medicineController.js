const Medicine = require('../models/Medicines');
const { Brand } = require('../models');
const sequelize = require('../config/database');
const { QueryTypes, Op } = require('sequelize');
const Location = require('../models/Location');
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

// Get all medicines with optional brand filtering
exports.getAllMedicines = async (req, res) => {
    try {
        const { brand_id, search, category_id } = req.query;
        
        let whereClause = '';
        const queryParams = [];

        // Build WHERE clause for filtering
        const conditions = [];
        
        if (brand_id) {
            conditions.push('medicines.brand_id = ?');
            queryParams.push(brand_id);
        }
        
        if (search) {
            conditions.push('medicines.name LIKE ?');
            queryParams.push(`%${search}%`);
        }
        
        if (category_id) {
            conditions.push('medicines.category_id = ?');
            queryParams.push(category_id);
        }
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        const query = `
            SELECT 
                medicines.*,
                suppliers.name AS supplier_name,
                locations.name AS location_name,
                categories.name AS category_name,
                brands.name AS brand_name,
                brands.manufacturer AS brand_manufacturer
            FROM 
                medicines
            LEFT JOIN 
                suppliers ON medicines.supplier_id = suppliers.id
            LEFT JOIN 
                locations ON medicines.location_id = locations.id
            LEFT JOIN 
                categories ON medicines.category_id = categories.id
            LEFT JOIN 
                brands ON medicines.brand_id = brands.id
            ${whereClause}
            ORDER BY medicines.name ASC
        `;

        const medicines = await sequelize.query(query, { 
            type: QueryTypes.SELECT,
            replacements: queryParams,
            raw: true
        });

        const medicinesWithUrls = medicines.map(medicine => ({
            ...medicine,
            supplier: medicine.supplier_name,
            location: medicine.location_name,
            category: medicine.category_name,
            brand: medicine.brand_name,
            brand_manufacturer: medicine.brand_manufacturer,
            imageUrl: medicine.image || null
        }));

        res.status(200).json(medicinesWithUrls);
    } catch (error) {
        console.error('Error fetching medicines data:', error);
        res.status(500).json({ message: "Failed to retrieve medicines" });
    }
};

// Get a single medicine by ID
exports.getMedicineById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                medicines.*,
                suppliers.name AS supplier_name,
                locations.name AS location_name,
                categories.name AS category_name,
                brands.name AS brand_name,
                brands.manufacturer AS brand_manufacturer
            FROM 
                medicines
            LEFT JOIN 
                suppliers ON medicines.supplier_id = suppliers.id
            LEFT JOIN 
                locations ON medicines.location_id = locations.id
            LEFT JOIN 
                categories ON medicines.category_id = categories.id
            LEFT JOIN 
                brands ON medicines.brand_id = brands.id
            WHERE medicines.id = ?
        `;

        const medicine = await sequelize.query(query, { 
            type: QueryTypes.SELECT,
            replacements: [id],
            raw: true
        });

        if (!medicine || medicine.length === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        const medicineWithDetails = {
            ...medicine[0],
            supplier: medicine[0].supplier_name,
            location: medicine[0].location_name,
            category: medicine[0].category_name,
            brand: medicine[0].brand_name,
            brand_manufacturer: medicine[0].brand_manufacturer,
            imageUrl: medicine[0].image || null
        };

        res.status(200).json(medicineWithDetails);
    } catch (error) {
        console.error('Error retrieving medicine by ID:', error);
        res.status(500).json({ error: 'Failed to retrieve medicine' });
    }
};

// Get medicine by name
exports.getMedicineByName = async (req, res) => {
    const { name } = req.params;
    try {
        const query = `
            SELECT 
                medicines.*,
                suppliers.name AS supplier_name,
                locations.name AS location_name,
                categories.name AS category_name,
                brands.name AS brand_name,
                brands.manufacturer AS brand_manufacturer
            FROM 
                medicines
            LEFT JOIN 
                suppliers ON medicines.supplier_id = suppliers.id
            LEFT JOIN 
                locations ON medicines.location_id = locations.id
            LEFT JOIN 
                categories ON medicines.category_id = categories.id
            LEFT JOIN 
                brands ON medicines.brand_id = brands.id
            WHERE medicines.name LIKE ?
            ORDER BY medicines.name ASC
        `;

        const medicines = await sequelize.query(query, { 
            type: QueryTypes.SELECT,
            replacements: [`%${name}%`],
            raw: true
        });

        if (medicines.length === 0) {
            return res.status(404).json({ error: 'No medicines found' });
        }

        const medicinesWithDetails = medicines.map(medicine => ({
            ...medicine,
            supplier: medicine.supplier_name,
            location: medicine.location_name,
            category: medicine.category_name,
            brand: medicine.brand_name,
            brand_manufacturer: medicine.brand_manufacturer,
            imageUrl: medicine.image || null
        }));

        res.status(200).json(medicinesWithDetails);
    } catch (error) {
        console.error('Error retrieving medicines by name:', error);
        res.status(500).json({ error: 'Failed to retrieve medicines' });
    }
};

// Create a new medicine with optional image upload to Cloudinary
exports.createMedicine = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        console.log('📝 Creating medicine - Request body:', req.body);
        console.log('📎 File received:', req.file ? 'Yes' : 'No');
        if (req.file) {
            console.log('📎 File details:', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });
        }

        const price = parseFloat(req.body.price);
        const quantity = parseInt(req.body.quantity, 10);
        const category_id = parseInt(req.body.category_id, 10);
        const supplier_id = parseInt(req.body.supplier_id, 10);
        const location_id = parseInt(req.body.location_id, 10);
        const brand_id = req.body.brand_id ? parseInt(req.body.brand_id, 10) : null;

        if (!req.body.name || !category_id || !price || !quantity || !supplier_id || !location_id || !req.body.expiry_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Handle Cloudinary upload
        let imageUrl = null;
        let imagePublicId = null;
        if (req.file) {
            console.log('☁️ Uploading to Cloudinary...');
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'medicines',
                resource_type: 'auto'
            });
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
            console.log('✅ Cloudinary upload successful:', imageUrl);
            await fs.unlink(req.file.path);
        } else {
            console.log('⚠️ No file to upload');
        }

        const newMedicine = await Medicine.create({
            name: req.body.name,
            category_id,
            description: req.body.description || null,
            price,
            quantity,
            supplier_id,
            location_id,
            brand_id,
            image: imageUrl,
            imagePublicId,
            expiry_date: req.body.expiry_date
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            ...newMedicine.toJSON(),
            imageUrl: newMedicine.image || null
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating medicine:', error);
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch {};
        }
        res.status(500).json({ error: 'Failed to create medicine', details: error.message });
    }
};

// Update a medicine, optionally replacing its image via Cloudinary
exports.updateMedicine = async (req, res) => {
    const { id } = req.params;
    try {
        const medicine = await Medicine.findByPk(id);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

        // Update basic fields
        Object.assign(medicine, {
            name: req.body.name,
            category_id: req.body.category_id,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            supplier_id: req.body.supplier_id,
            location_id: req.body.location_id,
            brand_id: req.body.brand_id !== undefined ? req.body.brand_id : medicine.brand_id,
            expiry_date: req.body.expiry_date
        });

        // If a new image file is provided, replace it in Cloudinary
        if (req.file) {
            // Delete old asset if exists
            if (medicine.imagePublicId) {
                await cloudinary.uploader.destroy(medicine.imagePublicId);
            }
            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'medicines',
                resource_type: 'auto'
            });
            medicine.image = result.secure_url;
            medicine.imagePublicId = result.public_id;
            await fs.unlink(req.file.path);
        }

        await medicine.save();
        res.status(200).json(medicine);
    } catch (error) {
        console.error('Error updating medicine:', error);
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch {};
        }
        res.status(500).json({ error: 'Failed to update medicine', details: error.message });
    }
};

// Delete a medicine
exports.deleteMedicine = async (req, res) => {
    const { id } = req.params;
    try {
        const medicine = await Medicine.findByPk(id);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

        await medicine.destroy();
        res.status(204).json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error("Error deleting medicine:", error);
        res.status(500).json({ error: 'Failed to delete medicine' });
    }
};

// Get low-stock medicines with location data
exports.getLowStockMedicines = async (req, res) => {
    try {
        const meds = await Medicine.findAll({
            where: { quantity: { [Op.lt]: 20, [Op.gt]: 0 } },
            include: [{ model: Location, attributes: ['name'] }]
        });
        res.status(200).json(meds);
    } catch (error) {
        console.error("Error fetching low-stock medicines:", error);
        res.status(500).json({ message: "Failed to fetch low-stock medicines" });
    }
};

// Get near-expiry medicines with location data
exports.getNearExpiryMedicines = async (req, res) => {
    try {
        const threshold = new Date();
        threshold.setMonth(threshold.getMonth() + 1);
        const meds = await Medicine.findAll({
            where: { expiry_date: { [Op.lt]: threshold, [Op.gt]: new Date() } },
            include: [{ model: Location, attributes: ['name'] }]
        });
        res.status(200).json(meds);
    } catch (error) {
        console.error("Error fetching near-expiry medicines:", error);
        res.status(500).json({ message: "Failed to fetch near-expiry medicines" });
    }
};

// Get out-of-stock medicines with location data
exports.getOutOfStockMedicines = async (req, res) => {
    try {
        const meds = await Medicine.findAll({
            where: { quantity: 0 },
            include: [{ model: Location, attributes: ['name'] }]
        });
        res.status(200).json(meds);
    } catch (error) {
        console.error("Error fetching out-of-stock medicines:", error);
        res.status(500).json({ message: "Failed to fetch out-of-stock medicines" });
    }
};

// Upload or update medicine image using Cloudinary
exports.updateMedicineImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const medicine = await Medicine.findByPk(req.params.id);
        if (!medicine) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ message: 'Medicine not found' });
        }

        // Delete old Cloudinary asset
        if (medicine.imagePublicId) {
            await cloudinary.uploader.destroy(medicine.imagePublicId);
        }

        // Upload new image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'medicines',
            //width: 150,
            //height: 150,
            //crop: 'fill',
            resource_type: 'auto'
        });
        await fs.unlink(req.file.path);

        // Update database record
        await medicine.update({
            image: result.secure_url,
            imagePublicId: result.public_id
        });

        res.json({ message: 'Medicine image updated successfully', imageUrl: result.secure_url });
    } catch (error) {
        console.error('Error updating medicine image:', error);
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        res.status(500).json({ message: 'Error updating medicine image', details: error.message });
    }
};

// Delete medicine image using Cloudinary
exports.deleteMedicineImage = async (req, res) => {
    try {
        const medicine = await Medicine.findByPk(req.params.id);
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

        // Delete Cloudinary asset if exists
        if (medicine.imagePublicId) {
            await cloudinary.uploader.destroy(medicine.imagePublicId);
        }

        // Clear database fields
        await medicine.update({ image: null, imagePublicId: null });

        res.json({ message: 'Medicine image deleted successfully' });
    } catch (error) {
        console.error('Error deleting medicine image:', error);
        res.status(500).json({ message: 'Error deleting medicine image', details: error.message });
    }
};