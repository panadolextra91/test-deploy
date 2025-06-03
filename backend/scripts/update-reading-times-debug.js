require('dotenv').config();
const News = require('../models/News');
const sequelize = require('../config/database'); // This should already be the Sequelize instance

async function updateReadingTimes() {
  try {
    console.log('🔗 Connecting to database...');
    
    // Log the actual connection details being used
    console.log('Connection details:', {
      database: sequelize.config.database,
      username: sequelize.config.username,
      host: sequelize.config.host,
      port: sequelize.config.port,
      dialect: sequelize.getDialect()
    });
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');
    
    console.log('📰 Fetching all news articles...');
    const articles = await News.findAll({
      order: [['id', 'ASC']]
    });
    
    if (articles.length === 0) {
      console.log('❌ No articles found in database');
      return;
    }
    
    console.log(`📊 Found ${articles.length} articles to update\n`);
    
    let updatedCount = 0;
    
    for (const article of articles) {
      const wordCount = article.content.split(/\s+/).length;
      const calculatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));
      
      if (article.reading_time !== calculatedReadingTime) {
        await article.update({ reading_time: calculatedReadingTime });
        updatedCount++;
        console.log(`✅ Updated article ${article.id}: ${article.title} (${calculatedReadingTime} min)`);
      }
    }
    
    console.log(`\n✨ Update complete! Updated ${updatedCount} out of ${articles.length} articles.`);
    
  } catch (error) {
    console.error('❌ Error updating reading times:', error.message);
    console.error('Error details:', error);
    
    if (error.original) {
      console.error('Original error:', error.original);
    }
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    
    if (error.name === 'SequelizeConnectionError' || error.original?.code === 'ECONNREFUSED') {
      console.error('\n🔴 Database Connection Error:');
      console.error('1. Make sure MySQL server is running');
      console.error('2. Verify your database credentials in .env file');
      console.error('3. Check if the database "pharmacy_management" exists');
      console.error('4. Try connecting manually with: mysql -u root -h 127.0.0.1 -P 3306 -p');
      console.error('5. If using MAMP, make sure MySQL server is started in MAMP');
    }
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit();
  }
}

// Run the function
updateReadingTimes();