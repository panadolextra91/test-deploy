'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.ENUM('order_placed', 'order_status_changed', 'order_cancelled', 'order_approved', 'order_denied', 'new_products_imported'),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.ENUM('order_placed', 'order_status_changed', 'order_cancelled', 'order_approved', 'order_denied'),
      allowNull: false
    });
  }
};
