const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Pharmacy model
const Pharmacy = sequelize.define('Pharmacy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'pharmacies',
  timestamps: false
});

module.exports = Pharmacy;
