'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    pharmacy_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pharmacies',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'denied', 'completed'),
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [['pending', 'approved', 'denied', 'completed']],
                msg: 'Invalid status value'
            }
        }
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    shipping_address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Order;
