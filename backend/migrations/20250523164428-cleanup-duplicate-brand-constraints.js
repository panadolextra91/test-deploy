'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the current table info to see all constraints
    const [tableInfo] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM brands WHERE Key_name LIKE 'name%'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Drop all name-related unique constraints
    const constraintsToRemove = [
      'name', 'name_2', 'name_3', 'name_4', 'name_5', 'name_6', 'name_7', 'name_8', 'name_9', 'name_10',
      'name_11', 'name_12', 'name_13', 'name_14', 'name_15', 'name_16', 'name_17', 'name_18', 'name_19', 'name_20', 'name_21'
    ];

    for (const constraintName of constraintsToRemove) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE brands DROP INDEX \`${constraintName}\``,
          { type: Sequelize.QueryTypes.RAW }
        );
        console.log(`✅ Dropped constraint: ${constraintName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${constraintName}: ${error.message}`);
      }
    }

    // Add one clean unique constraint
    await queryInterface.addConstraint('brands', {
      fields: ['name'],
      type: 'unique',
      name: 'brands_name_unique'
    });

    console.log('✅ Added clean unique constraint: brands_name_unique');
  },

  async down(queryInterface, Sequelize) {
    // Remove the clean constraint
    await queryInterface.removeConstraint('brands', 'brands_name_unique');
    
    // Re-add the original constraint (just one)
    await queryInterface.addConstraint('brands', {
      fields: ['name'],
      type: 'unique',
      name: 'name'
    });
  }
};
