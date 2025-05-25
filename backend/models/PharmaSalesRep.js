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
            model: 'suppliers',
            key: 'id'
        }
    }
}, {
    tableName: 'pharma_sales_reps',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['email'],
            name: 'pharma_sales_reps_email_unique'
        }
    ]
});

module.exports = PharmaSalesRep; 