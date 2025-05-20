'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename avatar_public_id to avatarPublicId
    await queryInterface.renameColumn('users', 'avatar_public_id', 'avatarPublicId');
  },

  async down(queryInterface, Sequelize) {
    // Revert the change
    await queryInterface.renameColumn('users', 'avatarPublicId', 'avatar_public_id');
  }
}; 