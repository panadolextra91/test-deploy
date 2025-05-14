'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check existing columns
    const table = await queryInterface.describeTable('Users');
    if (!table.avatar) {
      await queryInterface.addColumn('Users', 'avatar', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Users');
    if (table.avatar) {
      await queryInterface.removeColumn('Users', 'avatar');
    }
  }
};
