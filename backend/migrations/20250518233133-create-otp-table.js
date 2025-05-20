'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('otps', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    await queryInterface.addIndex('otps', ['phone']);
    
    // Add foreign key constraint to ensure phone exists in customers table
    await queryInterface.addConstraint('otps', {
      fields: ['phone'],
      type: 'foreign key',
      name: 'otps_phone_fk',
      references: {
        table: 'customers', // Reference to customers table
        field: 'phone'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint('otps', 'otps_phone_fk');
    // Then drop the table
    await queryInterface.dropTable('otps');
  }
};
