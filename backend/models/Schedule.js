const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  medicine_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Name of the medicine as entered by the user'
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Dosage instructions (e.g., "1 pill", "10ml")'
  },
  scheduled_time: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Time of day for the reminder (HH:MM:SS)'
  },
  days_of_week: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of day numbers [0-6] where 0=Sunday, 6=Saturday'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date from which the schedule is active'
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date on which the schedule ends (optional)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this schedule is currently active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes from the user'
  }
}, {
  tableName: 'schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_schedules_customer_active',
      fields: ['customer_id', 'is_active']
    },
    {
      name: 'idx_schedules_time',
      fields: ['scheduled_time']
    }
  ]
});

// Define associations
Schedule.associate = (models) => {
  // Schedule belongs to Customer
  Schedule.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  // Schedule has many ScheduleNotifications
  Schedule.hasMany(models.ScheduleNotification, {
    foreignKey: 'schedule_id',
    as: 'notifications'
  });

  // Schedule has many ScheduleLogs
  Schedule.hasMany(models.ScheduleLog, {
    foreignKey: 'schedule_id',
    as: 'logs'
  });
};

module.exports = Schedule; 