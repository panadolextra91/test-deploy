const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Medicine = require('./Medicines');
const Customer = require('./Customer');
const Product = require('./Product');
const Supplier = require('./Supplier');
const Pharmacy = require('./Pharmacy');
const User = require('./User');
const OTP = require('./OTP');
const Notification = require('./Notification');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const PharmaSalesRep = require('./PharmaSalesRep');
const Brand = require('./Brand');
const HealthMetrics = require('./HealthMetrics');
const HealthRecord = require('./HealthRecord');
const HealthMetricsHistory = require('./HealthMetricsHistory');
const Allergy = require('./Allergy');
const News = require('./News');

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

// Brand ↔ Medicine
Brand.hasMany(Medicine, { foreignKey: 'brand_id', as: 'medicines', onDelete: 'SET NULL' });
Medicine.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

// User ↔ Pharmacy (only this relationship remains)
User.belongsTo(Pharmacy, {
    foreignKey: 'pharmacy_id',
    as: 'pharmacy'
});

Pharmacy.hasMany(User, {
    foreignKey: 'pharmacy_id',
    as: 'users'
});

// OTP ↔ Customer
OTP.belongsTo(Customer, { 
    foreignKey: 'phone',
    targetKey: 'phone',
    as: 'customer'
});

Customer.hasMany(OTP, {
    foreignKey: 'phone',
    sourceKey: 'phone',
    as: 'otps'
});

// Order associations
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Order.belongsTo(Pharmacy, { foreignKey: 'pharmacy_id', as: 'pharmacy' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Medicine, { foreignKey: 'medicine_id', as: 'medicine' });

// Notification associations
Notification.belongsTo(User, {
    foreignKey: 'recipient_id',
    as: 'user',
    constraints: false
});

Notification.belongsTo(Customer, {
    foreignKey: 'recipient_id',
    as: 'customer',
    constraints: false
});

// Add scopes to User and Customer models
User.hasMany(Notification, {
    foreignKey: 'recipient_id',
    as: 'notifications',
    constraints: false
});

Customer.hasMany(Notification, {
    foreignKey: 'recipient_id',
    as: 'notifications',
    constraints: false
});

// PharmaSalesRep associations
PharmaSalesRep.belongsTo(Supplier, {
    foreignKey: 'supplier_id',
    as: 'supplier'
});

Supplier.hasMany(PharmaSalesRep, {
    foreignKey: 'supplier_id',
    as: 'salesReps'
});

// Product ↔ PharmaSalesRep
Product.belongsTo(PharmaSalesRep, {
    foreignKey: 'pharma_sales_rep_id',
    as: 'salesRep'
});

PharmaSalesRep.hasMany(Product, {
    foreignKey: 'pharma_sales_rep_id',
    as: 'products'
});

// Health-related associations
Customer.hasOne(HealthMetrics, {
    foreignKey: 'customer_id',
    as: 'healthMetrics'
});
HealthMetrics.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});

Customer.hasMany(HealthRecord, {
    foreignKey: 'customer_id',
    as: 'healthRecords'
});
HealthRecord.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});

Customer.hasMany(HealthMetricsHistory, {
    foreignKey: 'customer_id',
    as: 'healthMetricsHistory'
});
HealthMetricsHistory.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});

// Allergy associations
Customer.hasMany(Allergy, {
    foreignKey: 'customer_id',
    as: 'allergies'
});

Allergy.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
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
    OTP,
    Notification,
    Order,
    OrderItem,
    PharmaSalesRep,
    Brand,
    HealthMetrics,
    HealthRecord,
    HealthMetricsHistory,
    Allergy,
    News
};