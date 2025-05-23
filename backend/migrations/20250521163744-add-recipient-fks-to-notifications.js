'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key for user recipients
    await queryInterface.addConstraint('notifications', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'notifications_user_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      where: {
        recipient_type: 'user'
      }
    });

    // Add foreign key for customer recipients
    await queryInterface.addConstraint('notifications', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'notifications_customer_fk',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      where: {
        recipient_type: 'customer'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('notifications', 'notifications_user_fk');
    await queryInterface.removeConstraint('notifications', 'notifications_customer_fk');
  }
};
