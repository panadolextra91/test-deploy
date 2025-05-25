'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the existing constraint that references 'customers' (lowercase)
    await queryInterface.removeConstraint('health_records', 'health_records_ibfk_2');
    
    // Add the correct constraint that references 'Customers' (uppercase)
    await queryInterface.addConstraint('health_records', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'health_records_customer_id_fk',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the new constraint
    await queryInterface.removeConstraint('health_records', 'health_records_customer_id_fk');
    
    // Re-add the old constraint for rollback
    await queryInterface.addConstraint('health_records', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'health_records_ibfk_2',
      references: {
        table: 'customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
};
