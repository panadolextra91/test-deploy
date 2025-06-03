'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pharmacies', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
      comment: 'Latitude coordinate for pharmacy location'
    });

    await queryInterface.addColumn('pharmacies', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
      comment: 'Longitude coordinate for pharmacy location'
    });

    console.log('✓ Added latitude and longitude columns to pharmacies table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pharmacies', 'latitude');
    await queryInterface.removeColumn('pharmacies', 'longitude');
    
    console.log('✓ Removed latitude and longitude columns from pharmacies table');
  }
}; 