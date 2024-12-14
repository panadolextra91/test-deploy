// models/Medicines.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Location = require('./Location'); // Import Location model

const Medicine = sequelize.define('Medicine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'medicines',
    timestamps: false,
});

// Define the association
Medicine.belongsTo(Location, { foreignKey: 'location_id' });

module.exports = Medicine;
