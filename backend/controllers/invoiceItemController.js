const InvoiceItem = require('../models/InvoiceItem');
const Medicine = require('../models/Medicines');
const Invoice = require('../models/Invoice');
//invoiceItemController.js

// Helper function to recalculate total amount
const recalculateInvoiceTotal = async (invoice_id) => {
    const invoiceItems = await InvoiceItem.findAll({ where: { invoice_id } });
    const totalAmount = invoiceItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Update the invoice total amount
    await Invoice.update({ total_amount: totalAmount }, { where: { id: invoice_id } });
};

// Create a new invoice item with medicine price
exports.createInvoiceItem = async (req, res) => {
    const { invoice_id, medicine_id, quantity } = req.body;

    try {
        // Fetch the medicine to get the price
        const medicine = await Medicine.findByPk(medicine_id);
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        // Calculate the price for this item
        const price = medicine.price;

        // Create the new invoice item
        const newInvoiceItem = await InvoiceItem.create({
            invoice_id,
            medicine_id,
            quantity,
            price, // Use the fetched price
        });

        // Recalculate total amount
        await recalculateInvoiceTotal(invoice_id);

        res.status(201).json(newInvoiceItem);
    } catch (error) {
        console.error('Error creating invoice item:', error);
        res.status(500).json({ error: 'Failed to create invoice item' });
    }
};


// Update an existing invoice item
exports.updateInvoiceItem = async (req, res) => {
    const { id } = req.params;
    const { medicine_id, quantity } = req.body;

    try {
        const invoiceItem = await InvoiceItem.findByPk(id);
        if (!invoiceItem) {
            return res.status(404).json({ error: 'Invoice item not found' });
        }

        // Check if the medicine_id is changing and fetch the new price if so
        let price = invoiceItem.price;
        if (medicine_id && medicine_id !== invoiceItem.medicine_id) {
            const medicine = await Medicine.findByPk(medicine_id);
            if (!medicine) {
                return res.status(404).json({ error: 'Medicine not found' });
            }
            price = medicine.price;
            invoiceItem.medicine_id = medicine_id;
        }

        // Update item details
        invoiceItem.quantity = quantity;
        invoiceItem.price = price;
        await invoiceItem.save();

        // Recalculate total amount
        await recalculateInvoiceTotal(invoiceItem.invoice_id);

        res.status(200).json(invoiceItem);
    } catch (error) {
        console.error('Error updating invoice item:', error);
        res.status(500).json({ error: 'Failed to update invoice item' });
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