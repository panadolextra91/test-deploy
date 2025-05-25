'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Clean up pharma_sales_reps duplicate email indexes
      // Keep only the first 'email' index, remove email_2 through email_28
      const pharmaEmailIndexesToDrop = [];
      for (let i = 2; i <= 28; i++) {
        pharmaEmailIndexesToDrop.push(`email_${i}`);
      }
      
      for (const indexName of pharmaEmailIndexesToDrop) {
        try {
          await queryInterface.removeIndex('pharma_sales_reps', indexName, { transaction });
          console.log(`Dropped pharma_sales_reps index: ${indexName}`);
        } catch (error) {
          console.log(`Index ${indexName} on pharma_sales_reps may not exist: ${error.message}`);
        }
      }

      // Clean up users duplicate email indexes
      // Keep only 'users_email_unique', remove email, email_2 through email_24
      const userEmailIndexesToDrop = ['email'];
      for (let i = 2; i <= 24; i++) {
        userEmailIndexesToDrop.push(`email_${i}`);
      }
      
      for (const indexName of userEmailIndexesToDrop) {
        try {
          await queryInterface.removeIndex('users', indexName, { transaction });
          console.log(`Dropped users email index: ${indexName}`);
        } catch (error) {
          console.log(`Index ${indexName} on users may not exist: ${error.message}`);
        }
      }

      // Clean up users duplicate username indexes
      // Keep only 'users_username_unique', remove username, username_2 through username_24
      const userUsernameIndexesToDrop = ['username'];
      for (let i = 2; i <= 24; i++) {
        userUsernameIndexesToDrop.push(`username_${i}`);
      }
      
      for (const indexName of userUsernameIndexesToDrop) {
        try {
          await queryInterface.removeIndex('users', indexName, { transaction });
          console.log(`Dropped users username index: ${indexName}`);
        } catch (error) {
          console.log(`Index ${indexName} on users may not exist: ${error.message}`);
        }
      }

      await transaction.commit();
      console.log('Successfully cleaned up all duplicate constraints');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: We don't recreate the duplicate indexes in rollback
    // as they were duplicates and shouldn't exist
    console.log('Rollback: Duplicate indexes were not recreated as they were unnecessary duplicates');
  }
}; 