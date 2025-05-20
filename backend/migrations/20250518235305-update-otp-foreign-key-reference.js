'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First remove the existing foreign key constraint
    await queryInterface.removeConstraint('otps', 'otps_phone_fk');
    
    // Then add the constraint back with the correct reference
    await queryInterface.addConstraint('otps', {
      fields: ['phone'],
      type: 'foreign key',
      name: 'otps_phone_fk',
      references: {
        table: 'customers', // Updated to match the actual table name
        field: 'phone'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes if needed
    await queryInterface.removeConstraint('otps', 'otps_phone_fk');
    
    await queryInterface.addConstraint('otps', {
      fields: ['phone'],
      type: 'foreign key',
      name: 'otps_phone_fk',
      references: {
        table: 'customers',
        field: 'phone'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
};
