// models/Customer.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Customer extends Model {}

Customer.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    { sequelize, modelName: 'Customer', timestamps: false }
);

module.exports = Customer;
