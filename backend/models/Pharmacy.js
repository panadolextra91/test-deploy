const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Pharmacy model
const Pharmacy = sequelize.define('Pharmacy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contact_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
}, {
  tableName: 'pharmacies',
  timestamps: true,
  underscored: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: false
});

module.exports = Pharmacy;
