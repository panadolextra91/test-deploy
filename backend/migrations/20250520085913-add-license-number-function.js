'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // We'll use the queryInterface to execute raw SQL
    const { sequelize } = queryInterface;
    
    // First, drop existing function if it exists
    await sequelize.query('DROP FUNCTION IF EXISTS generate_pharmacist_license');
    
    // Create the function
    await sequelize.query(`
      CREATE FUNCTION generate_pharmacist_license() 
      RETURNS VARCHAR(20)
      DETERMINISTIC
      BEGIN
          DECLARE next_num INT;
          DECLARE license_num VARCHAR(20);
          
          -- Find the next available number
          SELECT IFNULL(MAX(CAST(SUBSTRING(license_number, 5) AS UNSIGNED)), 0) + 1 
          INTO next_num
          FROM pharmacists 
          WHERE license_number REGEXP '^PHA-[0-9]+$';
          
          -- Format as PHA-000001, PHA-000002, etc.
          SET license_num = CONCAT('PHA-', LPAD(next_num, 6, '0'));
          
          RETURN license_num;
      END
    `);
    
    // Drop existing trigger if it exists
    await sequelize.query('DROP TRIGGER IF EXISTS before_pharmacist_insert');
    
    // Create the trigger
    await sequelize.query(`
      CREATE TRIGGER before_pharmacist_insert
      BEFORE INSERT ON pharmacists
      FOR EACH ROW
      BEGIN
          IF NEW.license_number IS NULL THEN
              SET NEW.license_number = generate_pharmacist_license();
          END IF;
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the trigger and function
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_pharmacist_insert;
      DROP FUNCTION IF EXISTS generate_pharmacist_license;
    `);
  }
};
