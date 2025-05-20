'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if pharmacy_id exists before trying to remove it
      const tableInfo = await queryInterface.describeTable('users');
      
      // 1. Remove foreign key constraint for pharmacy_id if it exists
      const getForeignKeyQuery = `
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'pharmacy_id' 
        AND REFERENCED_TABLE_NAME IS NOT NULL`;
        
      const [results] = await queryInterface.sequelize.query(getForeignKeyQuery, { transaction });
      
      if (results.length > 0) {
        const fkName = results[0].CONSTRAINT_NAME;
        await queryInterface.removeConstraint('users', fkName, { transaction });
      }
      
      // 2. Remove pharmacy_id column if it exists
      if (tableInfo.pharmacy_id) {
        await queryInterface.removeColumn('users', 'pharmacy_id', { transaction });
      }
      
      // 3. Add is_active column if it doesn't exist
      if (!tableInfo.is_active) {
        await queryInterface.addColumn(
          'users',
          'is_active',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          { transaction }
        );
      }
      
      // 4. Rename avatarPublicId to avatar_public_id if it exists
      if (tableInfo.avatarPublicId) {
        await queryInterface.renameColumn('users', 'avatarPublicId', 'avatar_public_id', { transaction });
      }
      
      // 5. Add updated_at column if it doesn't exist
      if (!tableInfo.updated_at) {
        await queryInterface.addColumn(
          'users',
          'updated_at',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          { transaction }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add back pharmacy_id column
      await queryInterface.addColumn(
        'users',
        'pharmacy_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true, // Make it nullable for rollback safety
          references: {
            model: 'pharmacies',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        { transaction }
      );
      
      // 2. Remove is_active column if it exists
      const tableInfo = await queryInterface.describeTable('users');
      if (tableInfo.is_active) {
        await queryInterface.removeColumn('users', 'is_active', { transaction });
      }
      
      // 3. Rename back avatar_public_id to avatarPublicId if it exists
      if (tableInfo.avatar_public_id) {
        await queryInterface.renameColumn('users', 'avatar_public_id', 'avatarPublicId', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
