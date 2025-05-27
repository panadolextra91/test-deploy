const models = require('../models');
const { Order, OrderItem, Customer, Pharmacy, Medicine, Notification, User } = models;
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Search orders by ID or customer name
exports.searchOrders = async (req, res) => {
    const { query } = req.query;
    try {
        // Check if query is a number (potential order ID)
        const isNumeric = !isNaN(query) && !isNaN(parseFloat(query));
        
        let searchConditions = {};
        if (isNumeric) {
            // If query is numeric, search by order ID
            searchConditions = {
                [Op.or]: [
                    { id: query },
                    { '$customer.name$': { [Op.like]: `%${query}%` } }
                ]
            };
        } else {
            // Otherwise search by customer name
            searchConditions = {
                '$customer.name$': { [Op.like]: `%${query}%` }
            };
        }
        
        const orders = await Order.findAll({
            where: searchConditions,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    required: true
                },
                {
                    model: Pharmacy,
                    as: 'pharmacy'
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Medicine,
                            as: 'medicine'
                        }
                    ]
                }
            ]
        });
        
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).json({ error: 'Failed to search orders' });
    }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Pharmacy,
                    as: 'pharmacy'
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Medicine,
                            as: 'medicine'
                        }
                    ]
                }
            ]
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Pharmacy,
                    as: 'pharmacy'
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Medicine,
                            as: 'medicine'
                        }
                    ]
                }
            ]
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to retrieve order' });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    const { customer_id, pharmacy_id, items, shipping_address, note } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // Validate customer and pharmacy
        const [customer, pharmacy] = await Promise.all([
            Customer.findByPk(customer_id, { transaction }),
            Pharmacy.findByPk(pharmacy_id, { transaction })
        ]);

        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Customer not found' });
        }
        if (!pharmacy) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Pharmacy not found' });
        }

        // Validate items
        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        // Calculate total amount and validate medicines
        let totalAmount = 0;
        const medicineIds = items.map(item => item.medicine_id);
        const medicines = await Medicine.findAll({
            where: { id: { [Op.in]: medicineIds } },
            transaction
        });

        if (medicines.length !== medicineIds.length) {
            await transaction.rollback();
            return res.status(404).json({ error: 'One or more medicines not found' });
        }

        // Create order
        const order = await Order.create({
            customer_id,
            pharmacy_id,
            status: 'pending',
            shipping_address,
            note,
            total_amount: 0 // Will be updated after items are added
        }, { transaction });

        // Create order items and calculate total
        for (const item of items) {
            const medicine = medicines.find(m => m.id === item.medicine_id);
            await OrderItem.create({
                order_id: order.id,
                medicine_id: item.medicine_id,
                quantity: item.quantity,
                price: medicine.price
            }, { transaction });
            totalAmount += medicine.price * item.quantity;
        }

        // Update order total
        await order.update({ total_amount: totalAmount }, { transaction });

        await transaction.commit();

        // Fetch complete order with associations
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Pharmacy,
                    as: 'pharmacy'
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Medicine,
                            as: 'medicine'
                        }
                    ]
                }
            ]
        });

        // Create notification for customer about order placement
        try {
            await Notification.create({
                recipient_type: 'customer',
                recipient_id: customer_id,
                type: 'order_placed',
                title: 'Order Placed Successfully',
                message: `Your order #${order.id} has been placed successfully at ${pharmacy.name}. Total amount: $${totalAmount.toFixed(2)}`,
                metadata: {
                    order_id: order.id,
                    pharmacy_id: pharmacy_id,
                    pharmacy_name: pharmacy.name,
                    total_amount: totalAmount,
                    items_count: items.length,
                    order_date: new Date().toISOString()
                }
            });
            console.log(`✓ Order placed notification sent to customer ${customer_id} for order ${order.id}`);
        } catch (notificationError) {
            console.error(`✗ Failed to create order notification for customer ${customer_id}:`, notificationError.message);
            // Don't fail the order creation if notification fails
        }

        // Create notifications for pharmacy users (admin/pharmacist) about new order
        try {
            const pharmacyUsers = await User.findAll({
                where: {
                    role: ['admin', 'pharmacist'],
                    pharmacy_id: pharmacy_id
                }
            });

            console.log(`Found ${pharmacyUsers.length} pharmacy users to notify for order ${order.id}`);

            let userNotificationsCreated = 0;
            for (const user of pharmacyUsers) {
                try {
                    await Notification.create({
                        recipient_type: 'user',
                        recipient_id: user.id,
                        type: 'order_placed',
                        title: 'New Order Received',
                        message: `${customer.name} has placed an order #${order.id}. Total amount: $${totalAmount.toFixed(2)}`,
                        metadata: {
                            order_id: order.id,
                            customer_id: customer_id,
                            customer_name: customer.name,
                            pharmacy_id: pharmacy_id,
                            pharmacy_name: pharmacy.name,
                            total_amount: totalAmount,
                            items_count: items.length,
                            order_date: new Date().toISOString()
                        }
                    });
                    
                    userNotificationsCreated++;
                    console.log(`✓ Order notification sent to user ${user.id} (${user.name}) for order ${order.id}`);
                } catch (userNotificationError) {
                    console.error(`✗ Failed to create order notification for user ${user.id} (${user.name}):`, userNotificationError.message);
                    // Continue with other users even if one fails
                }
            }

            console.log(`Order notifications completed: ${userNotificationsCreated}/${pharmacyUsers.length} pharmacy users notified`);
        } catch (pharmacyNotificationError) {
            console.error(`✗ Failed to notify pharmacy users for order ${order.id}:`, pharmacyNotificationError.message);
            // Don't fail the order creation if pharmacy notifications fail
        }

        res.status(201).json(completeOrder);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Medicine,
                            as: 'medicine'
                        }
                    ]
                }
            ],
            transaction
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['approved', 'denied'],
            'approved': ['completed'],
            'denied': [],
            'completed': []
        };

        if (!validTransitions[order.status].includes(status)) {
            await transaction.rollback();
            return res.status(400).json({ 
                error: `Invalid status transition from ${order.status} to ${status}` 
            });
        }

        // Update medicine quantities if order is approved
        if (status === 'approved') {
            for (const item of order.items) {
                const medicine = item.medicine;
                if (medicine.quantity < item.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({ 
                        error: `Insufficient stock for medicine ${medicine.name}` 
                    });
                }
                await medicine.update({
                    quantity: medicine.quantity - item.quantity
                }, { transaction });
            }
        }

        // Update order status
        await order.update({ status }, { transaction });

        // Auto-resolve related notifications based on status change
        try {
            const currentTime = new Date();
            let notificationsToResolve = [];

            if (status === 'approved' || status === 'denied') {
                // Mark all "order_placed" notifications for this order as resolved
                notificationsToResolve.push({
                    where: {
                        type: 'order_placed',
                        'metadata.order_id': order.id,
                        is_resolved: false
                    }
                });
            }

            if (status === 'completed') {
                // Mark "order_approved" notifications for this order as resolved
                notificationsToResolve.push({
                    where: {
                        type: 'order_approved', 
                        'metadata.order_id': order.id,
                        is_resolved: false
                    }
                });
            }

            // Apply resolution updates
            for (const resolveConfig of notificationsToResolve) {
                const updateData = { 
                    is_resolved: true, 
                    resolved_at: currentTime 
                };

                // Add resolved_by if user is authenticated
                if (req.user && req.user.id) {
                    updateData.resolved_by = req.user.id;
                }

                const resolvedCount = await Notification.update(
                    updateData,
                    { 
                        where: resolveConfig.where,
                        transaction 
                    }
                );
                
                if (resolvedCount[0] > 0) {
                    const resolvedByInfo = req.user ? ` by user ${req.user.id}` : ' automatically';
                    console.log(`✓ Auto-resolved ${resolvedCount[0]} notifications for order ${order.id} (status: ${status})${resolvedByInfo}`);
                }
            }
        } catch (resolveError) {
            console.error(`✗ Failed to auto-resolve notifications for order ${order.id}:`, resolveError.message);
            // Don't fail the status update if notification resolution fails
        }

        await transaction.commit();

        // Create notification for customer about status change
        try {
            let notificationType = 'order_status_changed';
            let notificationTitle = 'Order Status Updated';
            let notificationMessage = `Your order #${order.id} status has been updated to ${status}`;

            // Use specific notification types for approved/denied status
            if (status === 'approved') {
                notificationType = 'order_approved';
                notificationTitle = 'Order Approved';
                notificationMessage = `Great news! Your order #${order.id} has been approved and is being prepared.`;
            } else if (status === 'denied') {
                notificationType = 'order_denied';
                notificationTitle = 'Order Denied';
                notificationMessage = `We're sorry, but your order #${order.id} has been denied. Please contact the pharmacy for more details.`;
            } else if (status === 'completed') {
                notificationTitle = 'Order Completed';
                notificationMessage = `Your order #${order.id} has been completed and is ready for pickup/delivery.`;
            }

            await Notification.create({
                recipient_type: 'customer',
                recipient_id: order.customer_id,
                type: notificationType,
                title: notificationTitle,
                message: notificationMessage,
                metadata: {
                    order_id: order.id,
                    old_status: order.status === status ? 'pending' : order.status, // Since we already updated
                    new_status: status,
                    total_amount: order.total_amount,
                    status_change_date: new Date().toISOString()
                }
            });
            console.log(`✓ Status change notification sent to customer ${order.customer_id} for order ${order.id} (${status})`);
        } catch (notificationError) {
            console.error(`✗ Failed to create status change notification for customer ${order.customer_id}:`, notificationError.message);
            // Don't fail the status update if notification fails
        }

        res.status(200).json(order);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// Delete order
exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findByPk(id, { 
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Pharmacy,
                    as: 'pharmacy'
                }
            ],
            transaction 
        });
        
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only allow deletion of pending orders
        if (order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ 
                error: 'Can only delete pending orders' 
            });
        }

        // Store order details for notifications before deletion
        const orderDetails = {
            id: order.id,
            customer_id: order.customer_id,
            customer_name: order.customer.name,
            pharmacy_id: order.pharmacy_id,
            pharmacy_name: order.pharmacy.name,
            total_amount: order.total_amount
        };

        // Delete order items first (cascade will handle this)
        await OrderItem.destroy({ 
            where: { order_id: id },
            transaction 
        });

        // Delete the order
        await order.destroy({ transaction });
        await transaction.commit();

        // Create notifications for pharmacy users about order cancellation
        try {
            const pharmacyUsers = await User.findAll({
                where: {
                    role: ['admin', 'pharmacist'],
                    pharmacy_id: orderDetails.pharmacy_id
                }
            });

            console.log(`Found ${pharmacyUsers.length} pharmacy users to notify about order ${orderDetails.id} cancellation`);

            let userNotificationsCreated = 0;
            for (const user of pharmacyUsers) {
                try {
                    await Notification.create({
                        recipient_type: 'user',
                        recipient_id: user.id,
                        type: 'order_cancelled',
                        title: 'Order Cancelled',
                        message: `Order #${orderDetails.id} from ${orderDetails.customer_name} has been cancelled`,
                        metadata: {
                            order_id: orderDetails.id,
                            customer_id: orderDetails.customer_id,
                            customer_name: orderDetails.customer_name,
                            pharmacy_id: orderDetails.pharmacy_id,
                            pharmacy_name: orderDetails.pharmacy_name,
                            total_amount: orderDetails.total_amount,
                            cancellation_date: new Date().toISOString()
                        }
                    });
                    
                    userNotificationsCreated++;
                    console.log(`✓ Order cancellation notification sent to user ${user.id} (${user.name}) for order ${orderDetails.id}`);
                } catch (userNotificationError) {
                    console.error(`✗ Failed to create cancellation notification for user ${user.id} (${user.name}):`, userNotificationError.message);
                    // Continue with other users even if one fails
                }
            }

            console.log(`Order cancellation notifications completed: ${userNotificationsCreated}/${pharmacyUsers.length} pharmacy users notified`);
        } catch (pharmacyNotificationError) {
            console.error(`✗ Failed to notify pharmacy users about order ${orderDetails.id} cancellation:`, pharmacyNotificationError.message);
            // Don't fail the order deletion if pharmacy notifications fail
        }

        res.status(204).send();
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
};
