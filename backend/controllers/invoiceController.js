// invoiceController.js

const { Invoice, InvoiceItem, Medicine, Customer, Product, Supplier, Brand, Category } = require('../models'); // Ensure models are imported
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper function to handle medicine creation/update from product
const handleMedicineFromProduct = async (product, quantity, transaction) => {
    // Find or create brand first
    let brand = await Brand.findOne({
        where: { name: product.brand },
        transaction
    });

    if (!brand) {
        brand = await Brand.create({
            name: product.brand,
            description: `Auto-created brand for ${product.brand}`,
            // Add more metadata if needed
            created_from: 'purchase_invoice',
            created_date: new Date()
        }, { transaction });
        console.log(`✅ Created new brand: ${brand.name} (auto-generated from purchase)`);
    }

    // Check if medicine exists with same name and brand_id
    const existingMedicine = await Medicine.findOne({
        where: {
            name: product.name,
            brand_id: brand.id
        },
        transaction,
        lock: transaction.LOCK.UPDATE
    });

    if (existingMedicine) {
        // Update existing medicine stock
        const updatedMedicineQuantity = (existingMedicine.quantity || 0) + quantity;
        await Medicine.update(
            { 
                quantity: updatedMedicineQuantity,
                price: product.price, // Update price to latest purchase price
                expiry_date: product.expiry_date || existingMedicine.expiry_date
            },
            { where: { id: existingMedicine.id }, transaction }
        );
        console.log(`✅ Updated medicine stock: ${existingMedicine.name} (+${quantity})`);
    } else {
        // Create new medicine from product
        const newMedicine = await Medicine.create({
            name: product.name,
            brand_id: brand.id,
            quantity: quantity,
            price: product.price,
            expiry_date: product.expiry_date,
            supplier_id: product.supplier_id,
            // Set default values for required fields
            location_id: 1, // Default location
            category_id: 1  // Default category
        }, { transaction });
        console.log(`✅ Created new medicine: ${newMedicine.name} (qty: ${quantity})`);
    }
};

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
                    include: [
                      { model: Medicine, as: 'medicine' },
                      { model: Product, as: 'product', include: [{ model: Supplier, as: 'supplier' }] }
                    ],
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
                    as: 'medicine'
                  },
                  {
                    model: Product,
                    as: 'product',
                    include: [{ model: Supplier, as: 'supplier' }]
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

        let totalAmount = 0;
        let invoice;

        if (type === 'sale') {
            // SALE: Handle medicines
            const medicineIds = items.map(item => item.medicine_id);
            const medicines = await Medicine.findAll({
                where: { id: { [Op.in]: medicineIds } },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            // Validate all medicines exist
            if (medicines.length !== medicineIds.length) {
                const foundIds = medicines.map(med => med.id);
                const missingIds = medicineIds.filter(id => !foundIds.includes(id));
                await transaction.rollback();
                return res.status(404).json({ error: `Medicines not found with IDs: ${missingIds.join(', ')}` });
            }

            // Validate stock availability
            for (const item of items) {
                const medicine = medicines.find(med => med.id === item.medicine_id);
                if (item.quantity > medicine.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({ error: `Insufficient stock for medicine "${medicine.name}". Available: ${medicine.quantity}, Requested: ${item.quantity}` });
                }
            }

            totalAmount = items.reduce((sum, item) => {
                const medicine = medicines.find(med => med.id === item.medicine_id);
                return sum + (medicine.price * item.quantity);
            }, 0);

            invoice = await Invoice.create({ invoice_date, type, total_amount: totalAmount, customer_id }, { transaction });

            for (const item of items) {
                const medicine = medicines.find(med => med.id === item.medicine_id);
                await InvoiceItem.create({
                    invoice_id: invoice.id,
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    price: medicine.price,
                }, { transaction });

                // Update Medicine stock
                const updatedQuantity = medicine.quantity - item.quantity;
                await Medicine.update(
                    { quantity: updatedQuantity },
                    { where: { id: medicine.id }, transaction }
                );
            }
        } else {
            // PURCHASE: Handle products
            const productIds = items.map(item => item.product_id);
            const products = await Product.findAll({
                where: { id: { [Op.in]: productIds } },
                include: [{ model: Supplier, as: 'supplier' }],
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            // Validate all products exist
            if (products.length !== productIds.length) {
                const foundIds = products.map(prod => prod.id);
                const missingIds = productIds.filter(id => !foundIds.includes(id));
                await transaction.rollback();
                return res.status(404).json({ error: `Products not found with IDs: ${missingIds.join(', ')}` });
            }

            totalAmount = items.reduce((sum, item) => {
                const product = products.find(prod => prod.id === item.product_id);
                return sum + (product.price * item.quantity);
            }, 0);

            invoice = await Invoice.create({ invoice_date, type, total_amount: totalAmount, customer_id }, { transaction });

            for (const item of items) {
                const product = products.find(prod => prod.id === item.product_id);
                await InvoiceItem.create({
                    invoice_id: invoice.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: product.price,
                }, { transaction });

                // Update Product stock (increase)
                const updatedQuantity = (product.quantity || 0) + item.quantity;
                await Product.update(
                    { quantity: updatedQuantity },
                    { where: { id: product.id }, transaction }
                );

                // Handle medicine creation/update for purchase invoices
                await handleMedicineFromProduct(product, item.quantity, transaction);
            }
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

        // Determine which model to use based on invoice type
        let entityModel, entityIds, entityKey;
        if (type === 'sale') {
            entityIds = items.map(item => item.medicine_id);
            entityModel = Medicine;
            entityKey = 'medicine_id';
        } else { // purchase
            entityIds = items.map(item => item.product_id);
            entityModel = Product;
            entityKey = 'product_id';
        }

        // Fetch all entities involved in the new items
        const entities = await entityModel.findAll({
            where: {id: {[Op.in]: entityIds}},
            include: type === 'purchase' ? [{ model: Supplier, as: 'supplier' }] : [],
            transaction,
            lock: transaction.LOCK.UPDATE, // Lock the selected rows for update
        });

        // Validate all entities exist
        if (entities.length !== entityIds.length) {
            const foundIds = entities.map(entity => entity.id);
            const missingIds = entityIds.filter(id => !foundIds.includes(id));
            await transaction.rollback();
            return res.status(404).json({error: `${type === 'sale' ? 'Medicines' : 'Products'} not found with IDs: ${missingIds.join(', ')}`});
        }

        // Map existing invoice items by entity_id for easy access
        const existingItemsMap = {};
        invoice.items.forEach(item => {
            if (item[entityKey]) {
                existingItemsMap[item[entityKey]] = item;
            }
        });

        // Validate stock availability and calculate stock changes based on invoice type
        for (const newItem of items) {
            const entity = entities.find(e => e.id === newItem[entityKey]);
            const existingItem = existingItemsMap[newItem[entityKey]];

            if (existingItem) {
                const quantityDifference = newItem.quantity - existingItem.quantity;
                if (type === 'sale') {
                    if (quantityDifference > 0 && quantityDifference > entity.quantity) {
                        await transaction.rollback();
                        return res.status(400).json({error: `Insufficient stock for ${type === 'sale' ? 'medicine' : 'product'} "${entity.name}". Available: ${entity.quantity}, Requested Increase: ${quantityDifference}`});
                    }
                }
                // For 'purchase', no need to validate as stock will increase
            } else {
                // New item being added to the invoice
                if (type === 'sale' && newItem.quantity > entity.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({error: `Insufficient stock for ${type === 'sale' ? 'medicine' : 'product'} "${entity.name}". Available: ${entity.quantity}, Requested: ${newItem.quantity}`});
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
            const entity = entities.find(e => e.id === newItem[entityKey]);
            const existingItem = existingItemsMap[newItem[entityKey]];

            if (existingItem) {
                const quantityDifference = newItem.quantity - existingItem.quantity;

                // Update the existing invoice item
                await existingItem.update({
                    quantity: newItem.quantity,
                    price: entity.price, // Assuming price remains consistent
                }, {transaction});

                // Adjust entity stock based on invoice type and quantity difference
                let updatedQuantity;
                if (type === 'sale') {
                    updatedQuantity = entity.quantity - quantityDifference;
                } else { // 'purchase'
                    updatedQuantity = entity.quantity + quantityDifference;
                    
                    // Handle medicine creation/update for purchase invoices (only if quantity increased)
                    if (quantityDifference > 0) {
                        await handleMedicineFromProduct(entity, quantityDifference, transaction);
                    }
                }

                await entityModel.update(
                    {quantity: updatedQuantity},
                    {where: {id: entity.id}, transaction}
                );

                // Remove from the map as it's already processed
                delete existingItemsMap[newItem[entityKey]];
            } else {
                // New invoice item
                const newItemData = {
                    invoice_id: invoice.id,
                    quantity: newItem.quantity,
                    price: entity.price,
                };
                newItemData[entityKey] = newItem[entityKey];
                await InvoiceItem.create(newItemData, {transaction});

                // Adjust entity stock based on invoice type
                let updatedQuantity;
                if (type === 'sale') {
                    updatedQuantity = entity.quantity - newItem.quantity;
                } else { // 'purchase'
                    updatedQuantity = entity.quantity + newItem.quantity;
                    
                    // Handle medicine creation/update for purchase invoices
                    await handleMedicineFromProduct(entity, newItem.quantity, transaction);
                }

                await entityModel.update(
                    {quantity: updatedQuantity},
                    {where: {id: entity.id}, transaction}
                );
            }

            // Accumulate total amount
            newTotalAmount += newItem.quantity * entity.price;
        }

        // Any remaining items in existingItemsMap have been removed from the invoice
        for (const [entityId, existingItem] of Object.entries(existingItemsMap)) {
            // Adjust entity stock based on invoice type
            const entity = entities.find(e => e.id === parseInt(entityId));
            let updatedQuantity;
            if (type === 'sale') {
                updatedQuantity = entity.quantity + existingItem.quantity;
            } else { // 'purchase'
                updatedQuantity = entity.quantity - existingItem.quantity;
            }

            // For 'purchase', ensure stock doesn't go negative
            if (type === 'purchase' && updatedQuantity < 0) {
                await transaction.rollback();
                return res.status(400).json({error: `Cannot remove ${existingItem.quantity} of "${entity.name}" from invoice. It would result in negative stock.`});
            }

            await entityModel.update(
                {quantity: updatedQuantity},
                {where: {id: entity.id}, transaction}
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
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
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

// Get top 5 selling brands
exports.getTopSellingBrands = async (req, res) => {
    try {
        console.log('Fetching top selling brands data...');

        // Query to get top 5 brands by total quantity sold
        const topBrands = await InvoiceItem.findAll({
            attributes: [
                [sequelize.col('medicine.brand.id'), 'brand_id'],
                [sequelize.col('medicine.brand.name'), 'brand_name'],
                [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'total_quantity_sold'],
                [sequelize.fn('SUM', sequelize.literal('InvoiceItem.quantity * InvoiceItem.price')), 'total_revenue']
            ],
            include: [
                {
                    model: Medicine,
                    as: 'medicine',
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: Brand,
                            as: 'brand',
                            attributes: [],
                            required: true
                        }
                    ]
                },
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: [],
                    where: { type: 'sale' },
                    required: true
                }
            ],
            group: ['medicine.brand.id', 'medicine.brand.name'],
            order: [[sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'DESC']],
            limit: 5,
            raw: true
        });

        // Format the response
        const formattedTopBrands = topBrands.map((brand, index) => ({
            rank: index + 1,
            brand_id: brand.brand_id,
            brand_name: brand.brand_name,
            total_quantity_sold: parseInt(brand.total_quantity_sold),
            total_revenue: parseFloat(brand.total_revenue).toFixed(2)
        }));

        console.log('Top 5 Selling Brands:', JSON.stringify(formattedTopBrands, null, 2));

        res.status(200).json({
            success: true,
            data: formattedTopBrands,
            message: 'Top 5 selling brands retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getTopSellingBrands:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch top selling brands data',
            details: error.message 
        });
    }
};

// Get top 5 selling brands by date range
exports.getTopSellingBrandsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Both startDate and endDate are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        console.log(`Fetching top selling brands from ${start} to ${end}...`);

        // Query to get top 5 brands by total quantity sold within date range
        const topBrands = await InvoiceItem.findAll({
            attributes: [
                [sequelize.col('medicine.brand.id'), 'brand_id'],
                [sequelize.col('medicine.brand.name'), 'brand_name'],
                [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'total_quantity_sold'],
                [sequelize.fn('SUM', sequelize.literal('InvoiceItem.quantity * InvoiceItem.price')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('invoice.id'))), 'number_of_transactions']
            ],
            include: [
                {
                    model: Medicine,
                    as: 'medicine',
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: Brand,
                            as: 'brand',
                            attributes: [],
                            required: true
                        }
                    ]
                },
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: [],
                    where: { 
                        type: 'sale',
                        invoice_date: { [Op.between]: [start, end] }
                    },
                    required: true
                }
            ],
            group: ['medicine.brand.id', 'medicine.brand.name'],
            order: [[sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'DESC']],
            limit: 5,
            raw: true
        });

        // Format the response
        const formattedTopBrands = topBrands.map((brand, index) => ({
            rank: index + 1,
            brand_id: brand.brand_id,
            brand_name: brand.brand_name,
            total_quantity_sold: parseInt(brand.total_quantity_sold),
            total_revenue: parseFloat(brand.total_revenue).toFixed(2),
            number_of_transactions: parseInt(brand.number_of_transactions),
            average_quantity_per_transaction: (parseInt(brand.total_quantity_sold) / parseInt(brand.number_of_transactions)).toFixed(2)
        }));

        console.log('Top 5 Selling Brands by Date Range:', JSON.stringify(formattedTopBrands, null, 2));

        res.status(200).json({
            success: true,
            data: formattedTopBrands,
            dateRange: {
                start: startDate,
                end: endDate
            },
            message: 'Top 5 selling brands for date range retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getTopSellingBrandsByDateRange:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch top selling brands data for date range',
            details: error.message 
        });
    }
};

// Get sales by medicine category
exports.getSalesByCategory = async (req, res) => {
    try {
        const { startDate, endDate, type = 'revenue' } = req.query;
        
        console.log('Fetching sales by category data...');

        // Build date filter if provided
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter = { invoice_date: { [Op.between]: [start, end] } };
        }

        // Query to get sales data grouped by category
        const salesByCategory = await InvoiceItem.findAll({
            attributes: [
                [sequelize.col('medicine.category.id'), 'category_id'],
                [sequelize.col('medicine.category.name'), 'category_name'],
                [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'total_quantity_sold'],
                [sequelize.fn('SUM', sequelize.literal('InvoiceItem.quantity * InvoiceItem.price')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('invoice.id'))), 'number_of_transactions']
            ],
            include: [
                {
                    model: Medicine,
                    as: 'medicine',
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: [],
                            required: true
                        }
                    ]
                },
                {
                    model: Invoice,
                    as: 'invoice',
                    attributes: [],
                    where: { 
                        type: 'sale',
                        ...dateFilter
                    },
                    required: true
                }
            ],
            group: ['medicine.category.id', 'medicine.category.name'],
            order: [
                type === 'revenue' 
                    ? [sequelize.fn('SUM', sequelize.literal('InvoiceItem.quantity * InvoiceItem.price')), 'DESC']
                    : [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'DESC']
            ],
            raw: true
        });

        // Calculate total for percentage calculation
        const totalValue = salesByCategory.reduce((sum, category) => {
            return sum + (type === 'revenue' 
                ? parseFloat(category.total_revenue) 
                : parseInt(category.total_quantity_sold));
        }, 0);

        // Format the response with percentages
        const formattedSalesData = salesByCategory.map((category) => {
            const value = type === 'revenue' 
                ? parseFloat(category.total_revenue) 
                : parseInt(category.total_quantity_sold);
            const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : 0;

            return {
                category_id: category.category_id,
                category_name: category.category_name,
                total_quantity_sold: parseInt(category.total_quantity_sold),
                total_revenue: parseFloat(category.total_revenue).toFixed(2),
                number_of_transactions: parseInt(category.number_of_transactions),
                percentage: parseFloat(percentage),
                value: type === 'revenue' ? parseFloat(category.total_revenue) : parseInt(category.total_quantity_sold)
            };
        });

        console.log('Sales by Category:', JSON.stringify(formattedSalesData, null, 2));

        res.status(200).json({
            success: true,
            data: formattedSalesData,
            summary: {
                total_categories: formattedSalesData.length,
                total_value: totalValue,
                type: type,
                date_range: startDate && endDate ? { start: startDate, end: endDate } : null
            },
            message: 'Sales by category retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getSalesByCategory:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch sales by category data',
            details: error.message 
        });
    }
};
