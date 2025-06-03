const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduleNotification = sequelize.define('ScheduleNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  schedule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schedules',
      key: 'id'
    }
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  notification_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Exact date and time when notification should be sent'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'acknowledged', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Current status of the notification'
  },
  notification_type: {
    type: DataTypes.ENUM('push', 'in_app', 'both'),
    allowNull: false,
    defaultValue: 'both',
    comment: 'Type of notification to send'
  },
  push_notification_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'External push service notification ID for tracking'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when notification was actually sent'
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when user acknowledged the notification'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error details if notification failed'
  }
}, {
  tableName: 'schedule_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Only has created_at, no updated_at
  indexes: [
    {
      name: 'idx_schedule_notifications_datetime',
      fields: ['notification_datetime']
    },
    {
      name: 'idx_schedule_notifications_customer_status',
      fields: ['customer_id', 'status']
    },
    {
      name: 'idx_schedule_notifications_schedule_datetime',
      fields: ['schedule_id', 'notification_datetime']
    }
  ]
});

// Define associations
ScheduleNotification.associate = (models) => {
  // ScheduleNotification belongs to Schedule
  ScheduleNotification.belongsTo(models.Schedule, {
    foreignKey: 'schedule_id',
    as: 'schedule'
  });

  // ScheduleNotification belongs to Customer
  ScheduleNotification.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });

  // ScheduleNotification has many ScheduleLogs
  ScheduleNotification.hasMany(models.ScheduleLog, {
    foreignKey: 'schedule_notification_id',
    as: 'logs'
  });
};

module.exports = ScheduleNotification; 