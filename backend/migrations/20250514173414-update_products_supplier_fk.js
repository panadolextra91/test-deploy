'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1) Ensure supplier_id is NOT NULL
    await queryInterface.changeColumn('products', 'supplier_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // 2) Add a new FK with ON DELETE CASCADE (non-nullable)
    await queryInterface.addConstraint('products', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'products_supplier_fk',
      references: {
        table: 'suppliers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1) Remove the cascade FK
    await queryInterface.removeConstraint('products', 'products_supplier_fk');

    // 2) Revert supplier_id to allow NULL
    await queryInterface.changeColumn('products', 'supplier_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};
