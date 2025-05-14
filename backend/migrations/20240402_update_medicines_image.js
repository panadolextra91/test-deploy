'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Describe the current table structure
    const table = await queryInterface.describeTable('medicines');
    
    // 1. Rename image_url → image if needed
    if (table.image_url && !table.image) {
      await queryInterface.renameColumn('medicines', 'image_url', 'image');
    }

    // 2. Change the column properties if image exists
    const updatedTable = await queryInterface.describeTable('medicines');
    if (updatedTable.image) {
      await queryInterface.changeColumn('medicines', 'image', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Describe the table again
    const table = await queryInterface.describeTable('medicines');

    // 1. Rename image → image_url if needed
    if (table.image && !table.image_url) {
      await queryInterface.renameColumn('medicines', 'image', 'image_url');
    }

    // 2. Revert the column properties if image_url exists
    const revertedTable = await queryInterface.describeTable('medicines');
    if (revertedTable.image_url) {
      await queryInterface.changeColumn('medicines', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  }
};
