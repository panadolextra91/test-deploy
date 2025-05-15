// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize       = require('../config/database');
const Supplier        = require('./Supplier');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'products',
  underscored: true,
  timestamps: true
});

// Associations
Product.belongsTo(Supplier,  { foreignKey: 'supplier_id' });
Supplier.hasMany(Product,    { foreignKey: 'supplier_id' });

module.exports = Product;
