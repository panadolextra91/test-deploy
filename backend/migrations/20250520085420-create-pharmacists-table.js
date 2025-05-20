'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pharmacists', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      pharmacy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pharmacies',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add unique constraint on user_id
    await queryInterface.addConstraint('pharmacists', {
      fields: ['user_id'],
      type: 'unique',
      name: 'pharmacist_user_unique'
    });

    // Add index for pharmacy_id
    await queryInterface.addIndex('pharmacists', ['pharmacy_id'], {
      name: 'idx_pharmacist_pharmacy_id'
    });

    // Add index for license_number
    await queryInterface.addIndex('pharmacists', ['license_number'], {
      name: 'idx_pharmacist_license'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('pharmacists', 'pharmacist_user_unique');
    await queryInterface.removeIndex('pharmacists', 'idx_pharmacist_pharmacy_id');
    await queryInterface.removeIndex('pharmacists', 'idx_pharmacist_license');
    
    // Then drop the table
    await queryInterface.dropTable('pharmacists');
  }
};
