'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notifications', 'is_resolved', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('notifications', 'resolved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('notifications', 'resolved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for better query performance
    await queryInterface.addIndex('notifications', ['is_resolved']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'is_resolved');
    await queryInterface.removeColumn('notifications', 'resolved_at');
    await queryInterface.removeColumn('notifications', 'resolved_by');
  }
};
