'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1) Create the pharmacies table
        // 1) Create the pharmacies table
    await queryInterface.createTable('pharmacies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 1a) Seed a default pharmacy (so existing users can reference it)
    await queryInterface.bulkInsert('pharmacies', [{
      id: 1,
      name: 'Default Pharmacy',
      address: 'Default Address',
      contact_email: 'contact@example.com',
      created_at: new Date(),
      updated_at: new Date()
    }], {});


    // 2) Add pharmacy_id to users table
    await queryInterface.addColumn('users', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'pharmacies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1) Remove pharmacy_id from users
    await queryInterface.removeColumn('users', 'pharmacy_id');

    // 2) Drop the pharmacies table
    await queryInterface.dropTable('pharmacies');
  }
};
