'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the column as nullable
    await queryInterface.addColumn('invoices', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'customer_id'
    });

    // Set default value for existing records (using pharmacy_id = 1)
    await queryInterface.sequelize.query('UPDATE invoices SET pharmacy_id = 1');

    // Now alter the column to be NOT NULL and add foreign key
    await queryInterface.changeColumn('invoices', 'pharmacy_id', {
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
    await queryInterface.addIndex('invoices', ['pharmacy_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('invoices', ['pharmacy_id']);
    
    // Remove the column
    await queryInterface.removeColumn('invoices', 'pharmacy_id');
  }
};
