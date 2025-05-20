const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
//Supplier.js
const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contact_info: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'suppliers',
    timestamps: false, // Disable timestamps
});

module.exports = Supplier;
