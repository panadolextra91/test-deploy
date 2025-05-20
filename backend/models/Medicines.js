const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Location = require('./Location');

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
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    imagePublicId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    imageUrl: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.image;
        }
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'medicines',
    timestamps: false,
});

// Define the associations
Medicine.belongsTo(Location, { foreignKey: 'location_id' });

module.exports = Medicine;
