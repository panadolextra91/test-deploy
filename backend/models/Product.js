// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize       = require('../config/database');
const Supplier        = require('./Supplier');
const PharmaSalesRep  = require('./PharmaSalesRep');

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
  },
  pharma_sales_rep_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pharma_sales_reps',
      key: 'id'
    }
  }
}, {
  tableName: 'products',
  underscored: true,
  timestamps: true
});

// Associations
Product.belongsTo(Supplier,  { foreignKey: 'supplier_id' });
Supplier.hasMany(Product,    { foreignKey: 'supplier_id' });
Product.belongsTo(PharmaSalesRep, { foreignKey: 'pharma_sales_rep_id' });
PharmaSalesRep.hasMany(Product, { foreignKey: 'pharma_sales_rep_id' });

module.exports = Product;
