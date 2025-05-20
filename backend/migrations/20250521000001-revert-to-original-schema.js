'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First remove duplicate unique constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      DROP INDEX username_2,
      DROP INDEX email_2,
      DROP INDEX username_3,
      DROP INDEX email_3,
      DROP INDEX username_4,
      DROP INDEX email_4,
      DROP INDEX username_5,
      DROP INDEX email_5
    `);

    // Remove duplicate foreign key
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      DROP FOREIGN KEY Users_pharmacy_id_foreign_idx
    `);

    // Drop new tables
    await queryInterface.dropTable('pharmacists');
    await queryInterface.dropTable('user_pharmacies');

    // Remove pharmacy_id from Users
    await queryInterface.removeColumn('users', 'pharmacy_id');

    // Restore original Users table structure
    await queryInterface.changeColumn('users', 'name', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'pharmacist'),
      allowNull: false,
      defaultValue: 'pharmacist'
    });
  },

  async down(queryInterface, Sequelize) {
    // This is a revert migration, so down() would recreate the new schema
    // But we don't want to do that, so we'll leave it empty
  }
}; 