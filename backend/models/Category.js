const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
//Category.js
const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'categories',
    timestamps: false, // Disable timestamps
});

module.exports = Category;
