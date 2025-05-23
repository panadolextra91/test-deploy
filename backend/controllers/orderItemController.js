const { OrderItem, Order, Medicine } = require('../models');
const sequelize = require('../config/database');

// Helper function to recalculate order total with retry logic
const recalculateOrderTotal = async (order_id, transaction) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            const orderItems = await OrderItem.findAll({ 
                where: { order_id },
                transaction 
            });
            
            const totalAmount = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            await Order.update(
                { total_amount: totalAmount },
                { 
                    where: { id: order_id },
                    transaction
                }
            );
            
            return;
        } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
                throw error;
            }
            // Wait for a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

// Create order item
exports.createOrderItem = async (req, res) => {
    const { order_id, medicine_id, quantity } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // Check if order exists and is pending
        const order = await Order.findByPk(order_id, { transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Can only add items to pending orders' });
        }

        // Get medicine price
        const medicine = await Medicine.findByPk(medicine_id, { transaction });
        if (!medicine) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Medicine not found' });
        }

        // Create order item
        const orderItem = await OrderItem.create({
            order_id,
            medicine_id,
            quantity,
            price: medicine.price
        }, { transaction });

        // Update order total
        await recalculateOrderTotal(order_id, transaction);

        await transaction.commit();
        res.status(201).json(orderItem);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order item:', error);
        res.status(500).json({ error: 'Failed to create order item' });
    }
};

// Update order item
exports.updateOrderItem = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const orderItem = await OrderItem.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order'
                }
            ],
            transaction
        });

        if (!orderItem) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Order item not found' });
        }

        // Check if order is pending
        if (orderItem.order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Can only update items in pending orders' });
        }

        // Update quantity
        await orderItem.update({ quantity }, { transaction });

        // Update order total
        await recalculateOrderTotal(orderItem.order_id, transaction);

        await transaction.commit();
        res.status(200).json(orderItem);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order item:', error);
        res.status(500).json({ error: 'Failed to update order item' });
    }
};

// Delete order item
exports.deleteOrderItem = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const orderItem = await OrderItem.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order'
                }
            ],
            transaction
        });

        if (!orderItem) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Order item not found' });
        }

        // Check if order is pending
        if (orderItem.order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Can only delete items from pending orders' });
        }

        const orderId = orderItem.order_id;
        await orderItem.destroy({ transaction });

        // Update order total
        await recalculateOrderTotal(orderId, transaction);

        await transaction.commit();
        res.status(204).send();
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting order item:', error);
        res.status(500).json({ error: 'Failed to delete order item' });
    }
};

// Get order item by ID
exports.getOrderItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const orderItem = await OrderItem.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order'
                },
                {
                    model: Medicine,
                    as: 'medicine'
                }
            ]
        });
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        res.status(200).json(orderItem);
    } catch (error) {
        console.error('Error fetching order item:', error);
        res.status(500).json({ error: 'Failed to retrieve order item' });
    }
};
