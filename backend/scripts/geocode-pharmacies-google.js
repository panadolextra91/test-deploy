require('dotenv').config({ path: '../.env' });
const { Pharmacy } = require('../models');
const axios = require('axios');

// Geocoding using Google Maps API (most accurate for Vietnamese addresses)
const geocodeWithGoogle = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAP_API_KEY not found in environment variables');
    }

    console.log(`🔍 Geocoding with Google Maps: ${address}`);
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey,
        region: 'vn', // Bias results to Vietnam
        language: 'vi' // Use Vietnamese language for better results
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const result = {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: response.data.results[0].formatted_address,
        place_id: response.data.results[0].place_id,
        source: 'Google Maps'
      };
      
      console.log(`   ✅ Found: ${result.latitude}, ${result.longitude}`);
      console.log(`   📍 Formatted: ${result.formatted_address}`);
      return result;
    } else {
      console.log(`   ❌ Google Geocoding failed: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Error: ${response.data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    console.error('   ❌ Google geocoding error:', error.message);
    return null;
  }
};

// Update pharmacy coordinates using Google Maps
const updatePharmacyCoordinates = async () => {
  try {
    console.log('🚀 Starting Google Maps geocoding process...\n');

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
      
      const coordinates = await geocodeWithGoogle(pharmacy.address);
      
      if (coordinates) {
        // Update pharmacy with coordinates
        await pharmacy.update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
        
        console.log(`   ✅ Updated pharmacy #${pharmacy.id} with coordinates\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to geocode pharmacy #${pharmacy.id}\n`);
        failCount++;
      }

      // Add delay to respect Google Maps API rate limits
      if (i < pharmacies.length - 1) {
        console.log('   ⏳ Waiting 1 second (rate limit)...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('🎉 Google Maps geocoding process completed!');
    console.log(`✅ Successfully geocoded: ${successCount} pharmacies`);
    console.log(`❌ Failed to geocode: ${failCount} pharmacies`);

    if (failCount > 0) {
      console.log('\n💡 Tips for failed addresses:');
      console.log('   - Check address format and spelling');
      console.log('   - Try adding more specific details (ward, district, city)');
      console.log('   - Use manual geocoding for problematic addresses');
    }

  } catch (error) {
    console.error('❌ Error during geocoding process:', error);
  }
};

// Test single address function
const testAddress = async (address) => {
  console.log('🧪 Testing Google Maps geocoding...\n');
  const result = await geocodeWithGoogle(address);
  if (result) {
    console.log('\n📍 Result:');
    console.log(`   Latitude: ${result.latitude}`);
    console.log(`   Longitude: ${result.longitude}`);
    console.log(`   Formatted: ${result.formatted_address}`);
    console.log(`   Place ID: ${result.place_id}`);
    console.log(`   Source: ${result.source}`);
  }
  return result;
};

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'test' && args[1]) {
    // Test mode: node geocode-pharmacies-google.js test "address here"
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

module.exports = { geocodeWithGoogle, updatePharmacyCoordinates, testAddress }; 