require('dotenv').config({ path: '../.env' });
const { Pharmacy } = require('../models');
const axios = require('axios');

// Geocoding using OpenStreetMap Nominatim (free, no API key needed)
const geocodeAddress = async (address) => {
  try {
    console.log(`🔍 Geocoding: ${address}`);
    
    // Add Vietnam to improve accuracy for Vietnamese addresses
    const searchAddress = `${address}, Vietnam`;
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: searchAddress,
        format: 'json',
        limit: 1,
        countrycodes: 'vn', // Restrict to Vietnam
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'PharmacyManagementSystem/1.0' // Required by Nominatim
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coordinates = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name
      };
      
      console.log(`   ✓ Found: ${coordinates.latitude}, ${coordinates.longitude}`);
      return coordinates;
    } else {
      console.log('   ✗ No results found');
      return null;
    }
  } catch (error) {
    console.error('   ✗ Geocoding error:', error.message);
    return null;
  }
};

// Update pharmacy coordinates
const updatePharmacyCoordinates = async () => {
  try {
    console.log('🚀 Starting pharmacy geocoding process...\n');

    // Get all pharmacies without coordinates
    const pharmacies = await Pharmacy.findAll({
      where: {
        address: { [require('sequelize').Op.not]: null },
        latitude: null // Only update pharmacies that don't have coordinates yet
      }
    });

    if (pharmacies.length === 0) {
      console.log('✅ All pharmacies already have coordinates!');
      return;
    }

    console.log(`📍 Found ${pharmacies.length} pharmacies to geocode\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pharmacies.length; i++) {
      const pharmacy = pharmacies[i];
      console.log(`[${i + 1}/${pharmacies.length}] ${pharmacy.name}`);
      console.log(`   Address: ${pharmacy.address}`);
      
      const coordinates = await geocodeAddress(pharmacy.address);
      
      if (coordinates) {
        // Update pharmacy with coordinates
        await pharmacy.update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
        
        console.log(`   ✓ Updated pharmacy #${pharmacy.id} with coordinates\n`);
        successCount++;
      } else {
        console.log(`   ✗ Failed to geocode pharmacy #${pharmacy.id}\n`);
        failCount++;
      }

      // Add delay to respect Nominatim rate limits (1 request per second)
      if (i < pharmacies.length - 1) {
        console.log('   ⏳ Waiting 1 second (rate limit)...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('🎉 Geocoding process completed!');
    console.log(`✅ Successfully geocoded: ${successCount} pharmacies`);
    console.log(`❌ Failed to geocode: ${failCount} pharmacies`);

    if (failCount > 0) {
      console.log('\n💡 Tips for failed addresses:');
      console.log('   - Check address format and spelling');
      console.log('   - Try adding more specific details (district, city)');
      console.log('   - Manually add coordinates for these pharmacies');
      console.log('   - Consider using Google Geocoding API for better accuracy');
    }

  } catch (error) {
    console.error('❌ Error during geocoding process:', error);
  }
};

// Test single address function
const testAddress = async (address) => {
  console.log('🧪 Testing address geocoding...\n');
  const result = await geocodeAddress(address);
  if (result) {
    console.log('\n📍 Result:');
    console.log(`   Latitude: ${result.latitude}`);
    console.log(`   Longitude: ${result.longitude}`);
    console.log(`   Formatted: ${result.formatted_address}`);
  }
  return result;
};

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'test' && args[1]) {
    // Test mode: node geocode-pharmacies-free.js test "address here"
    testAddress(args[1])
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
      });
  } else {
    // Normal mode: update all pharmacies
    updatePharmacyCoordinates()
      .then(() => {
        console.log('\n🏁 Script finished');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { geocodeAddress, updatePharmacyCoordinates, testAddress }; 