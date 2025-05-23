const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PharmaSalesRep = sequelize.define('PharmaSalesRep', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Supplier',
            key: 'id'
        }
    }
}, {
    tableName: 'pharma_sales_reps',
    timestamps: false,
    underscored: true
});

module.exports = PharmaSalesRep; 