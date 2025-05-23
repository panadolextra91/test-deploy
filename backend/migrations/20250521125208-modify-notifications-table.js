'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add the new columns
    await queryInterface.addColumn('notifications', 'recipient_type', {
      type: Sequelize.ENUM('user', 'customer'),
      allowNull: true // Temporarily allow null for existing records
    });

    await queryInterface.addColumn('notifications', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: true // Temporarily allow null for existing records
    });

    // Update existing records to use user_id as recipient_id and set recipient_type to 'user'
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET recipient_id = user_id, 
          recipient_type = 'user'
      WHERE recipient_id IS NULL
    `);

    // Make the new columns not null after data migration
    await queryInterface.changeColumn('notifications', 'recipient_type', {
      type: Sequelize.ENUM('user', 'customer'),
      allowNull: false
    });

    await queryInterface.changeColumn('notifications', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    // Add new notification types
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'order_placed', 
        'order_status_changed', 
        'order_cancelled', 
        'order_approved', 
        'order_denied'
      )
    `);

    // Remove the old user_id column
    await queryInterface.removeColumn('notifications', 'user_id');

    // Add new indexes
    await queryInterface.addIndex('notifications', ['recipient_type', 'recipient_id']);
  },

  async down(queryInterface, Sequelize) {
    // Add back the user_id column
    await queryInterface.addColumn('notifications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Migrate data back
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET user_id = recipient_id
      WHERE recipient_type = 'user'
    `);

    // Make user_id not null
    await queryInterface.changeColumn('notifications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Remove new columns
    await queryInterface.removeColumn('notifications', 'recipient_type');
    await queryInterface.removeColumn('notifications', 'recipient_id');

    // Revert notification types
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'order_placed', 
        'order_status_changed', 
        'order_cancelled'
      )
    `);

    // Remove new index
    await queryInterface.removeIndex('notifications', ['recipient_type', 'recipient_id']);
  }
};
