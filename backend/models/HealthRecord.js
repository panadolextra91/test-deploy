const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class HealthRecord extends Model {}

HealthRecord.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  record_type: {
    type: DataTypes.ENUM('LAB_RESULT', 'PRESCRIPTION', 'DOCTOR_NOTE'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_recorded: {
    type: DataTypes.DATE,
    allowNull: false
  },
  provider_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'HealthRecord',
  tableName: 'health_records',
  underscored: true,
  timestamps: true
});

module.exports = HealthRecord; 