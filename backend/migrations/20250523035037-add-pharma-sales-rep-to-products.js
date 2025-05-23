'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'pharma_sales_rep_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'pharma_sales_reps',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addIndex('products', ['pharma_sales_rep_id'], {
      name: 'products_pharma_sales_rep_fk'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('products', 'products_pharma_sales_rep_fk');
    await queryInterface.removeColumn('products', 'pharma_sales_rep_id');
  }
};
