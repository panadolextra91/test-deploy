'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the conflicting foreign key constraints
    // Both constraints point to the same recipient_id column but reference different tables
    // This causes MySQL to validate against both tables regardless of recipient_type
    
    try {
      // Remove foreign key constraint for customers
      await queryInterface.removeConstraint('notifications', 'notifications_customer_fk');
    } catch (error) {
      console.log('Customer FK constraint may not exist:', error.message);
    }
    
    try {
      // Remove foreign key constraint for users
      await queryInterface.removeConstraint('notifications', 'notifications_user_fk');
    } catch (error) {
      console.log('User FK constraint may not exist:', error.message);
    }
    
    try {
      // Remove the associated index for customer FK
      await queryInterface.removeIndex('notifications', 'notifications_customer_fk');
    } catch (error) {
      console.log('Customer FK index may not exist:', error.message);
    }
    
    console.log('Successfully removed conflicting foreign key constraints from notifications table');
  },

  async down (queryInterface, Sequelize) {
    // Re-add the foreign key constraints if needed (rollback)
    // Note: This rollback will recreate the same conflict, so use with caution
    
    // Add customer foreign key constraint
    await queryInterface.addConstraint('notifications', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'notifications_customer_fk',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Add user foreign key constraint
    await queryInterface.addConstraint('notifications', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'notifications_user_fk', 
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    console.log('Rollback: Re-added foreign key constraints to notifications table');
  }
};
