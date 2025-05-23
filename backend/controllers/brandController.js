const { Brand, Medicine } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary using the CLOUDINARY_URL from environment variables
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        secure: true
    });
} else {
    console.error('CLOUDINARY_URL is not set in environment variables');
}

// Get all brands
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.findAll({
            order: [['name', 'ASC']],
            include: [
                {
                    model: Medicine,
                    as: 'medicines',
                    attributes: ['id'],
                    required: false
                }
            ]
        });

        // Add medicine count to each brand
        const brandsWithCount = brands.map(brand => ({
            ...brand.toJSON(),
            medicineCount: brand.medicines ? brand.medicines.length : 0,
            logoUrl: brand.logo || null
        }));

        res.status(200).json(brandsWithCount);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to retrieve brands' });
    }
};

// Get brand by ID
exports.getBrandById = async (req, res) => {
    const { id } = req.params;
    try {
        const brand = await Brand.findByPk(id, {
            include: [
                {
                    model: Medicine,
                    as: 'medicines',
                    attributes: ['id', 'name', 'price', 'quantity']
                }
            ]
        });

        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        res.status(200).json({
            ...brand.toJSON(),
            logoUrl: brand.logo || null
        });
    } catch (error) {
        console.error('Error fetching brand:', error);
        res.status(500).json({ error: 'Failed to retrieve brand' });
    }
};

// Create new brand with optional logo upload
exports.createBrand = async (req, res) => {
    const { name, manufacturer, country, description } = req.body;
    
    try {
        console.log('📝 Creating brand - Request body:', req.body);
        console.log('📎 Logo file received:', req.file ? 'Yes' : 'No');
        if (req.file) {
            console.log('📎 Logo file details:', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });
        }

        // Check if brand already exists (MySQL collation is case-insensitive)
        const existingBrand = await Brand.findOne({
            where: { name: name }
        });

        if (existingBrand) {
            // Clean up uploaded file if exists
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(400).json({ error: 'Brand already exists' });
        }

        // Handle Cloudinary upload for logo
        let logoUrl = null;
        let imagePublicId = null;
        if (req.file) {
            console.log('☁️ Uploading logo to Cloudinary...');
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'brands',
                resource_type: 'auto'
            });
            logoUrl = result.secure_url;
            imagePublicId = result.public_id;
            console.log('✅ Cloudinary upload successful:', logoUrl);
            await fs.unlink(req.file.path);
        } else {
            console.log('⚠️ No logo file to upload');
        }

        const brand = await Brand.create({
            name,
            manufacturer,
            country,
            logo: logoUrl,
            imagePublicId,
            description
        });

        res.status(201).json({
            ...brand.toJSON(),
            logoUrl: brand.logo || null
        });
    } catch (error) {
        console.error('Error creating brand:', error);
        // Clean up uploaded file if exists
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ error: 'Failed to create brand', details: error.message });
    }
};

// Update brand with optional logo upload
exports.updateBrand = async (req, res) => {
    const { id } = req.params;
    const { name, manufacturer, country, description } = req.body;

    try {
        console.log('📝 Updating brand - Request body:', req.body);
        console.log('📎 New logo file received:', req.file ? 'Yes' : 'No');

        const brand = await Brand.findByPk(id);
        
        if (!brand) {
            // Clean up uploaded file if exists
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Check if new name conflicts with existing brand (MySQL collation is case-insensitive)
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({
                where: { 
                    name: name,
                    id: { [Op.ne]: id }
                }
            });

            if (existingBrand) {
                // Clean up uploaded file if exists
                if (req.file) {
                    await fs.unlink(req.file.path).catch(() => {});
                }
                return res.status(400).json({ error: 'Brand name already exists' });
            }
        }

        // Handle logo replacement if new file is provided
        if (req.file) {
            console.log('☁️ Replacing logo in Cloudinary...');
            // Delete old logo if exists
            if (brand.imagePublicId) {
                await cloudinary.uploader.destroy(brand.imagePublicId);
            }
            // Upload new logo
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'brands',
                resource_type: 'auto'
            });
            brand.logo = result.secure_url;
            brand.imagePublicId = result.public_id;
            console.log('✅ Logo replacement successful:', brand.logo);
            await fs.unlink(req.file.path);
        }

        await brand.update({
            name: name || brand.name,
            manufacturer: manufacturer !== undefined ? manufacturer : brand.manufacturer,
            country: country !== undefined ? country : brand.country,
            description: description !== undefined ? description : brand.description,
            logo: brand.logo,
            imagePublicId: brand.imagePublicId
        });

        res.status(200).json({
            ...brand.toJSON(),
            logoUrl: brand.logo || null
        });
    } catch (error) {
        console.error('Error updating brand:', error);
        // Clean up uploaded file if exists
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ error: 'Failed to update brand', details: error.message });
    }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
    const { id } = req.params;

    try {
        const brand = await Brand.findByPk(id, {
            include: [
                {
                    model: Medicine,
                    as: 'medicines',
                    attributes: ['id']
                }
            ]
        });
        
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Check if brand has medicines
        if (brand.medicines && brand.medicines.length > 0) {
            return res.status(400).json({ 
                error: `Cannot delete brand. It has ${brand.medicines.length} associated medicines. Please reassign or remove medicines first.` 
            });
        }

        // Delete logo from Cloudinary if exists
        if (brand.imagePublicId) {
            await cloudinary.uploader.destroy(brand.imagePublicId);
        }

        await brand.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ error: 'Failed to delete brand' });
    }
};

// Update brand logo only
exports.updateBrandLogo = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No logo file provided' });
        }

        const brand = await Brand.findByPk(id);
        if (!brand) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Delete old logo if exists
        if (brand.imagePublicId) {
            await cloudinary.uploader.destroy(brand.imagePublicId);
        }

        // Upload new logo
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'brands',
            resource_type: 'auto'
        });

        await brand.update({
            logo: result.secure_url,
            imagePublicId: result.public_id
        });

        await fs.unlink(req.file.path);

        res.status(200).json({
            message: 'Brand logo updated successfully',
            logoUrl: result.secure_url
        });
    } catch (error) {
        console.error('Error updating brand logo:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ error: 'Failed to update brand logo', details: error.message });
    }
};

// Delete brand logo
exports.deleteBrandLogo = async (req, res) => {
    const { id } = req.params;

    try {
        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Delete logo from Cloudinary if exists
        if (brand.imagePublicId) {
            await cloudinary.uploader.destroy(brand.imagePublicId);
        }

        // Clear logo fields
        await brand.update({
            logo: null,
            imagePublicId: null
        });

        res.status(200).json({ message: 'Brand logo deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand logo:', error);
        res.status(500).json({ error: 'Failed to delete brand logo' });
    }
}; 