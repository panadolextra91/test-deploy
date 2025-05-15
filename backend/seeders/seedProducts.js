'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = [];
    const nextYear = new Date().getFullYear() + 1;

    for (let supplierId = 1; supplierId <= 10; supplierId++) {
      for (let i = 1; i <= 10; i++) {
        products.push({
          supplier_id: supplierId,
          brand: `Brand ${i}`,
          name: `Product ${i} of Supplier ${supplierId}`,
          price: parseFloat((i * 5 + supplierId).toFixed(2)),
          expiry_date: new Date(nextYear, (i % 12), 1),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};
