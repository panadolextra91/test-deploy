const { Customer } = require('../models');
const sequelize = require('../config/database');

const customers = [
  { name: 'John Doe', phone: '1234567890', email: null },
  { name: 'Jane Smith', phone: '2345678901', email: null },
  { name: 'Robert Johnson', phone: '3456789012', email: null },
  { name: 'Emily Davis', phone: '4567890123', email: null },
  { name: 'Michael Brown', phone: '5678901234', email: null },
  { name: 'Sarah Wilson', phone: '6789012345', email: null },
  { name: 'David Taylor', phone: '7890123456', email: null },
  { name: 'Jessica Anderson', phone: '8901234567', email: null },
  { name: 'Thomas Thomas', phone: '9012345678', email: null },
  { name: 'Lisa Jackson', phone: '0123456789', email: null },
];

const seedCustomers = async () => {
  try {
    await sequelize.sync();
    await Customer.bulkCreate(customers);
    console.log('Successfully seeded customers');
  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    await sequelize.close();
  }
};

seedCustomers();
