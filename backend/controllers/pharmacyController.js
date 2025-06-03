const { Pharmacy } = require('../models');
const { Op } = require('sequelize');

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Get all pharmacies
exports.getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      pharmacies,
      total: pharmacies.length
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ error: 'Failed to retrieve pharmacies' });
  }
};

// Get pharmacy by ID
exports.getPharmacyById = async (req, res) => {
  const { id } = req.params;
  try {
    const pharmacy = await Pharmacy.findByPk(id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }
    res.status(200).json(pharmacy);
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    res.status(500).json({ error: 'Failed to retrieve pharmacy' });
  }
};

// Find nearest pharmacies based on customer's real-time location
exports.getNearestPharmacies = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.body; // Default radius: 50km

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required',
        example: {
          latitude: 37.7749,
          longitude: -122.4194,
          radius: 10
        }
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid coordinates',
        details: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Get all active pharmacies with location data
    const pharmacies = await Pharmacy.findAll({
      where: { 
        is_active: true,
        latitude: { [Op.not]: null },
        longitude: { [Op.not]: null }
      }
    });

    if (pharmacies.length === 0) {
      return res.status(200).json({
        message: 'No pharmacies with location data found',
        pharmacies: [],
        customer_location: { latitude, longitude },
        search_radius: radius
      });
    }

    // Calculate distances and filter by radius
    const pharmaciesWithDistance = pharmacies
      .map(pharmacy => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(pharmacy.latitude),
          parseFloat(pharmacy.longitude)
        );

        return {
          ...pharmacy.toJSON(),
          distance_km: distance,
          distance_miles: Math.round(distance * 0.621371 * 100) / 100 // Convert to miles
        };
      })
      .filter(pharmacy => pharmacy.distance_km <= radius) // Filter by radius
      .sort((a, b) => a.distance_km - b.distance_km); // Sort by distance (nearest first)

    res.status(200).json({
      pharmacies: pharmaciesWithDistance,
      total_found: pharmaciesWithDistance.length,
      customer_location: { latitude, longitude },
      search_radius: radius,
      message: pharmaciesWithDistance.length > 0 
        ? `Found ${pharmaciesWithDistance.length} pharmacies within ${radius}km`
        : `No pharmacies found within ${radius}km radius`
    });
  } catch (error) {
    console.error('Error finding nearest pharmacies:', error);
    res.status(500).json({ error: 'Failed to find nearest pharmacies' });
  }
};

// Get pharmacies with distances (no radius filter)
exports.getPharmaciesWithDistance = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Get all active pharmacies with location data
    const pharmacies = await Pharmacy.findAll({
      where: { 
        is_active: true,
        latitude: { [Op.not]: null },
        longitude: { [Op.not]: null }
      }
    });

    // Calculate distances for all pharmacies
    const pharmaciesWithDistance = pharmacies
      .map(pharmacy => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(pharmacy.latitude),
          parseFloat(pharmacy.longitude)
        );

        return {
          ...pharmacy.toJSON(),
          distance_km: distance,
          distance_miles: Math.round(distance * 0.621371 * 100) / 100
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km); // Sort by distance

    res.status(200).json({
      pharmacies: pharmaciesWithDistance,
      total: pharmaciesWithDistance.length,
      customer_location: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error calculating pharmacy distances:', error);
    res.status(500).json({ error: 'Failed to calculate pharmacy distances' });
  }
}; 