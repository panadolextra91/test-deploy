'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the column as nullable
    await queryInterface.addColumn('locations', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'description'
    });

    // Set default value for existing records (using pharmacy_id = 1)
    await queryInterface.sequelize.query('UPDATE locations SET pharmacy_id = 1');

    // Now alter the column to be NOT NULL and add foreign key
    await queryInterface.changeColumn('locations', 'pharmacy_id', {
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
    await queryInterface.addIndex('locations', ['pharmacy_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('locations', ['pharmacy_id']);
    
    // Remove the column
    await queryInterface.removeColumn('locations', 'pharmacy_id');
  }
};
