const { Schedule, ScheduleNotification, ScheduleLog, Customer } = require('../models');
const { Op } = require('sequelize');

// Get all schedules for a customer
exports.getSchedules = async (req, res) => {
  try {
    const customerId = req.user.id;

    const schedules = await Schedule.findAll({
      where: { customer_id: customerId },
      include: [{
        model: ScheduleNotification,
        as: 'notifications',
        where: { status: { [Op.in]: ['pending', 'sent'] } },
        required: false,
        limit: 5,
        order: [['notification_datetime', 'ASC']]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      schedules: schedules,
      total: schedules.length
    });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

// Get a specific schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const schedule = await Schedule.findOne({
      where: { id: id, customer_id: customerId },
      include: [{
        model: ScheduleNotification,
        as: 'notifications',
        order: [['notification_datetime', 'ASC']]
      }, {
        model: ScheduleLog,
        as: 'logs',
        order: [['action_time', 'DESC']],
        limit: 10
      }]
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
};

// Create a new medication schedule
exports.createSchedule = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      medicine_name,
      dosage,
      scheduled_time,
      days_of_week,
      start_date,
      end_date,
      notes
    } = req.body;

    // Validation
    if (!medicine_name || !dosage || !scheduled_time || !days_of_week || !start_date) {
      return res.status(400).json({ 
        error: 'Medicine name, dosage, scheduled time, days of week, and start date are required' 
      });
    }

    if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
      return res.status(400).json({ 
        error: 'Days of week must be a non-empty array of numbers (0-6)' 
      });
    }

    // Validate days_of_week values
    const validDays = days_of_week.every(day => 
      Number.isInteger(day) && day >= 0 && day <= 6
    );
    if (!validDays) {
      return res.status(400).json({ 
        error: 'Days of week must contain only integers from 0 (Sunday) to 6 (Saturday)' 
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : null;
    
    if (endDate && endDate <= startDate) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    // Create schedule
    const schedule = await Schedule.create({
      customer_id: customerId,
      medicine_name,
      dosage,
      scheduled_time,
      days_of_week,
      start_date,
      end_date,
      notes,
      is_active: true
    });

    // Generate initial notifications for the next 30 days
    await generateNotifications(schedule);

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Update an existing schedule
exports.updateSchedule = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    const {
      medicine_name,
      dosage,
      scheduled_time,
      days_of_week,
      start_date,
      end_date,
      notes,
      is_active
    } = req.body;

    const schedule = await Schedule.findOne({
      where: { id: id, customer_id: customerId }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Validate days_of_week if provided
    if (days_of_week) {
      if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
        return res.status(400).json({ 
          error: 'Days of week must be a non-empty array of numbers (0-6)' 
        });
      }

      const validDays = days_of_week.every(day => 
        Number.isInteger(day) && day >= 0 && day <= 6
      );
      if (!validDays) {
        return res.status(400).json({ 
          error: 'Days of week must contain only integers from 0 (Sunday) to 6 (Saturday)' 
        });
      }
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({ 
          error: 'End date must be after start date' 
        });
      }
    }

    // Update schedule
    await schedule.update({
      medicine_name: medicine_name || schedule.medicine_name,
      dosage: dosage || schedule.dosage,
      scheduled_time: scheduled_time || schedule.scheduled_time,
      days_of_week: days_of_week || schedule.days_of_week,
      start_date: start_date || schedule.start_date,
      end_date: end_date !== undefined ? end_date : schedule.end_date,
      notes: notes !== undefined ? notes : schedule.notes,
      is_active: is_active !== undefined ? is_active : schedule.is_active
    });

    // If schedule was updated significantly, regenerate notifications
    if (scheduled_time || days_of_week || start_date || end_date !== undefined) {
      // Delete future pending notifications
      await ScheduleNotification.destroy({
        where: {
          schedule_id: schedule.id,
          status: 'pending',
          notification_datetime: { [Op.gt]: new Date() }
        }
      });

      // Generate new notifications if schedule is active
      if (schedule.is_active) {
        await generateNotifications(schedule);
      }
    }

    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const schedule = await Schedule.findOne({
      where: { id: id, customer_id: customerId }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Delete pending notifications
    await ScheduleNotification.destroy({
      where: {
        schedule_id: schedule.id,
        status: 'pending'
      }
    });

    // Delete the schedule (logs will remain with schedule_id set to NULL)
    await schedule.destroy();

    res.json({
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// Toggle schedule active status
exports.toggleScheduleStatus = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const schedule = await Schedule.findOne({
      where: { id: id, customer_id: customerId }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const newStatus = !schedule.is_active;
    await schedule.update({ is_active: newStatus });

    if (newStatus) {
      // Generate notifications if activating
      await generateNotifications(schedule);
    } else {
      // Delete pending notifications if deactivating
      await ScheduleNotification.destroy({
        where: {
          schedule_id: schedule.id,
          status: 'pending',
          notification_datetime: { [Op.gt]: new Date() }
        }
      });
    }

    res.json({
      message: `Schedule ${newStatus ? 'activated' : 'deactivated'} successfully`,
      schedule
    });
  } catch (error) {
    console.error('Error toggling schedule status:', error);
    res.status(500).json({ error: 'Failed to toggle schedule status' });
  }
};

// Log medication action (taken, skipped, snoozed, missed)
exports.logMedicationAction = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      schedule_id,
      schedule_notification_id,
      action_type,
      scheduled_time,
      notes
    } = req.body;

    if (!action_type || !scheduled_time) {
      return res.status(400).json({ 
        error: 'Action type and scheduled time are required' 
      });
    }

    if (!['taken', 'skipped', 'snoozed', 'missed'].includes(action_type)) {
      return res.status(400).json({ 
        error: 'Action type must be one of: taken, skipped, snoozed, missed' 
      });
    }

    // Get schedule details for denormalized fields
    let schedule = null;
    if (schedule_id) {
      schedule = await Schedule.findOne({
        where: { id: schedule_id, customer_id: customerId }
      });
    }

    // If no schedule found but we have notification_id, get it from notification
    if (!schedule && schedule_notification_id) {
      const notification = await ScheduleNotification.findOne({
        where: { id: schedule_notification_id, customer_id: customerId },
        include: [{ model: Schedule, as: 'schedule' }]
      });
      if (notification && notification.schedule) {
        schedule = notification.schedule;
      }
    }

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Create log entry
    const log = await ScheduleLog.create({
      schedule_id: schedule.id,
      schedule_notification_id: schedule_notification_id || null,
      customer_id: customerId,
      medicine_name: schedule.medicine_name,
      dosage: schedule.dosage,
      action_type,
      scheduled_time,
      notes
    });

    // Update notification status if provided
    if (schedule_notification_id) {
      await ScheduleNotification.update(
        { 
          status: 'acknowledged',
          acknowledged_at: new Date()
        },
        { where: { id: schedule_notification_id } }
      );
    }

    res.status(201).json({
      message: 'Medication action logged successfully',
      log
    });
  } catch (error) {
    console.error('Error logging medication action:', error);
    res.status(500).json({ error: 'Failed to log medication action' });
  }
};

// Get medication logs for a customer
exports.getMedicationLogs = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { 
      schedule_id, 
      action_type, 
      start_date, 
      end_date, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const whereClause = { customer_id: customerId };

    if (schedule_id) {
      whereClause.schedule_id = schedule_id;
    }

    if (action_type) {
      whereClause.action_type = action_type;
    }

    if (start_date || end_date) {
      whereClause.scheduled_time = {};
      if (start_date) {
        whereClause.scheduled_time[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.scheduled_time[Op.lte] = new Date(end_date);
      }
    }

    const logs = await ScheduleLog.findAndCountAll({
      where: whereClause,
      order: [['scheduled_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting medication logs:', error);
    res.status(500).json({ error: 'Failed to get medication logs' });
  }
};

// Get adherence statistics
exports.getAdherenceStats = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { schedule_id, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      customer_id: customerId,
      scheduled_time: { [Op.gte]: startDate }
    };

    if (schedule_id) {
      whereClause.schedule_id = schedule_id;
    }

    // Get all logs for the period
    const logs = await ScheduleLog.findAll({
      where: whereClause,
      attributes: ['action_type', 'scheduled_time', 'medicine_name']
    });

    // Calculate statistics
    const totalLogs = logs.length;
    const takenCount = logs.filter(log => log.action_type === 'taken').length;
    const skippedCount = logs.filter(log => log.action_type === 'skipped').length;
    const missedCount = logs.filter(log => log.action_type === 'missed').length;
    const snoozedCount = logs.filter(log => log.action_type === 'snoozed').length;

    const adherenceRate = totalLogs > 0 ? ((takenCount / totalLogs) * 100).toFixed(2) : 0;

    res.json({
      period_days: parseInt(days),
      total_scheduled: totalLogs,
      taken: takenCount,
      skipped: skippedCount,
      missed: missedCount,
      snoozed: snoozedCount,
      adherence_rate: parseFloat(adherenceRate)
    });
  } catch (error) {
    console.error('Error getting adherence stats:', error);
    res.status(500).json({ error: 'Failed to get adherence statistics' });
  }
};

// Get pending notifications for a customer
exports.getPendingNotifications = async (req, res) => {
  try {
    const customerId = req.user.id;

    const notifications = await ScheduleNotification.findAll({
      where: { 
        customer_id: customerId,
        status: 'pending',
        notification_datetime: { [Op.gte]: new Date() } // Only future notifications
      },
      order: [['notification_datetime', 'ASC']],
      limit: 50 // Limit to prevent too many results
    });

    res.json({
      notifications: notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    res.status(500).json({ error: 'Failed to get pending notifications' });
  }
};

// Helper function to generate notifications for a schedule
async function generateNotifications(schedule) {
  try {
    console.log('🔄 Generating notifications for schedule:', schedule.id);
    console.log('📅 Schedule details:', {
      medicine_name: schedule.medicine_name,
      scheduled_time: schedule.scheduled_time,
      days_of_week: schedule.days_of_week,
      start_date: schedule.start_date,
      end_date: schedule.end_date
    });
    
    const notifications = [];
    const startDate = new Date(schedule.start_date);
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null;
    const currentDate = new Date();
    
    console.log('🕐 Current Vietnam time:', currentDate.toLocaleString());
    
    // Generate notifications for next 30 days or until end_date
    const generateUntil = new Date();
    generateUntil.setDate(generateUntil.getDate() + 30);
    
    const finalDate = endDate && endDate < generateUntil ? endDate : generateUntil;
    console.log('📆 Will generate until:', finalDate.toDateString());

    // Start from today or start_date, whichever is later
    const iterDate = new Date(Math.max(currentDate.getTime(), startDate.getTime()));
    console.log('🚀 Starting iteration from:', iterDate.toDateString());

    while (iterDate <= finalDate) {
      const dayOfWeek = iterDate.getDay();
      console.log(`📅 Checking ${iterDate.toDateString()} (day ${dayOfWeek})`);
      
      if (schedule.days_of_week.includes(dayOfWeek)) {
        console.log(`✅ Day ${dayOfWeek} is included in schedule`);
        
        // Create notification datetime by combining date and time
        // Format: YYYY-MM-DD HH:MM:SS (Vietnam time, no timezone conversion)
        const year = iterDate.getFullYear();
        const month = String(iterDate.getMonth() + 1).padStart(2, '0');
        const day = String(iterDate.getDate()).padStart(2, '0');
        
        // Use the scheduled_time directly without any conversion
        const timeString = schedule.scheduled_time; // Already in HH:MM:SS format
        
        // Create the datetime string in Vietnam time
        const notificationDateTimeString = `${year}-${month}-${day} ${timeString}`;
        
        // Only create notifications for future times (at least 1 minute ahead)
        const currentVietnamTime = new Date();
        const notificationVietnamTime = new Date(notificationDateTimeString);
        
        // Debug the actual Date objects
        console.log(`🕐 Notification time: ${notificationDateTimeString}`);
        console.log(`🕐 Notification Date object: ${notificationVietnamTime.toString()}`);
        console.log(`🕐 Current time: ${currentVietnamTime.toLocaleString()}`);
        console.log(`🕐 Current Date object: ${currentVietnamTime.toString()}`);
        
        const timeDiff = notificationVietnamTime.getTime() - currentVietnamTime.getTime();
        const oneMinute = 60 * 1000; // 1 minute in milliseconds
        
        console.log(`⏰ Time difference: ${Math.round(timeDiff / 1000)} seconds`);
        console.log(`⏰ Notification timestamp: ${notificationVietnamTime.getTime()}`);
        console.log(`⏰ Current timestamp: ${currentVietnamTime.getTime()}`);
        
        if (timeDiff > oneMinute) {
          console.log('✅ Adding notification (future time)');
          notifications.push({
            schedule_id: schedule.id,
            customer_id: schedule.customer_id,
            notification_datetime: notificationDateTimeString,
            status: 'pending',
            notification_type: 'both'
          });
        } else {
          console.log('❌ Skipping notification (past or too close)');
        }
      } else {
        console.log(`❌ Day ${dayOfWeek} not in schedule days`);
      }
      
      iterDate.setDate(iterDate.getDate() + 1);
    }

    console.log(`📊 Generated ${notifications.length} notifications`);

    if (notifications.length > 0) {
      await ScheduleNotification.bulkCreate(notifications);
      console.log('✅ Notifications saved to database');
    }

    return notifications.length;
  } catch (error) {
    console.error('❌ Error generating notifications:', error);
    throw error;
  }
}

// Export the helper function for use in other modules
exports.generateNotifications = generateNotifications; 