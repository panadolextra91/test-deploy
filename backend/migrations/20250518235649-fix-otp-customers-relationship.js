'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove any existing foreign key constraints that might be causing issues
    try {
      await queryInterface.removeConstraint('otps', 'otps_phone_fk');
    } catch (error) {
      console.log('No existing otps_phone_fk constraint to remove');
    }

    // Add the foreign key constraint with the correct reference
    await queryInterface.addConstraint('otps', {
      fields: ['phone'],
      type: 'foreign key',
      name: 'otps_phone_fk',
      references: {
        table: 'Customers',
        field: 'phone'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the foreign key constraint
    await queryInterface.removeConstraint('otps', 'otps_phone_fk');
  }
};
