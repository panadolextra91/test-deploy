const { Notification, User, Customer } = require('../models');
const { Op } = require('sequelize');

// Get all notifications for a recipient (user or customer)
exports.getRecipientNotifications = async (req, res) => {
    const { recipient_type, recipient_id } = req.params;
    const { include_resolved = 'false' } = req.query; // Query parameter to include resolved notifications
    console.log('Fetching notifications for:', { recipient_type, recipient_id, include_resolved });
    
    try {
        // Build include array based on recipient_type
        const includeArray = [];
        
        if (recipient_type === 'user') {
            includeArray.push({
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'name'],
                required: false
            });
        } else if (recipient_type === 'customer') {
            includeArray.push({
                model: Customer,
                as: 'customer', 
                attributes: ['id', 'name', 'email'],
                required: false
            });
        }

        // Build where clause
        const whereClause = { 
            recipient_type,
            recipient_id: parseInt(recipient_id)
        };

        // Filter out resolved notifications unless explicitly requested
        if (include_resolved === 'false') {
            whereClause.is_resolved = false;
        }
        
        const notifications = await Notification.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: includeArray
        });
        
        console.log('Found notifications:', notifications.length);
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            sql: error.sql,
            sqlMessage: error.original?.sqlMessage
        });
        res.status(500).json({ 
            error: 'Failed to retrieve notifications',
            details: error.message
        });
    }
};

// Get unread notifications count for a recipient
exports.getUnreadCount = async (req, res) => {
    const { recipient_type, recipient_id } = req.params;
    try {
        const count = await Notification.count({
            where: {
                recipient_type,
                recipient_id: parseInt(recipient_id),
                is_read: false,
                is_resolved: false // Only count unresolved notifications
            }
        });
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to retrieve unread count' });
    }
};

// Get resolved notifications (history) for a recipient
exports.getResolvedNotifications = async (req, res) => {
    const { recipient_type, recipient_id } = req.params;
    console.log('Fetching resolved notifications for:', { recipient_type, recipient_id });
    
    try {
        // Build include array based on recipient_type
        const includeArray = [];
        
        if (recipient_type === 'user') {
            includeArray.push({
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'name'],
                required: false
            });
        } else if (recipient_type === 'customer') {
            includeArray.push({
                model: Customer,
                as: 'customer', 
                attributes: ['id', 'name', 'email'],
                required: false
            });
        }
        
        const notifications = await Notification.findAll({
            where: { 
                recipient_type,
                recipient_id: parseInt(recipient_id),
                is_resolved: true
            },
            order: [['resolved_at', 'DESC']],
            include: includeArray
        });
        
        console.log('Found resolved notifications:', notifications.length);
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            sql: error.sql,
            sqlMessage: error.original?.sqlMessage
        });
        res.status(500).json({ 
            error: 'Failed to retrieve resolved notifications',
            details: error.message
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        await notification.update({ is_read: true });
        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read for a recipient
exports.markAllAsRead = async (req, res) => {
    const { recipient_type, recipient_id } = req.params;
    try {
        await Notification.update(
            { is_read: true },
            {
                where: {
                    recipient_type,
                    recipient_id: parseInt(recipient_id),
                    is_read: false
                }
            }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Create notification with validation
exports.createNotification = async (req, res) => {
    const { recipient_type, recipient_id, type, title, message, metadata } = req.body;
    try {
        // Validate recipient exists before creating notification
        if (recipient_type === 'user') {
            const user = await User.findByPk(recipient_id);
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
        } else if (recipient_type === 'customer') {
            const customer = await Customer.findByPk(recipient_id);
            if (!customer) {
                return res.status(400).json({ error: 'Customer not found' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid recipient_type' });
        }
        
        const notification = await Notification.create({
            recipient_type,
            recipient_id: parseInt(recipient_id),
            type,
            title,
            message,
            metadata,
            is_read: false
        });
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification', details: error.message });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        await notification.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Delete all notifications for a recipient
exports.deleteAllNotifications = async (req, res) => {
    const { recipient_type, recipient_id } = req.params;
    try {
        await Notification.destroy({
            where: { 
                recipient_type, 
                recipient_id: parseInt(recipient_id) 
            }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({ error: 'Failed to delete all notifications' });
    }
};
