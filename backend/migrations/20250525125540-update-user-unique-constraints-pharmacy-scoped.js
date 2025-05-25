'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove existing global unique constraints
    await queryInterface.removeIndex('users', 'users_username_unique');
    await queryInterface.removeIndex('users', 'users_email_unique');
    
    // Add new composite unique constraints (username + pharmacy_id, email + pharmacy_id)
    await queryInterface.addIndex('users', {
      fields: ['username', 'pharmacy_id'],
      unique: true,
      name: 'users_username_pharmacy_unique'
    });
    
    await queryInterface.addIndex('users', {
      fields: ['email', 'pharmacy_id'],
      unique: true,
      name: 'users_email_pharmacy_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove composite unique constraints
    await queryInterface.removeIndex('users', 'users_username_pharmacy_unique');
    await queryInterface.removeIndex('users', 'users_email_pharmacy_unique');
    
    // Restore original global unique constraints
    await queryInterface.addIndex('users', {
      fields: ['username'],
      unique: true,
      name: 'users_username_unique'
    });
    
    await queryInterface.addIndex('users', {
      fields: ['email'],
      unique: true,
      name: 'users_email_unique'
    });
  }
};
