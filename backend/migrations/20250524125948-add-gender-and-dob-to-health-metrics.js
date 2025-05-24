'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('health_metrics', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true
    });

    await queryInterface.addColumn('health_metrics', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('health_metrics', 'gender');
    await queryInterface.removeColumn('health_metrics', 'date_of_birth');
  }
};
