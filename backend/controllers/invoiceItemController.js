const InvoiceItem = require('../models/InvoiceItem');
const Medicine = require('../models/Medicines');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Brand = require('../models/Brand');
const sequelize = require('../config/database');
//invoiceItemController.js

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

// Create a new invoice item with medicine or product price
exports.createInvoiceItem = async (req, res) => {
    const { invoice_id, medicine_id, product_id, quantity } = req.body;

    const transaction = await sequelize.transaction();

    try {
        // Get invoice to check type
        const invoice = await Invoice.findByPk(invoice_id, { transaction });
        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }

        let price, newInvoiceItem;

        if (invoice.type === 'sale') {
            // Handle medicine for sale invoices
            if (!medicine_id) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Medicine ID is required for sale invoices' });
            }

            const medicine = await Medicine.findByPk(medicine_id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!medicine) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Medicine not found' });
            }

            // Check stock availability
            if (quantity > medicine.quantity) {
                await transaction.rollback();
                return res.status(400).json({ error: `Insufficient stock. Available: ${medicine.quantity}, Requested: ${quantity}` });
            }

            price = medicine.price;

            // Create the new invoice item
            newInvoiceItem = await InvoiceItem.create({
                invoice_id,
                medicine_id,
                quantity,
                price,
            }, { transaction });

            // Update medicine stock
            await Medicine.update(
                { quantity: medicine.quantity - quantity },
                { where: { id: medicine_id }, transaction }
            );

        } else { // purchase
            // Handle product for purchase invoices
            if (!product_id) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Product ID is required for purchase invoices' });
            }

            const product = await Product.findByPk(product_id, { 
                include: [{ model: Supplier, as: 'supplier' }],
                transaction, 
                lock: transaction.LOCK.UPDATE 
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Product not found' });
            }

            price = product.price;

            // Create the new invoice item
            newInvoiceItem = await InvoiceItem.create({
                invoice_id,
                product_id,
                quantity,
                price,
            }, { transaction });

            // Update product stock
            await Product.update(
                { quantity: (product.quantity || 0) + quantity },
                { where: { id: product_id }, transaction }
            );

            // Handle medicine creation/update
            await handleMedicineFromProduct(product, quantity, transaction);
        }

        // Recalculate total amount
        await recalculateInvoiceTotal(invoice_id);

        await transaction.commit();
        res.status(201).json(newInvoiceItem);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating invoice item:', error);
        res.status(500).json({ error: 'Failed to create invoice item', details: error.message });
    }
};


// Update an existing invoice item
exports.updateInvoiceItem = async (req, res) => {
    const { id } = req.params;
    const { medicine_id, product_id, quantity } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const invoiceItem = await InvoiceItem.findByPk(id, { 
            include: [{ model: Invoice, as: 'invoice' }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!invoiceItem) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Invoice item not found' });
        }

        const invoice = invoiceItem.invoice;
        const oldQuantity = invoiceItem.quantity;
        const quantityDifference = quantity - oldQuantity;

        let price = invoiceItem.price;

        if (invoice.type === 'sale') {
            // Handle medicine updates for sale invoices
            if (medicine_id && medicine_id !== invoiceItem.medicine_id) {
                const medicine = await Medicine.findByPk(medicine_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (!medicine) {
                    await transaction.rollback();
                    return res.status(404).json({ error: 'Medicine not found' });
                }
                price = medicine.price;
                
                // Restore stock for old medicine
                if (invoiceItem.medicine_id) {
                    await Medicine.update(
                        { quantity: sequelize.literal(`quantity + ${oldQuantity}`) },
                        { where: { id: invoiceItem.medicine_id }, transaction }
                    );
                }
                
                // Check stock for new medicine
                if (quantity > medicine.quantity) {
                    await transaction.rollback();
                    return res.status(400).json({ error: `Insufficient stock. Available: ${medicine.quantity}, Requested: ${quantity}` });
                }
                
                // Update stock for new medicine
                await Medicine.update(
                    { quantity: medicine.quantity - quantity },
                    { where: { id: medicine_id }, transaction }
                );
                
                invoiceItem.medicine_id = medicine_id;
            } else if (quantityDifference !== 0 && invoiceItem.medicine_id) {
                // Same medicine, different quantity
                const medicine = await Medicine.findByPk(invoiceItem.medicine_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (medicine) {
                    if (quantityDifference > 0 && quantityDifference > medicine.quantity) {
                        await transaction.rollback();
                        return res.status(400).json({ error: `Insufficient stock. Available: ${medicine.quantity}, Additional Requested: ${quantityDifference}` });
                    }
                    
                    await Medicine.update(
                        { quantity: medicine.quantity - quantityDifference },
                        { where: { id: medicine.id }, transaction }
                    );
                }
            }
        } else { // purchase
            // Handle product updates for purchase invoices
            if (product_id && product_id !== invoiceItem.product_id) {
                const product = await Product.findByPk(product_id, { 
                    include: [{ model: Supplier, as: 'supplier' }],
                    transaction, 
                    lock: transaction.LOCK.UPDATE 
                });
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({ error: 'Product not found' });
                }
                price = product.price;
                
                // Restore stock for old product
                if (invoiceItem.product_id) {
                    await Product.update(
                        { quantity: sequelize.literal(`quantity - ${oldQuantity}`) },
                        { where: { id: invoiceItem.product_id }, transaction }
                    );
                }
                
                // Update stock for new product
                await Product.update(
                    { quantity: sequelize.literal(`quantity + ${quantity}`) },
                    { where: { id: product_id }, transaction }
                );
                
                // Handle medicine creation/update for new product
                await handleMedicineFromProduct(product, quantity, transaction);
                
                invoiceItem.product_id = product_id;
            } else if (quantityDifference !== 0 && invoiceItem.product_id) {
                // Same product, different quantity
                const product = await Product.findByPk(invoiceItem.product_id, { 
                    include: [{ model: Supplier, as: 'supplier' }],
                    transaction, 
                    lock: transaction.LOCK.UPDATE 
                });
                if (product) {
                    await Product.update(
                        { quantity: sequelize.literal(`quantity + ${quantityDifference}`) },
                        { where: { id: product.id }, transaction }
                    );
                    
                    // Handle medicine update for quantity difference
                    if (quantityDifference > 0) {
                        await handleMedicineFromProduct(product, quantityDifference, transaction);
                    }
                }
            }
        }

        // Update item details
        invoiceItem.quantity = quantity;
        invoiceItem.price = price;
        await invoiceItem.save({ transaction });

        // Recalculate total amount
        await recalculateInvoiceTotal(invoiceItem.invoice_id);

        await transaction.commit();
        res.status(200).json(invoiceItem);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating invoice item:', error);
        res.status(500).json({ error: 'Failed to update invoice item', details: error.message });
    }
};

// Delete an invoice item
exports.deleteInvoiceItem = async (req, res) => {
    const { id } = req.params;
    try {
        const invoiceItem = await InvoiceItem.findByPk(id);
        if (!invoiceItem) {
            return res.status(404).json({ error: 'Invoice item not found' });
        }

        const invoiceId = invoiceItem.invoice_id;

        // Delete the invoice item
        await invoiceItem.destroy();

        // Recalculate total amount
        await recalculateInvoiceTotal(invoiceId);

        res.status(204).json({ message: 'Invoice item deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice item:', error);
        res.status(500).json({ error: 'Failed to delete invoice item' });
    }
};

// Get all invoice items
exports.getAllInvoiceItems = async (req, res) => {
    try {
        const invoiceItems = await InvoiceItem.findAll({
            include: [
                {
                    model: Invoice,
                    as: 'invoice' // Ensure this alias matches your association
                },
                {
                    model: Medicine,
                    as: 'medicine' // Ensure this alias matches your association
                }
            ]
        });
        res.status(200).json(invoiceItems);
    } catch (error) {
        console.error('Error retrieving invoice items:', error);
        res.status(500).json({ error: 'Failed to retrieve invoice items' });
    }
};

// Get a single invoice item by ID
exports.getInvoiceItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const invoiceItem = await InvoiceItem.findByPk(id, {
            include: [
                {
                    model: Invoice,
                    as: 'invoice' // Ensure this alias matches your association
                },
                {
                    model: Medicine,
                    as: 'medicine' // Ensure this alias matches your association
                }
            ]
        });
        if (!invoiceItem) {
            return res.status(404).json({ error: 'Invoice item not found' });
        }
        res.status(200).json(invoiceItem);
    } catch (error) {
        console.error('Error retrieving invoice item:', error);
        res.status(500).json({ error: 'Failed to retrieve invoice item' });
    }
};