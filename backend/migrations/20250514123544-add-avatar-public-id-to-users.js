'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'avatarPublicId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'avatar'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'avatarPublicId');
  }
};
