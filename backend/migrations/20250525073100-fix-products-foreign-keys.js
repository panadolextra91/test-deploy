'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the missing supplier_id foreign key constraint
    // Since supplier_id is NOT NULL, we use CASCADE instead of SET NULL
    await queryInterface.addConstraint('products', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'products_supplier_id_fk',
      references: {
        table: 'suppliers',
        field: 'id'
      },
      onDelete: 'CASCADE',  // Changed from SET NULL to CASCADE since supplier_id is NOT NULL
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('products', 'products_supplier_id_fk');
  }
};
