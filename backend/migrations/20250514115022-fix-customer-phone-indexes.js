'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Remove any stray phone* indexes
    const indexes = await queryInterface.showIndex('Customers');
    for (const idx of indexes) {
      if (idx.name === 'phone' || idx.name.startsWith('phone_')) {
        await queryInterface.removeIndex('Customers', idx.name);
      }
    }

    // 2. Add uniq_phone only if it doesn't already exist
    const updated = await queryInterface.showIndex('Customers');
    const hasUniq = updated.some(idx => idx.name === 'uniq_phone');
    if (!hasUniq) {
      await queryInterface.addIndex('Customers', ['phone'], {
        name: 'uniq_phone',
        unique: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove uniq_phone if present
    const indexes = await queryInterface.showIndex('Customers');
    if (indexes.some(idx => idx.name === 'uniq_phone')) {
      await queryInterface.removeIndex('Customers', 'uniq_phone');
    }
  }
};
