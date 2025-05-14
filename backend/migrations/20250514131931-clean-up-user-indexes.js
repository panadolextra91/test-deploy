'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting index cleanup...');
      
      // First, remove all duplicate indexes on username and email
      // Keep only the PRIMARY, users_username_unique, and users_email_unique indexes
      
      // Generate index names to remove (all the numbered duplicates)
      const indexesToRemove = [];
      
      // Add all the numbered username and email indexes to remove
      for (let i = 1; i <= 31; i++) {
        if (i > 1) {  // Keep the first 'username' and 'email' indexes if they exist
          indexesToRemove.push(`username_${i}`);
          indexesToRemove.push(`email_${i}`);
        }
      }
      
      // Also remove any other potential duplicates
      indexesToRemove.push(
        'username',
        'email',
        'users_username',
        'users_email'
      );
      
      console.log('Indexes to remove:', indexesToRemove);
      
      // Get all current indexes to verify what exists
      const [results] = await queryInterface.sequelize.query(
        'SHOW INDEX FROM users',
        { transaction }
      );
      
      const existingIndexes = [...new Set(results.map(r => r.Key_name))];
      console.log('Existing indexes:', existingIndexes);
      
      // Remove duplicate indexes
      for (const indexName of indexesToRemove) {
        if (existingIndexes.includes(indexName)) {
          console.log(`Removing index: ${indexName}`);
          await queryInterface.sequelize.query(
            `DROP INDEX \`${indexName}\` ON \`users\``,
            { transaction }
          );
        }
      }
      
      // Ensure the unique constraints exist
      try {
        await queryInterface.addConstraint('users', {
          fields: ['username'],
          type: 'unique',
          name: 'users_username_unique',
          transaction
        });
        console.log('Added unique constraint on username');
      } catch (err) {
        console.log('Unique constraint on username already exists or could not be added:', err.message);
      }
      
      try {
        await queryInterface.addConstraint('users', {
          fields: ['email'],
          type: 'unique',
          name: 'users_email_unique',
          transaction
        });
        console.log('Added unique constraint on email');
      } catch (err) {
        console.log('Unique constraint on email already exists or could not be added:', err.message);
      }
      
      await transaction.commit();
      console.log('Successfully cleaned up user indexes');
    } catch (error) {
      await transaction.rollback();
      console.error('Error cleaning up indexes:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as we can't reliably restore the duplicate indexes
    console.log('Warning: This migration cannot be cleanly rolled back');
    return;
  }
};
