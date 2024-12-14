const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Medicine = require('./Medicines');
const Customer = require('./Customer');
//index.js
// Define associations here after all models are loaded
Invoice.hasMany(InvoiceItem, {
    foreignKey: 'invoice_id',
    as: 'items',
    onDelete: 'CASCADE'
});

InvoiceItem.belongsTo(Invoice, {
    foreignKey: 'invoice_id',
    as: 'invoice',
    onDelete: 'CASCADE'
});

InvoiceItem.belongsTo(Medicine, {
    foreignKey: 'medicine_id',
    as: 'medicine',
    onDelete: 'CASCADE'
});

Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });

module.exports = {
    Invoice,
    InvoiceItem,
    Medicine,
    Customer
};
