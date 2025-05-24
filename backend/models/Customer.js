// models/Customer.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Customer extends Model {}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: 'uniq_phone',    // named unique constraint
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    timestamps: false,
    indexes: [
      {
        name: 'uniq_phone',
        unique: true,
        fields: ['phone'],
      },
    ],
  }
);

module.exports = Customer;
