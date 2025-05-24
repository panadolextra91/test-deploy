const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');

exports.createCustomer = async (req, res) => {
    const { name, phone, email } = req.body;
    try {
        const newCustomer = await Customer.create({ name, phone, email });
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Error creating customer', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        await customer.destroy();
        res.status(200).json({ message: 'Customer deleted' });
    } catch (error) {
        console.error('Error deleting customer', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};

exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    try {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        customer.name = name || customer.name;
        customer.phone = phone || customer.phone;
        customer.email = email || customer.email;
        await customer.save();
        res.status(200).json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ error: "Failed to update customer" });
    }
};

exports.getCustomerById = async (req, res) => {
    const { id } = req.params;
    try {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.status(200).json(customer);
    } catch (error) {
        console.error("Error retrieving customer by ID:", error);
        res.status(500).json({ error: "Failed to retrieve customer" });
    }
};

exports.getCustomerByPhone = async (req, res) => {
    const { phone } = req.params;
    try {
        const customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.status(200).json(customer);
    } catch (error) {
        console.error("Error retrieving customer by phone number:", error);
        res.status(500).json({ error: "Failed to retrieve customer" });
    }
};

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.status(200).json(customers);
    } catch (error) {
        console.error("Error retrieving all customers:", error);
        res.status(500).json({ error: "Failed to retrieve customers" });
    }
};

exports.setPassword = async (req, res) => {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
    }

    try {
        const customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await customer.update({ 
            password: hashedPassword,
            verified: true  // Set verified to true when setting password
        });

        res.status(200).json({ 
            success: true,
            message: 'Password set successfully',
            verified: true
        });
    } catch (error) {
        console.error('Error setting password:', error);
        res.status(500).json({ error: 'Failed to set password' });
    }
};