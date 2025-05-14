'use strict';
module.exports = {
  up: async (qi, Sequelize) => {
    // Add the new column
    await qi.addColumn('medicines', 'imagePublicId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (qi) => {
    // Remove it on rollback
    await qi.removeColumn('medicines', 'imagePublicId');
  }
};
