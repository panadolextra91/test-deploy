'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if is_active column exists before removing it
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.is_active) {
      await queryInterface.removeColumn('users', 'is_active');
    }

    // Add pharmacy_id column without foreign key constraint first
    await queryInterface.addColumn('users', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // Update all existing users to use pharmacy_id 1
    await queryInterface.sequelize.query(
      'UPDATE users SET pharmacy_id = 1 WHERE pharmacy_id IS NULL',
      {
        type: queryInterface.sequelize.QueryTypes.UPDATE
      }
    );

    // Now add the foreign key constraint
    await queryInterface.addConstraint('users', {
      fields: ['pharmacy_id'],
      type: 'foreign key',
      name: 'users_pharmacy_id_foreign_idx',
      references: {
        table: 'pharmacies',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('users', 'users_pharmacy_id_foreign_idx');

    // Remove pharmacy_id column
    await queryInterface.removeColumn('users', 'pharmacy_id');

    // Add back is_active column
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  }
}; 