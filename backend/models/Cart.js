const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Customers',
      key: 'id'
    },
    comment: 'One cart per customer - unique constraint enforced'
  }
}, {
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_carts_customer_unique',
      fields: ['customer_id'],
      unique: true
    }
  ]
});

// Define associations
Cart.associate = (models) => {
  // Cart belongs to Customer
  Cart.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  // Cart has many CartItems
  Cart.hasMany(models.CartItem, {
    foreignKey: 'cart_id',
    as: 'items'
  });
};

module.exports = Cart; 