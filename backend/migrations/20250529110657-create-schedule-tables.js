'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create schedules table
    await queryInterface.createTable('schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      medicine_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the medicine as entered by the user'
      },
      dosage: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Dosage instructions (e.g., "1 pill", "10ml")'
      },
      scheduled_time: {
        type: Sequelize.TIME,
        allowNull: false,
        comment: 'Time of day for the reminder (HH:MM:SS)'
      },
      days_of_week: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of day numbers [0-6] where 0=Sunday, 6=Saturday'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date from which the schedule is active'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date on which the schedule ends (optional)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this schedule is currently active'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes from the user'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create schedule_notifications table
    await queryInterface.createTable('schedule_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schedules',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      notification_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Exact date and time when notification should be sent'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'acknowledged', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Current status of the notification'
      },
      notification_type: {
        type: Sequelize.ENUM('push', 'in_app', 'both'),
        allowNull: false,
        defaultValue: 'both',
        comment: 'Type of notification to send'
      },
      push_notification_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'External push service notification ID for tracking'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when notification was actually sent'
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when user acknowledged the notification'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if notification failed'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create schedule_logs table
    await queryInterface.createTable('schedule_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'schedules',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'NULL if schedule is deleted but we keep the log'
      },
      schedule_notification_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'schedule_notifications',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Links to specific notification if applicable'
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      medicine_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Denormalized medicine name for historical accuracy'
      },
      dosage: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Denormalized dosage for historical accuracy'
      },
      action_type: {
        type: Sequelize.ENUM('taken', 'skipped', 'snoozed', 'missed'),
        allowNull: false,
        comment: 'Type of action performed by user or system'
      },
      scheduled_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When the medication was supposed to be taken'
      },
      action_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the action was recorded'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes from the user'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for schedules table
    await queryInterface.addIndex('schedules', ['customer_id', 'is_active'], {
      name: 'idx_schedules_customer_active'
    });
    await queryInterface.addIndex('schedules', ['scheduled_time'], {
      name: 'idx_schedules_time'
    });

    // Add indexes for schedule_notifications table
    await queryInterface.addIndex('schedule_notifications', ['notification_datetime'], {
      name: 'idx_schedule_notifications_datetime'
    });
    await queryInterface.addIndex('schedule_notifications', ['customer_id', 'status'], {
      name: 'idx_schedule_notifications_customer_status'
    });
    await queryInterface.addIndex('schedule_notifications', ['schedule_id', 'notification_datetime'], {
      name: 'idx_schedule_notifications_schedule_datetime'
    });

    // Add indexes for schedule_logs table
    await queryInterface.addIndex('schedule_logs', ['customer_id', 'action_time'], {
      name: 'idx_schedule_logs_customer_action_time'
    });
    await queryInterface.addIndex('schedule_logs', ['schedule_id', 'scheduled_time'], {
      name: 'idx_schedule_logs_schedule_time'
    });
    await queryInterface.addIndex('schedule_logs', ['customer_id', 'action_type', 'scheduled_time'], {
      name: 'idx_schedule_logs_adherence_tracking'
    });

    console.log('✓ Created schedules, schedule_notifications, and schedule_logs tables with indexes');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('schedule_logs');
    await queryInterface.dropTable('schedule_notifications');
    await queryInterface.dropTable('schedules');
    
    console.log('✓ Dropped schedules, schedule_notifications, and schedule_logs tables');
  }
};
