// invoiceController.js

const { Invoice, InvoiceItem, Medicine, Customer } = require('../models'); // Ensure models are imported
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper function to recalculate total amount
const recalculateInvoiceTotal = async (invoice_id) => {
    const invoiceItems = await InvoiceItem.findAll({ where: { invoice_id } });
    const totalAmount = invoiceItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Update the invoice total amount
    await Invoice.update({ total_amount: totalAmount }, { where: { id: invoice_id } });
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [{ model: Medicine, as: 'medicine' }],
                },
                {
                    model: Customer,
                    as: 'customer', // Include customer details
                },
            ],
        });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to retrieve invoices', details: error.message });
    }
};

// Get a single invoice by ID
exports.getInvoiceById = async (req, res) => {
    const { id } = req.params;
    try {
        const invoice = await Invoice.findByPk(id, {
            include: {
                model: InvoiceItem,
                as: 'items',
                include: [
                    {
                        model: Medicine,
                        as: 'medicine' // Make sure the alias matches your association
                    }
                ]
            }
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to retrieve invoice', details: error.message });
    }
};

// Create a new invoice and its items with stock validation
exports.createInvoice = async (req, res) => {
    const { invoice_date, type, items, customer_id } = req.body;

    const transaction = await sequelize.transaction();

    try {
        // Validate invoice type
        if (!['sale', 'purchase'].includes(type)) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Invalid invoice type. Must be "sale" or "purchase".' });
        }

        // Check if customer exists
        if (customer_id) {
            const customer = await Customer.findByPk(customer_id, { transaction });
            if (!customer) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Customer not found' });
            }
        }

        // Ensure at least one item is present
        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Invoice must contain at least one item.' });
        }

        // Fetch all medicines involved in the invoice
        const medicineIds = items.map(item => item.medicine_id);
        const medicines = await Medicine.findAll({
            where: { id: { [Op.in]: medicineIds } },
            transaction,
            lock: transaction.LOCK.UPDATE, // Lock the selected rows for update
        });

        // Validate all medicines exist
        if (medicines.length !== medicineIds.length) {
            const foundIds = medicines.map(med => med.id);
            const missingIds = medicineIds.filter(id => !foundIds.includes(id));
            await transaction.rollback();
            return res.status(404).json({ error: `Medicines not found with IDs: ${missingIds.join(', ')}` });
        }

        // Validate stock availability based on invoice type
        for (const item of items) {
            const medicine = medicines.find(med => med.id === item.medicine_id);
            if (type === 'sale') {
                if (item.quantity > medicine.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({ error: `Insufficient stock for medicine "${medicine.name}". Available: ${medicine.quantity}, Requested: ${item.quantity}` });
                }
            }
            // For 'purchase', no need to validate stock as it will increase
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => {
            const medicine = medicines.find(med => med.id === item.medicine_id);
            return sum + (medicine.price * item.quantity);
        }, 0);

        // Create the invoice
        const invoice = await Invoice.create({ invoice_date, type, total_amount: totalAmount, customer_id }, { transaction });

        // Create invoice items and update medicine stock
        for (const item of items) {
            const medicine = medicines.find(med => med.id === item.medicine_id);

            // Create InvoiceItem
            await InvoiceItem.create({
                invoice_id: invoice.id,
                medicine_id: item.medicine_id,
                quantity: item.quantity,
                price: medicine.price,
            }, { transaction });

            // Update Medicine stock based on invoice type
            let updatedQuantity;
            if (type === 'sale') {
                updatedQuantity = medicine.quantity - item.quantity;
            } else { // 'purchase'
                updatedQuantity = medicine.quantity + item.quantity;
            }

            await Medicine.update(
                { quantity: updatedQuantity },
                { where: { id: medicine.id }, transaction }
            );
        }

        await transaction.commit();
        res.status(201).json(invoice);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating invoice:', error.message);
        res.status(500).json({ error: 'Failed to create invoice', details: error.message });
    }
};

// Update an invoice and its items with stock validation
exports.updateInvoice = async (req, res) => {
    const {id} = req.params;
    const {invoice_date, type, items} = req.body;

    const transaction = await sequelize.transaction();

    try {
        // Validate invoice type
        if (!['sale', 'purchase'].includes(type)) {
            await transaction.rollback();
            return res.status(400).json({error: 'Invalid invoice type. Must be "sale" or "purchase".'});
        }

        // Find the existing invoice with items
        const invoice = await Invoice.findByPk(id, {
            include: [{model: InvoiceItem, as: 'items'}],
            transaction,
            lock: transaction.LOCK.UPDATE, // Lock the row for update
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({error: 'Invoice not found'});
        }

        // Fetch all medicines involved in the new items
        const medicineIds = items.map(item => item.medicine_id);
        const medicines = await Medicine.findAll({
            where: {id: {[Op.in]: medicineIds}},
            transaction,
            lock: transaction.LOCK.UPDATE, // Lock the selected rows for update
        });

        // Validate all medicines exist
        if (medicines.length !== medicineIds.length) {
            const foundIds = medicines.map(med => med.id);
            const missingIds = medicineIds.filter(id => !foundIds.includes(id));
            await transaction.rollback();
            return res.status(404).json({error: `Medicines not found with IDs: ${missingIds.join(', ')}`});
        }

        // Map existing invoice items by medicine_id for easy access
        const existingItemsMap = {};
        invoice.items.forEach(item => {
            existingItemsMap[item.medicine_id] = item;
        });

        // Validate stock availability and calculate stock changes based on invoice type
        for (const newItem of items) {
            const medicine = medicines.find(med => med.id === newItem.medicine_id);
            const existingItem = existingItemsMap[newItem.medicine_id];

            if (existingItem) {
                const quantityDifference = newItem.quantity - existingItem.quantity;
                if (type === 'sale') {
                    if (quantityDifference > 0 && quantityDifference > medicine.quantity) {
                        await transaction.rollback();
                        return res.status(400).json({error: `Insufficient stock for medicine "${medicine.name}". Available: ${medicine.quantity}, Requested Increase: ${quantityDifference}`});
                    }
                }
                // For 'purchase', no need to validate as stock will increase
            } else {
                // New medicine being added to the invoice
                if (type === 'sale' && newItem.quantity > medicine.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({error: `Insufficient stock for medicine "${medicine.name}". Available: ${medicine.quantity}, Requested: ${newItem.quantity}`});
                }
            }
        }

        // All validations passed, proceed to update
        // Update invoice details
        await invoice.update({invoice_date, type}, {transaction});

        // Prepare to track total amount
        let newTotalAmount = 0;

        // Process each new item
        for (const newItem of items) {
            const medicine = medicines.find(med => med.id === newItem.medicine_id);
            const existingItem = existingItemsMap[newItem.medicine_id];

            if (existingItem) {
                const quantityDifference = newItem.quantity - existingItem.quantity;

                // Update the existing invoice item
                await existingItem.update({
                    quantity: newItem.quantity,
                    price: medicine.price, // Assuming price remains consistent
                }, {transaction});

                // Adjust medicine stock based on invoice type and quantity difference
                let updatedQuantity;
                if (type === 'sale') {
                    updatedQuantity = medicine.quantity - quantityDifference;
                } else { // 'purchase'
                    updatedQuantity = medicine.quantity + quantityDifference;
                }

                await Medicine.update(
                    {quantity: updatedQuantity},
                    {where: {id: medicine.id}, transaction}
                );

                // Remove from the map as it's already processed
                delete existingItemsMap[newItem.medicine_id];
            } else {
                // New invoice item
                await InvoiceItem.create({
                    invoice_id: invoice.id,
                    medicine_id: newItem.medicine_id,
                    quantity: newItem.quantity,
                    price: medicine.price,
                }, {transaction});

                // Adjust medicine stock based on invoice type
                let updatedQuantity;
                if (type === 'sale') {
                    updatedQuantity = medicine.quantity - newItem.quantity;
                } else { // 'purchase'
                    updatedQuantity = medicine.quantity + newItem.quantity;
                }

                await Medicine.update(
                    {quantity: updatedQuantity},
                    {where: {id: medicine.id}, transaction}
                );
            }

            // Accumulate total amount
            newTotalAmount += newItem.quantity * medicine.price;
        }

        // Any remaining items in existingItemsMap have been removed from the invoice
        for (const [medicine_id, existingItem] of Object.entries(existingItemsMap)) {
            // Adjust medicine stock based on invoice type
            const medicine = medicines.find(med => med.id === parseInt(medicine_id));
            let updatedQuantity;
            if (type === 'sale') {
                updatedQuantity = medicine.quantity + existingItem.quantity;
            } else { // 'purchase'
                updatedQuantity = medicine.quantity - existingItem.quantity;
            }

            // For 'purchase', ensure stock doesn't go negative
            if (type === 'purchase' && updatedQuantity < 0) {
                await transaction.rollback();
                return res.status(400).json({error: `Cannot remove ${existingItem.quantity} of "${medicine.name}" from invoice. It would result in negative stock.`});
            }

            await Medicine.update(
                {quantity: updatedQuantity},
                {where: {id: medicine.id}, transaction}
            );

            // Delete the invoice item
            await existingItem.destroy({transaction});
        }

        // Update the total amount of the invoice
        await invoice.update({total_amount: newTotalAmount}, {transaction});

        await transaction.commit();
        res.status(200).json(invoice);
    } catch (error) {
        await transaction.rollback();
        console.error('Error editing invoice:', error);
        res.status(500).json({ error: 'Failed to edit invoice' });
    }
};

// Delete an invoice and its items
    exports.deleteInvoice = async (req, res) => {
        const { id } = req.params;
        const transaction = await sequelize.transaction();

        try {
            // Find the invoice with items
            const invoice = await Invoice.findByPk(id, {
                include: [{ model: InvoiceItem, as: 'items' }],
                transaction,
                lock: transaction.LOCK.UPDATE, // Lock the row for update
            });

            if (!invoice) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // Restore or deduct medicine quantities based on invoice type
            for (const item of invoice.items) {
                const medicine = await Medicine.findByPk(item.medicine_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (medicine) {
                    let updatedQuantity;
                    if (invoice.type === 'sale') {
                        // Restore stock by adding back the sold quantity
                        updatedQuantity = medicine.quantity + item.quantity;
                    } else { // 'purchase'
                        // Deduct stock by the purchased quantity
                        updatedQuantity = medicine.quantity - item.quantity;
                        // Ensure stock doesn't go negative
                        if (updatedQuantity < 0) {
                            await transaction.rollback();
                            return res.status(400).json({ error: `Cannot delete purchase invoice. It would result in negative stock for medicine "${medicine.name}".` });
                        }
                    }

                    await Medicine.update(
                        { quantity: updatedQuantity },
                        { where: { id: medicine.id }, transaction }
                    );
                }
            }

            // Delete invoice items
            await InvoiceItem.destroy({ where: { invoice_id: id }, transaction });

            // Delete the invoice
            await invoice.destroy({ transaction });

            await transaction.commit();
            res.status(204).json({ message: 'Invoice and its items deleted successfully' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting invoice:', error);
            res.status(500).json({ error: 'Failed to delete invoice' });
        }
    };

// Get monthly revenue
    exports.getMonthlyRevenue = async (req, res) => {
        try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

            // Fetch income from sales and outcome from purchases
            const income = await Invoice.sum('total_amount', {
                where: {
                    type: 'sale',
                    invoice_date: { [Op.between]: [startOfMonth, endOfMonth] },
                },
            });

            const outcome = await Invoice.sum('total_amount', {
                where: {
                    type: 'purchase',
                    invoice_date: { [Op.between]: [startOfMonth, endOfMonth] },
                },
            });

            res.status(200).json({
                income: income || 0,
                outcome: outcome || 0,
                total: (income || 0) - (outcome || 0),
            });
        } catch (error) {
            console.log('Error calculating monthly revenue', error);
            res.status(500).json({ error: 'Failed to calculate revenue' });
        }
    };

// Get selling medicines
    exports.getSellingMedicines = async (req, res) => {
        try {
            console.log('Fetching selling medicines data...');

            const invoices = await Invoice.findAll({ where: { type: 'sale' } });
            console.log('Invoices of type sale:', invoices);

            if (!invoices.length) {
                console.log('No invoices of type sale found.');
                return res.status(404).json({ error: 'No sales invoices found' });
            }

            const salesData = await InvoiceItem.findAll({
                attributes: [
                    'medicine_id',
                    [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'total_quantity'],
                ],
                include: [
                    {
                        model: Medicine,
                        as: 'medicine',
                        attributes: ['name'],
                    },
                    {
                        model: Invoice,
                        as: 'invoice',
                        attributes: [],
                        where: { type: 'sale' },
                    },
                ],
                group: ['medicine_id', 'medicine.id', 'medicine.name'],
            });

            console.log('Sales Data:', JSON.stringify(salesData, null, 2)); // Log sales data

            // Check if sales data is empty
            if (!salesData.length) {
                console.log('No sales data found.');
                return res.status(404).json({ error: 'No sales data found' });
            }

            res.status(200).json(salesData);
        } catch (error) {
            console.error('Error in getSellingMedicines:', error);
            res.status(500).json({ error: 'Failed to fetch selling medicines data' });
        }
    };

// Get daily income
    exports.getDailyIncome = async (req, res) => {
        try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

            const dailyIncome = await Invoice.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('invoice_date')), 'date'],
                    [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_income'],
                ],
                where: {
                    type: 'sale',
                    invoice_date: { [Op.between]: [startOfMonth, endOfMonth] },
                },
                group: [sequelize.fn('DATE', sequelize.col('invoice_date'))],
                order: [[sequelize.fn('DATE', sequelize.col('invoice_date')), 'ASC']],
            });

            res.status(200).json(dailyIncome);
        } catch (error) {
            console.error('Error fetching daily income:', error);
            res.status(500).json({ error: 'Failed to fetch daily income' });
        }
    };
