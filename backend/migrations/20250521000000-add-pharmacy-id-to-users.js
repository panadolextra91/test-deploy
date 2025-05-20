'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if pharmacy_id column exists
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = '${queryInterface.sequelize.config.database}' 
       AND table_name = 'Users' 
       AND column_name = 'pharmacy_id'`
    );

    if (columns[0].length === 0) {
      // Add the column if it doesn't exist
      await queryInterface.addColumn('Users', 'pharmacy_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // Temporarily allow null for migration
        references: {
          model: 'Pharmacies',
          key: 'id'
        }
      });
    }

    // Check if UserPharmacies table exists
    const tables = await queryInterface.sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = '${queryInterface.sequelize.config.database}' 
       AND table_name = 'UserPharmacies'`
    );

    if (tables[0].length > 0) {
      // Update existing users with their pharmacy from UserPharmacy
      await queryInterface.sequelize.query(`
        UPDATE Users u
        INNER JOIN UserPharmacies up ON u.id = up.user_id
        SET u.pharmacy_id = up.pharmacy_id
        WHERE u.pharmacy_id IS NULL
      `);
    }

    // Make the column not null after data migration
    await queryInterface.changeColumn('Users', 'pharmacy_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Pharmacies',
        key: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'pharmacy_id');
  }
}; 