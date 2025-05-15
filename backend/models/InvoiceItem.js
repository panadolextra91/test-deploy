const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
//InvoiceItem.js
const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    medicine_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Now nullable for purchase invoices
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Only used for purchase invoices
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    tableName: 'invoice_items',
    timestamps: false,
});

module.exports = InvoiceItem;
