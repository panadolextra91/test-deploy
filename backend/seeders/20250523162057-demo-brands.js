'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('brands', [
      {
        name: 'Pfizer',
        manufacturer: 'Pfizer Inc.',
        country: 'United States',
        description: 'American multinational pharmaceutical and biotechnology corporation',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Johnson & Johnson',
        manufacturer: 'Johnson & Johnson',
        country: 'United States',
        description: 'American multinational corporation founded in 1886',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Novartis',
        manufacturer: 'Novartis AG',
        country: 'Switzerland',
        description: 'Swiss multinational pharmaceutical corporation',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Roche',
        manufacturer: 'F. Hoffmann-La Roche AG',
        country: 'Switzerland',
        description: 'Swiss multinational healthcare company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'GSK',
        manufacturer: 'GlaxoSmithKline plc',
        country: 'United Kingdom',
        description: 'British multinational pharmaceutical and biotechnology company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sanofi',
        manufacturer: 'Sanofi S.A.',
        country: 'France',
        description: 'French multinational pharmaceutical and healthcare company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'AstraZeneca',
        manufacturer: 'AstraZeneca plc',
        country: 'United Kingdom',
        description: 'British-Swedish multinational pharmaceutical and biotechnology company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Merck',
        manufacturer: 'Merck & Co., Inc.',
        country: 'United States',
        description: 'American multinational pharmaceutical company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bayer',
        manufacturer: 'Bayer AG',
        country: 'Germany',
        description: 'German multinational pharmaceutical and biotechnology company',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Abbott',
        manufacturer: 'Abbott Laboratories',
        country: 'United States',
        description: 'American multinational medical devices and health care company',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('brands', null, {});
  }
};
