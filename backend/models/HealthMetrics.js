const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class HealthMetrics extends Model {}

HealthMetrics.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE'),
    allowNull: false
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  blood_pressure_systolic: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 300
    }
  },
  blood_pressure_diastolic: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 200
    }
  },
  blood_pressure: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  bmr: {
    type: DataTypes.INTEGER,
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
  timestamps: true,
  underscored: true
});

module.exports = HealthMetrics; 