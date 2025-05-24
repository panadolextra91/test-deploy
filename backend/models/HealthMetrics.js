const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class HealthMetrics extends Model {}

HealthMetrics.init({
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
  blood_pressure_systolic: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  blood_pressure_diastolic: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  bmr: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true
  },
  blood_type: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'HealthMetrics',
  tableName: 'health_metrics',
  underscored: true,
  timestamps: true
});

module.exports = HealthMetrics; 