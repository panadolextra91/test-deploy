require('dotenv').config({ path: '../.env' });
const { Pharmacy } = require('../models');

// Manual coordinate update function
const updatePharmacyCoordinates = async (pharmacyId, latitude, longitude) => {
  try {
    const pharmacy = await Pharmacy.findByPk(pharmacyId);
    if (!pharmacy) {
      console.log(`❌ Pharmacy with ID ${pharmacyId} not found`);
      return false;
    }

    await pharmacy.update({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    console.log(`✅ Updated pharmacy "${pharmacy.name}" with coordinates:`);
    console.log(`   Latitude: ${latitude}`);
    console.log(`   Longitude: ${longitude}`);
    console.log(`   Address: ${pharmacy.address}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating pharmacy coordinates:', error);
    return false;
  }
};

// List all pharmacies without coordinates
const listPharmaciesWithoutCoordinates = async () => {
  try {
    const pharmacies = await Pharmacy.findAll({
      where: {
        latitude: null
      },
      attributes: ['id', 'name', 'address']
    });

    if (pharmacies.length === 0) {
      console.log('✅ All pharmacies have coordinates!');
      return;
    }

    console.log(`📍 Found ${pharmacies.length} pharmacies without coordinates:\n`);
    pharmacies.forEach((pharmacy, index) => {
      console.log(`${index + 1}. ID: ${pharmacy.id}`);
      console.log(`   Name: ${pharmacy.name}`);
      console.log(`   Address: ${pharmacy.address}\n`);
    });

    console.log('💡 To add coordinates manually:');
    console.log('   node manual-geocode.js update <pharmacy_id> <latitude> <longitude>');
    console.log('   Example: node manual-geocode.js update 1 10.8298295 106.7617899\n');
  } catch (error) {
    console.error('❌ Error listing pharmacies:', error);
  }
};

// Show pharmacy details
const showPharmacyDetails = async (pharmacyId) => {
  try {
    const pharmacy = await Pharmacy.findByPk(pharmacyId);
    if (!pharmacy) {
      console.log(`❌ Pharmacy with ID ${pharmacyId} not found`);
      return;
    }

    console.log(`📍 Pharmacy Details:`);
    console.log(`   ID: ${pharmacy.id}`);
    console.log(`   Name: ${pharmacy.name}`);
    console.log(`   Address: ${pharmacy.address}`);
    console.log(`   Latitude: ${pharmacy.latitude || 'Not set'}`);
    console.log(`   Longitude: ${pharmacy.longitude || 'Not set'}`);
    console.log(`   Phone: ${pharmacy.phone || 'Not set'}`);
    console.log(`   Hours: ${pharmacy.hours || 'Not set'}`);
    console.log(`   Active: ${pharmacy.is_active ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Error showing pharmacy details:', error);
  }
};

// Main script logic
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await listPharmaciesWithoutCoordinates();
      break;
    
    case 'update':
      const pharmacyId = args[1];
      const latitude = args[2];
      const longitude = args[3];
      
      if (!pharmacyId || !latitude || !longitude) {
        console.log('❌ Usage: node manual-geocode.js update <pharmacy_id> <latitude> <longitude>');
        console.log('   Example: node manual-geocode.js update 1 10.8298295 106.7617899');
        break;
      }
      
      await updatePharmacyCoordinates(pharmacyId, latitude, longitude);
      break;
    
    case 'show':
      const showId = args[1];
      if (!showId) {
        console.log('❌ Usage: node manual-geocode.js show <pharmacy_id>');
        break;
      }
      await showPharmacyDetails(showId);
      break;
    
    default:
      console.log('🏥 Manual Pharmacy Geocoding Tool\n');
      console.log('Available commands:');
      console.log('  list                              - List pharmacies without coordinates');
      console.log('  show <pharmacy_id>               - Show pharmacy details');
      console.log('  update <id> <latitude> <longitude> - Update pharmacy coordinates');
      console.log('\nExamples:');
      console.log('  node manual-geocode.js list');
      console.log('  node manual-geocode.js show 1');
      console.log('  node manual-geocode.js update 1 10.8298295 106.7617899');
      break;
  }
};

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 Script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updatePharmacyCoordinates, listPharmaciesWithoutCoordinates, showPharmacyDetails }; 