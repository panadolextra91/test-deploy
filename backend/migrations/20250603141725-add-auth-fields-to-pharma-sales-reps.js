'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add authentication fields to pharma_sales_reps table
    await queryInterface.addColumn('pharma_sales_reps', 'password', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null for existing records
      after: 'email'
    });

    await queryInterface.addColumn('pharma_sales_reps', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'supplier_id'
    });

    await queryInterface.addColumn('pharma_sales_reps', 'reset_token', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'is_active'
    });

    await queryInterface.addColumn('pharma_sales_reps', 'reset_token_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'reset_token'
    });

    await queryInterface.addColumn('pharma_sales_reps', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      after: 'reset_token_expires'
    });

    await queryInterface.addColumn('pharma_sales_reps', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      after: 'created_at'
    });

    // Update existing records to set timestamps
    await queryInterface.sequelize.query(`
      UPDATE pharma_sales_reps 
      SET created_at = NOW(), updated_at = NOW() 
      WHERE created_at IS NULL OR updated_at IS NULL
    `);
  },

  async down (queryInterface, Sequelize) {
    // Remove authentication fields from pharma_sales_reps table
    await queryInterface.removeColumn('pharma_sales_reps', 'updated_at');
    await queryInterface.removeColumn('pharma_sales_reps', 'created_at');
    await queryInterface.removeColumn('pharma_sales_reps', 'reset_token_expires');
    await queryInterface.removeColumn('pharma_sales_reps', 'reset_token');
    await queryInterface.removeColumn('pharma_sales_reps', 'is_active');
    await queryInterface.removeColumn('pharma_sales_reps', 'password');
  }
};
