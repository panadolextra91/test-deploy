'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('news', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('Live Healthily', 'Moms and Babies', 'Nutrition', 'Sex Education', 'Beauty', 'Hospitals'),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      image_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      reading_time: {
        type: Sequelize.INTEGER,  // in minutes
        allowNull: false,
        defaultValue: 1
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_feature: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('news', ['category']);
    await queryInterface.addIndex('news', ['is_feature']);
    await queryInterface.addIndex('news', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('news');
  }
};
