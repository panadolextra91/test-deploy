const bcrypt = require('bcrypt');
const PharmaSalesRep = require('../models/PharmaSalesRep');

async function addPasswordsToSalesReps() {
  try {
    console.log('🔄 Starting password update for sales reps...\n');

    // Find all sales reps without passwords
    const salesRepsWithoutPassword = await PharmaSalesRep.findAll({
      where: {
        password: null
      },
      attributes: ['id', 'name', 'email', 'password']
    });

    console.log(`Found ${salesRepsWithoutPassword.length} sales reps without passwords:\n`);

    if (salesRepsWithoutPassword.length === 0) {
      console.log('✅ All sales reps already have passwords set.');
      return;
    }

    // Display the sales reps that will be updated
    salesRepsWithoutPassword.forEach(rep => {
      console.log(`- ID: ${rep.id}, Name: ${rep.name}, Email: ${rep.email}`);
    });

    console.log('\n🔐 Hashing password "123" and updating records...\n');

    // Hash the password "123" once
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123', saltRounds);
    console.log(`Generated hash: ${hashedPassword}\n`);

    // Get all IDs to update
    const idsToUpdate = salesRepsWithoutPassword.map(rep => rep.id);
    
    // Update all records at once using raw SQL to avoid model hooks
    const [results] = await PharmaSalesRep.sequelize.query(
      `UPDATE pharma_sales_reps 
       SET password = ?, updated_at = NOW() 
       WHERE id IN (${idsToUpdate.map(() => '?').join(',')})`,
      {
        replacements: [hashedPassword, ...idsToUpdate],
        type: PharmaSalesRep.sequelize.QueryTypes.UPDATE
      }
    );

    console.log(`✅ Updated ${idsToUpdate.length} sales rep passwords in bulk\n`);

    // Verify the updates
    console.log('🔍 Verifying password updates...');
    const verificationReps = await PharmaSalesRep.findAll({
      where: {
        id: idsToUpdate
      },
      attributes: ['id', 'name', 'email', 'password']
    });

    let verifiedCount = 0;
    for (const rep of verificationReps) {
      if (rep.password) {
        // Test if the password "123" matches the hash
        const isValid = await bcrypt.compare('123', rep.password);
        if (isValid) {
          console.log(`✅ Verified: ${rep.name} - password hash is correct`);
          verifiedCount++;
        } else {
          console.log(`❌ Error: ${rep.name} - password hash verification failed`);
        }
      } else {
        console.log(`❌ Error: ${rep.name} - password is still null`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Sales reps found without passwords: ${salesRepsWithoutPassword.length}`);
    console.log(`- Successfully updated: ${idsToUpdate.length}`);
    console.log(`- Successfully verified: ${verifiedCount}`);
    console.log(`- Default password set to: "123"`);

    if (verifiedCount === salesRepsWithoutPassword.length) {
      console.log('\n🎉 All sales reps now have working passwords!');
      console.log('💡 They can now login with their email and password "123"');
      console.log('💡 Recommend they change their passwords after first login');
    } else {
      console.log('\n⚠️  Some updates may have failed. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Sales Rep Password Update Script');
console.log('=====================================\n');
addPasswordsToSalesReps(); 