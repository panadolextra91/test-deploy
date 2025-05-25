const News = require('../models/News');
const sequelize = require('../config/database');

async function updateReadingTimes() {
  try {
    console.log('🔗 Connecting to database...');
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
      
      // Only update if reading time is different
      if (article.reading_time !== calculatedReadingTime) {
        await article.update({ reading_time: calculatedReadingTime });
        updatedCount++;
        
        console.log(`📝 Updated: "${article.title.substring(0, 50)}..."`);
        console.log(`   Words: ${wordCount} | Old: ${article.reading_time}min | New: ${calculatedReadingTime}min`);
        console.log(`   Category: ${article.category} | Featured: ${article.is_feature ? 'Yes' : 'No'}\n`);
      } else {
        console.log(`✅ Skipped: "${article.title.substring(0, 50)}..." (already correct: ${calculatedReadingTime}min)`);
      }
    }
    
    console.log(`\n🎉 Update completed!`);
    console.log(`📊 Total articles: ${articles.length}`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`✅ Already correct: ${articles.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error updating reading times:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n🔌 Closing database connection...');
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  updateReadingTimes();
}

module.exports = updateReadingTimes; 