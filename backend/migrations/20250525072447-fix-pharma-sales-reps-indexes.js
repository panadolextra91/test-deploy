'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove all duplicate email indexes (keeping only the first one)
    const duplicateIndexes = [
      'email_2', 'email_3', 'email_4', 'email_5', 'email_6', 'email_7', 'email_8', 'email_9', 'email_10',
      'email_11', 'email_12', 'email_13', 'email_14', 'email_15', 'email_16', 'email_17', 'email_18'
    ];

    for (const indexName of duplicateIndexes) {
      try {
        await queryInterface.removeIndex('pharma_sales_reps', indexName);
        console.log(`Removed duplicate index: ${indexName}`);
      } catch (error) {
        console.log(`Index ${indexName} might not exist:`, error.message);
      }
    }

    // Remove existing foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint('pharma_sales_reps', 'pharma_sales_reps_ibfk_1');
      console.log('Removed existing foreign key constraint');
    } catch (error) {
      console.log('Foreign key constraint might not exist:', error.message);
    }

    // Add the correct foreign key constraint
    await queryInterface.addConstraint('pharma_sales_reps', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'pharma_sales_reps_supplier_id_fk',
      references: {
        table: 'suppliers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the foreign key constraint
    await queryInterface.removeConstraint('pharma_sales_reps', 'pharma_sales_reps_supplier_id_fk');
    
    // Note: We won't recreate the duplicate indexes as they were problematic
  }
};
