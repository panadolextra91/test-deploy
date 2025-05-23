'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🧹 Starting comprehensive cleanup of brand constraints...');

      // Get all indexes on the brands table
      const indexes = await queryInterface.sequelize.query(
        `SHOW INDEX FROM brands WHERE Column_name = 'name' AND Non_unique = 0 AND Key_name != 'PRIMARY'`,
        { 
          type: Sequelize.QueryTypes.SELECT,
          raw: true 
        }
      );

      console.log(`Found ${indexes.length} unique constraints on 'name' column`);

      // Drop all unique constraints on the name column
      for (const index of indexes) {
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE brands DROP INDEX \`${index.Key_name}\``,
            { type: Sequelize.QueryTypes.RAW }
          );
          console.log(`✅ Dropped constraint: ${index.Key_name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop ${index.Key_name}: ${error.message}`);
        }
      }

      // Add one final, clean unique constraint
      await queryInterface.addConstraint('brands', {
        fields: ['name'],
        type: 'unique',
        name: 'uk_brands_name'
      });

      console.log('✅ Added final unique constraint: uk_brands_name');
      console.log('🎉 Brand constraint cleanup completed!');

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove our clean constraint
    await queryInterface.removeConstraint('brands', 'uk_brands_name');
    
    // Add back a simple constraint
    await queryInterface.addConstraint('brands', {
      fields: ['name'],
      type: 'unique',
      name: 'name'
    });
  }
};
