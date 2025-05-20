'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_pharmacies', {
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
        onUpdate: 'CASCADE',
      },
      pharmacy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pharmacies',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    // Add unique constraint
    await queryInterface.addConstraint('user_pharmacies', {
      fields: ['user_id', 'pharmacy_id'],
      type: 'unique',
      name: 'user_pharmacy_unique'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('user_pharmacies', ['user_id'], {
      name: 'idx_user_pharmacy_user_id'
    });

    await queryInterface.addIndex('user_pharmacies', ['pharmacy_id'], {
      name: 'idx_user_pharmacy_pharmacy_id'
    });

    // Add index for is_default to optimize default pharmacy lookups
    await queryInterface.addIndex('user_pharmacies', ['user_id', 'is_default'], {
      name: 'idx_user_pharmacy_default',
      where: { is_default: true }
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('user_pharmacies', 'idx_user_pharmacy_user_id');
    await queryInterface.removeIndex('user_pharmacies', 'idx_user_pharmacy_pharmacy_id');
    await queryInterface.removeIndex('user_pharmacies', 'idx_user_pharmacy_default');
    
    // Then drop the table
    await queryInterface.dropTable('user_pharmacies');
  }
};
