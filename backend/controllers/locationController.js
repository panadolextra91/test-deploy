// controllers/locationController.js
const Location = require('../models/Location');

// Get all locations
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.findAll();
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};

// Get a location by ID
exports.getLocationById = async (req, res) => {
    const { id } = req.params;
    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.status(200).json(location);
    } catch (error) {
        console.error("Error fetching location by ID:", error);
        res.status(500).json({ message: "Failed to fetch location" });
    }
};

// Create a new location
exports.createLocation = async (req, res) => {
    const { name, description } = req.body;
    try {
        const newLocation = await Location.create({ name, description });
        res.status(201).json(newLocation);
    } catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ message: "Failed to create location" });
    }
};

// Update a location by ID
exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        location.name = name || location.name;
        location.description = description || location.description;
        await location.save();
        res.status(200).json(location);
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Failed to update location" });
    }
};

// Delete a location by ID
exports.deleteLocation = async (req, res) => {
    const { id } = req.params;
    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        await location.destroy();
        res.status(204).json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error("Error deleting location:", error);
        res.status(500).json({ message: "Failed to delete location" });
    }
};
