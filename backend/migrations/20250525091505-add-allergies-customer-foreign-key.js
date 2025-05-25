'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint for customer_id
    // Using CASCADE since customer_id is NOT NULL
    await queryInterface.addConstraint('allergies', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'allergies_customer_id_fk',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'CASCADE',  // Use CASCADE since customer_id is NOT NULL
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('allergies', 'allergies_customer_id_fk');
  }
};
