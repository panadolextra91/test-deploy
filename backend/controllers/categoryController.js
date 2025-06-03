//categoryController.js
const Category = require('../models/Category');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: [
                'id',
                'name',
                'description',
                [
                    sequelize.literal('(SELECT COUNT(*) FROM medicines WHERE medicines.category_id = Category.id)'),
                    'medicineCount'
                ]
            ]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve category' });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const newCategory = await Category.create({
            name,
            description
        });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        category.name = name;
        category.description = description;

        await category.save();
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        await category.destroy();
        res.status(204).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
