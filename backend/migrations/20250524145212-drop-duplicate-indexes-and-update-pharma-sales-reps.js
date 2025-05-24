'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // List of all email indexes to drop
      const indexesToDrop = [
        'pharma_sales_reps_email_unique',
        'email_2', 'email_3', 'email_4', 'email_5', 'email_6', 'email_7', 'email_8', 'email_9', 'email_10',
        'email_11', 'email_12', 'email_13', 'email_14', 'email_15', 'email_16', 'email_17', 'email_18', 'email_19', 'email_20',
        'email_21', 'email_22', 'email_23', 'email_24', 'email_25', 'email_26', 'email_27', 'email_28', 'email_29', 'email_30',
        'email_31', 'email_32', 'email_33', 'email_34', 'email_35', 'email_36', 'email_37', 'email_38', 'email_39', 'email_40',
        'email_41', 'email_42', 'email_43', 'email_44', 'email_45', 'email_46', 'email_47', 'email_48', 'email_49', 'email_50',
        'email_51', 'email_52', 'email_53', 'email_54', 'email_55', 'email_56', 'email_57', 'email_58', 'email_59', 'email_60',
        'email_61'
      ];

      // Drop each duplicate index
      for (const indexName of indexesToDrop) {
        await queryInterface.removeIndex('pharma_sales_reps', indexName);
      }

      // We'll keep only the original 'email' index which is sufficient for uniqueness
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // In case of rollback, we'll recreate only one unique index since having multiple is unnecessary
      await queryInterface.addIndex('pharma_sales_reps', ['email'], {
        name: 'email',
        unique: true
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
