'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // List of tables to check and remove pharmacy_id from
    const tables = [
      'medicines',
      'suppliers',
      'products',
      'invoices',
      'invoice_items'
    ];

    for (const table of tables) {
      // Check if pharmacy_id exists in the table
      const tableInfo = await queryInterface.describeTable(table);
      if (tableInfo.pharmacy_id) {
        // Remove foreign key constraint if it exists
        try {
          await queryInterface.removeConstraint(table, `${table}_pharmacy_id_foreign_idx`);
        } catch (error) {
          console.log(`No foreign key constraint found for ${table}`);
        }

        // Remove the pharmacy_id column
        await queryInterface.removeColumn(table, 'pharmacy_id');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // List of tables to add pharmacy_id back to
    const tables = [
      'medicines',
      'suppliers',
      'products',
      'invoices',
      'invoice_items'
    ];

    for (const table of tables) {
      // Add pharmacy_id column back
      await queryInterface.addColumn(table, 'pharmacy_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'pharmacies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  }
}; 