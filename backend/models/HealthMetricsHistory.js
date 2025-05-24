const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class HealthMetricsHistory extends Model {}

HealthMetricsHistory.init({
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
  metric_type: {
    type: DataTypes.ENUM('BLOOD_PRESSURE', 'WEIGHT', 'HEIGHT', 'BMI', 'BMR'),
    allowNull: false
  },
  value_numeric: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true
  },
  value_text: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'HealthMetricsHistory',
  tableName: 'health_metrics_histories',
  underscored: true,
  timestamps: true
});

module.exports = HealthMetricsHistory; 