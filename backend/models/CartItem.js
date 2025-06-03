const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  cart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    }
  },
  medicine_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medicines',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    },
    comment: 'Quantity of medicine in cart'
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price per unit when item was added to cart'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Calculated as quantity × unit_price'
  },
  is_selected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether item is selected for checkout'
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_cart_items_cart',
      fields: ['cart_id']
    },
    {
      name: 'idx_cart_items_medicine',
      fields: ['medicine_id']
    },
    {
      name: 'idx_cart_items_cart_medicine',
      fields: ['cart_id', 'medicine_id'],
      unique: true
    },
    {
      name: 'idx_cart_items_cart_selected',
      fields: ['cart_id', 'is_selected']
    }
  ],
  hooks: {
    // Auto-calculate total_price before saving
    beforeSave: (cartItem) => {
      if (cartItem.quantity && cartItem.unit_price) {
        cartItem.total_price = parseFloat(cartItem.quantity) * parseFloat(cartItem.unit_price);
      }
    },
    // Also calculate on create
    beforeCreate: (cartItem) => {
      if (cartItem.quantity && cartItem.unit_price) {
        cartItem.total_price = parseFloat(cartItem.quantity) * parseFloat(cartItem.unit_price);
      }
    }
  }
});

// Define associations
CartItem.associate = (models) => {
  // CartItem belongs to Cart
  CartItem.belongsTo(models.Cart, {
    foreignKey: 'cart_id',
    as: 'cart'
  });

  // CartItem belongs to Medicine
  CartItem.belongsTo(models.Medicine, {
    foreignKey: 'medicine_id',
    as: 'medicine'
  });
};

module.exports = CartItem; 