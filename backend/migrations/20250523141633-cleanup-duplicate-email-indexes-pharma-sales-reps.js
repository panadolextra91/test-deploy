'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop all duplicate email indexes (email_2 through email_61)
    // Keep only the original 'email' unique index
    
    const duplicateIndexes = [];
    for (let i = 2; i <= 61; i++) {
      duplicateIndexes.push(`email_${i}`);
    }
    
    console.log(`Removing ${duplicateIndexes.length} duplicate email indexes...`);
    
    for (const indexName of duplicateIndexes) {
      try {
        await queryInterface.removeIndex('pharma_sales_reps', indexName);
        console.log(`✓ Removed index: ${indexName}`);
      } catch (error) {
        console.log(`- Index ${indexName} may not exist:`, error.message);
      }
    }
    
    // Also remove the duplicate unique constraint indexes if they exist
    const duplicateConstraints = ['pharma_sales_reps_email'];
    for (const constraintName of duplicateConstraints) {
      try {
        await queryInterface.removeIndex('pharma_sales_reps', constraintName);
        console.log(`✓ Removed constraint index: ${constraintName}`);
      } catch (error) {
        console.log(`- Constraint index ${constraintName} may not exist:`, error.message);
      }
    }
    
    // Ensure we have the correct unique constraint on email
    try {
      await queryInterface.addConstraint('pharma_sales_reps', {
        fields: ['email'],
        type: 'unique',
        name: 'pharma_sales_reps_email_unique'
      });
      console.log('✓ Added proper unique constraint on email');
    } catch (error) {
      console.log('Email unique constraint may already exist:', error.message);
    }
    
    console.log('✅ Cleanup completed successfully');
  },

  async down (queryInterface, Sequelize) {
    // This rollback is not practical since we're removing duplicate/erroneous indexes
    // The original state was problematic, so we won't recreate the duplicates
    console.log('Rollback: No action needed - duplicate indexes should not be recreated');
  }
};
