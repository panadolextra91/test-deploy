'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Clean up remaining pharma_sales_reps duplicate email indexes
      // Keep only 'pharma_sales_reps_email_unique', remove email, email_29, email_30, email_31, email_32
      const pharmaEmailIndexesToDrop = ['email', 'email_29', 'email_30', 'email_31', 'email_32'];
      
      for (const indexName of pharmaEmailIndexesToDrop) {
        try {
          await queryInterface.removeIndex('pharma_sales_reps', indexName, { transaction });
          console.log(`Dropped pharma_sales_reps index: ${indexName}`);
        } catch (error) {
          console.log(`Index ${indexName} on pharma_sales_reps may not exist: ${error.message}`);
        }
      }

      // Clean up remaining users duplicate indexes
      // Keep only 'users_email_unique' and 'users_username_unique', remove username_25, email_25, username_26, email_26, email_27
      const userIndexesToDrop = ['username_25', 'email_25', 'username_26', 'email_26', 'email_27'];
      
      for (const indexName of userIndexesToDrop) {
        try {
          await queryInterface.removeIndex('users', indexName, { transaction });
          console.log(`Dropped users index: ${indexName}`);
        } catch (error) {
          console.log(`Index ${indexName} on users may not exist: ${error.message}`);
        }
      }

      await transaction.commit();
      console.log('Successfully cleaned up remaining duplicate constraints');
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