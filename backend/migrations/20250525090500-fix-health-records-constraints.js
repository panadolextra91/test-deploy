'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the duplicate constraint that references 'customers' (lowercase)
    // Keep the one that references 'Customers' (uppercase) since that's the actual table name
    try {
      await queryInterface.removeConstraint('health_records', 'health_records_ibfk_3');
      console.log('Removed duplicate constraint health_records_ibfk_3');
    } catch (error) {
      console.log('Constraint health_records_ibfk_3 might not exist:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add the constraint if needed for rollback
    await queryInterface.addConstraint('health_records', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'health_records_ibfk_3',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
};
