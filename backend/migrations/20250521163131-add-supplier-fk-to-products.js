'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('products', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'products_supplier_fk',
      references: {
        table: 'suppliers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('products', 'products_supplier_fk');
  }
};
