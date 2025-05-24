'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the only missing field - blood_pressure
    await queryInterface.addColumn('health_metrics', 'blood_pressure', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Update BMR data type from DECIMAL to INTEGER
    await queryInterface.changeColumn('health_metrics', 'bmr', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Update gender and date_of_birth constraints
    await queryInterface.changeColumn('health_metrics', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE'),
      allowNull: false
    });

    await queryInterface.changeColumn('health_metrics', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove blood_pressure column
    await queryInterface.removeColumn('health_metrics', 'blood_pressure');

    // Revert BMR back to DECIMAL
    await queryInterface.changeColumn('health_metrics', 'bmr', {
      type: Sequelize.DECIMAL(7, 2),
      allowNull: true
    });

    // Revert gender constraints
    await queryInterface.changeColumn('health_metrics', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true
    });

    // Revert date_of_birth constraints
    await queryInterface.changeColumn('health_metrics', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
}; 