'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting comprehensive database cleanup...');

      // 1. Fix brands table - rename column and remove duplicate index
      console.log('1. Fixing brands table...');
      
      // Rename image_public_id to imagePublicId to match model
      await queryInterface.renameColumn('brands', 'image_public_id', 'imagePublicId', { transaction });
      
      // Remove duplicate index on name (keep uk_brands_name, remove brands_name)
      try {
        await queryInterface.removeIndex('brands', 'brands_name', { transaction });
        console.log('Removed duplicate brands_name index');
      } catch (error) {
        console.log('brands_name index may not exist:', error.message);
      }

      // 2. Fix Customers table - remove duplicate unique constraint
      console.log('2. Fixing Customers table...');
      
      // The model has both field-level unique and indexes array - this could create duplicates
      // We'll keep the named constraint and remove any unnamed duplicates
      try {
        await queryInterface.removeIndex('Customers', 'phone', { transaction });
        console.log('Removed duplicate phone index from Customers');
      } catch (error) {
        console.log('Duplicate phone index may not exist:', error.message);
      }

      // 3. Fix invoices table - remove duplicate foreign key constraints
      console.log('3. Fixing invoices table...');
      
      // Remove the duplicate constraint (keep invoices_ibfk_1, remove fk_invoices_customers)
      try {
        await queryInterface.removeConstraint('invoices', 'fk_invoices_customers', { transaction });
        console.log('Removed duplicate fk_invoices_customers constraint');
      } catch (error) {
        console.log('fk_invoices_customers constraint may not exist:', error.message);
      }

      // 4. Fix orders table - remove duplicate foreign key constraints
      console.log('4. Fixing orders table...');
      
      // Remove duplicate customer_id constraints (keep orders_ibfk_1 to Customers, remove orders_ibfk_59)
      try {
        await queryInterface.removeConstraint('orders', 'orders_ibfk_59', { transaction });
        console.log('Removed duplicate orders_ibfk_59 constraint');
      } catch (error) {
        console.log('orders_ibfk_59 constraint may not exist:', error.message);
      }

      // 5. Fix otps table - rename timestamp columns to match model expectations
      console.log('5. Fixing otps table...');
      
      // Rename camelCase timestamps to underscored (model expects underscored: true)
      await queryInterface.renameColumn('otps', 'createdAt', 'created_at', { transaction });
      await queryInterface.renameColumn('otps', 'updatedAt', 'updated_at', { transaction });
      
      // Rename camelCase fields to underscored
      await queryInterface.renameColumn('otps', 'expiresAt', 'expires_at', { transaction });
      await queryInterface.renameColumn('otps', 'isUsed', 'is_used', { transaction });

      await transaction.commit();
      console.log('✅ Comprehensive database cleanup completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during database cleanup:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Reverting comprehensive database cleanup...');

      // Revert otps table changes
      await queryInterface.renameColumn('otps', 'created_at', 'createdAt', { transaction });
      await queryInterface.renameColumn('otps', 'updated_at', 'updatedAt', { transaction });
      await queryInterface.renameColumn('otps', 'expires_at', 'expiresAt', { transaction });
      await queryInterface.renameColumn('otps', 'is_used', 'isUsed', { transaction });

      // Revert brands table changes
      await queryInterface.renameColumn('brands', 'imagePublicId', 'image_public_id', { transaction });

      // Note: We don't recreate the duplicate constraints as they were problematic
      console.log('Note: Duplicate constraints were not recreated as they were causing issues');

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }
};
