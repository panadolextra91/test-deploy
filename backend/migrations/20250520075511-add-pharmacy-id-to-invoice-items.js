'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the column as nullable
    await queryInterface.addColumn('invoice_items', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'price'
    });

    // Update existing records to set pharmacy_id based on the parent invoice
    await queryInterface.sequelize.query(`
      UPDATE invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      SET ii.pharmacy_id = i.pharmacy_id
    `);

    // Now alter the column to be NOT NULL and add foreign key
    await queryInterface.changeColumn('invoice_items', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'pharmacies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for better query performance
    await queryInterface.addIndex('invoice_items', ['pharmacy_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('invoice_items', ['pharmacy_id']);
    
    // Remove the column
    await queryInterface.removeColumn('invoice_items', 'pharmacy_id');
  }
};
