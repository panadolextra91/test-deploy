'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create carts table
    await queryInterface.createTable('carts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'One cart per customer - unique constraint enforced'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create cart_items table
    await queryInterface.createTable('cart_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      cart_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'carts',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'medicines',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        },
        comment: 'Quantity of medicine in cart'
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per unit when item was added to cart'
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Calculated as quantity × unit_price'
      },
      is_selected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether item is selected for checkout'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for carts table
    await queryInterface.addIndex('carts', ['customer_id'], {
      name: 'idx_carts_customer_unique',
      unique: true
    });

    // Add indexes for cart_items table
    await queryInterface.addIndex('cart_items', ['cart_id'], {
      name: 'idx_cart_items_cart'
    });

    await queryInterface.addIndex('cart_items', ['medicine_id'], {
      name: 'idx_cart_items_medicine'
    });

    await queryInterface.addIndex('cart_items', ['cart_id', 'medicine_id'], {
      name: 'idx_cart_items_cart_medicine',
      unique: true // Prevent duplicate medicine in same cart
    });

    await queryInterface.addIndex('cart_items', ['cart_id', 'is_selected'], {
      name: 'idx_cart_items_cart_selected'
    });

    console.log('✓ Created carts and cart_items tables with indexes and constraints');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('carts');
    
    console.log('✓ Dropped carts and cart_items tables');
  }
};
