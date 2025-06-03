'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pharmacies', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Phone number for pharmacy contact'
    });

    await queryInterface.addColumn('pharmacies', 'hours', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '8:00 AM - 10:00 PM',
      comment: 'Operating hours for the pharmacy'
    });

    await queryInterface.addColumn('pharmacies', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether the pharmacy is currently active'
    });

    console.log('✓ Added phone, hours, and is_active columns to pharmacies table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pharmacies', 'phone');
    await queryInterface.removeColumn('pharmacies', 'hours');
    await queryInterface.removeColumn('pharmacies', 'is_active');
    
    console.log('✓ Removed phone, hours, and is_active columns from pharmacies table');
  }
}; 