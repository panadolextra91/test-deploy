'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the column as nullable
    await queryInterface.addColumn('products', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'expiry_date'
    });

    // Set default value for existing records (using pharmacy_id = 1)
    await queryInterface.sequelize.query('UPDATE products SET pharmacy_id = 1');

    // Now alter the column to be NOT NULL and add foreign key
    await queryInterface.changeColumn('products', 'pharmacy_id', {
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
    await queryInterface.addIndex('products', ['pharmacy_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('products', ['pharmacy_id']);
    
    // Remove the column
    await queryInterface.removeColumn('products', 'pharmacy_id');
  }
};
