const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduleLog = sequelize.define('ScheduleLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  schedule_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // NULL if schedule is deleted but we keep the log
    references: {
      model: 'schedules',
      key: 'id'
    },
    comment: 'NULL if schedule is deleted but we keep the log'
  },
  schedule_notification_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Links to specific notification if applicable
    references: {
      model: 'schedule_notifications',
      key: 'id'
    },
    comment: 'Links to specific notification if applicable'
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
    comment: 'Denormalized medicine name for historical accuracy'
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Denormalized dosage for historical accuracy'
  },
  action_type: {
    type: DataTypes.ENUM('taken', 'skipped', 'snoozed', 'missed'),
    allowNull: false,
    comment: 'Type of action performed by user or system'
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the medication was supposed to be taken'
  },
  action_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the action was recorded'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes from the user'
  }
}, {
  tableName: 'schedule_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Only has created_at, no updated_at
  indexes: [
    {
      name: 'idx_schedule_logs_customer_action_time',
      fields: ['customer_id', 'action_time']
    },
    {
      name: 'idx_schedule_logs_schedule_time',
      fields: ['schedule_id', 'scheduled_time']
    },
    {
      name: 'idx_schedule_logs_adherence_tracking',
      fields: ['customer_id', 'action_type', 'scheduled_time']
    }
  ]
});

// Define associations
ScheduleLog.associate = (models) => {
  // ScheduleLog belongs to Schedule (nullable)
  ScheduleLog.belongsTo(models.Schedule, {
    foreignKey: 'schedule_id',
    as: 'schedule'
  });

  // ScheduleLog belongs to ScheduleNotification (nullable)
  ScheduleLog.belongsTo(models.ScheduleNotification, {
    foreignKey: 'schedule_notification_id',
    as: 'notification'
  });

  // ScheduleLog belongs to Customer
  ScheduleLog.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });
};

module.exports = ScheduleLog; 