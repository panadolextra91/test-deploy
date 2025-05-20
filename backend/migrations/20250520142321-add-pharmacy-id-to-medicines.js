'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the column as nullable
    await queryInterface.addColumn('medicines', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'location_id'
    });

    // Update all existing records to have pharmacy_id = 1
    await queryInterface.sequelize.query('UPDATE medicines SET pharmacy_id = 1');

    // Now alter the column to be NOT NULL
    await queryInterface.changeColumn('medicines', 'pharmacy_id', {
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
    await queryInterface.addIndex('medicines', ['pharmacy_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('medicines', ['pharmacy_id']);
    
    // Remove the column
    await queryInterface.removeColumn('medicines', 'pharmacy_id');
  }
};
