'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    recipient_type: {
        type: DataTypes.ENUM('user', 'customer'),
        allowNull: false
    },
    recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('order_placed', 'order_status_changed', 'order_cancelled', 'order_approved', 'order_denied', 'new_products_imported'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Notification;
