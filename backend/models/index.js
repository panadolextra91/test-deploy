const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Medicine = require('./Medicines');
const Customer = require('./Customer');
const Product = require('./Product');
const Supplier = require('./Supplier');
const Pharmacy = require('./Pharmacy');
const User = require('./User');
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

// Association for purchase invoices
InvoiceItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
    onDelete: 'CASCADE'
});
Product.hasMany(InvoiceItem, {
    foreignKey: 'product_id',
    as: 'invoiceItems',
    onDelete: 'CASCADE'
});

Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });


// Supplier ↔ Product
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// A user belongs to one pharmacy:
User.belongsTo(Pharmacy, {
    foreignKey: 'pharmacy_id',
    as: 'Pharmacy'
  });
  
  // A pharmacy has many users:
  Pharmacy.hasMany(User, {
    foreignKey: 'pharmacy_id',
    as: 'Users'
  });


module.exports = {
    Invoice,
    InvoiceItem,
    Medicine,
    Customer,
    Product,
    Supplier,
    Pharmacy,
    User,
};
