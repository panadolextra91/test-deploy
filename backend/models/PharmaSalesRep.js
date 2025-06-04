const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

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
    password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for existing records
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
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_token_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'pharma_sales_reps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['email'],
            name: 'pharma_sales_reps_email_unique'
        }
    ],
    hooks: {
        beforeCreate: async (salesRep) => {
            if (salesRep.password) {
                const salt = await bcrypt.genSalt(10);
                salesRep.password = await bcrypt.hash(salesRep.password, salt);
            }
        },
        beforeUpdate: async (salesRep) => {
            if (salesRep.changed('password') && salesRep.password) {
                const salt = await bcrypt.genSalt(10);
                salesRep.password = await bcrypt.hash(salesRep.password, salt);
            }
        }
    }
});

module.exports = PharmaSalesRep; 