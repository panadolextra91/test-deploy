const { HealthMetrics, HealthMetricsHistory, Customer } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
    // Height should be in meters, weight in kg
    const heightInMeters = height / 100; // Convert cm to meters
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
};

// Helper function to calculate BMR using Mifflin-St Jeor Equation
const calculateBMR = (weight, height, age, gender) => {
    // Base BMR calculation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    
    // Adjust for gender
    if (gender.toLowerCase() === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }
    
    return Math.round(bmr);
};

// Get all metrics (admin/pharmacist only)
exports.getAllMetrics = async (req, res) => {
    try {
        if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'pharmacist')) {
            return res.status(403).json({ error: 'Not authorized to view all metrics' });
        }

        const metrics = await HealthMetrics.findAll({
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(200).json(metrics);
    } catch (error) {
        console.error('Error getting all metrics:', error);
        res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
};

// Get metrics by customer ID
exports.getCustomerMetrics = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Check authorization
        if (!req.user.role) {
            // Customer can only view their own metrics
            if (req.user.id !== parseInt(customerId)) {
                return res.status(403).json({ error: 'Not authorized to view these metrics' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to view these metrics' });
        }

        const metrics = await HealthMetrics.findOne({
            where: { customer_id: customerId },
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        if (!metrics) {
            return res.status(404).json({ error: 'Metrics not found for this customer' });
        }

        // Calculate derived metrics
        const age = calculateAge(metrics.date_of_birth);
        const bmi = calculateBMI(metrics.weight, metrics.height);
        const bmr = calculateBMR(metrics.weight, metrics.height, age, metrics.gender);

        res.status(200).json({
            ...metrics.toJSON(),
            age,
            bmi,
            bmr
        });
    } catch (error) {
        console.error('Error getting customer metrics:', error);
        res.status(500).json({ error: 'Failed to retrieve customer metrics' });
    }
};

// Create or update metrics
exports.updateMetrics = async (req, res) => {
    try {
        const { 
            customer_id,
            weight,
            height,
            blood_pressure_systolic,
            blood_pressure_diastolic,
            gender,
            date_of_birth,
            blood_type
        } = req.body;

        // Check authorization
        if (!req.user.role) {
            // Customer can only update their own metrics
            if (req.user.id !== parseInt(customer_id)) {
                return res.status(403).json({ error: 'Not authorized to update these metrics' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to update metrics' });
        }

        // Find existing metrics or create new one
        let metrics = await HealthMetrics.findOne({ where: { customer_id } });
        const oldMetrics = metrics ? { ...metrics.toJSON() } : null;

        // Calculate age, BMI, and BMR using new or existing values
        let age = null;
        let bmi = null;
        let bmr = null;
        let blood_pressure = null;

        // Get the values we'll use for calculations (new values or existing ones)
        const weightToUse = weight || (metrics?.weight ? parseFloat(metrics.weight) : null);
        const heightToUse = height || (metrics?.height ? parseFloat(metrics.height) : null);
        const dateOfBirthToUse = date_of_birth || metrics?.date_of_birth;
        const genderToUse = gender?.toUpperCase() || metrics?.gender;

        // Calculate age if we have date of birth
        if (dateOfBirthToUse) {
            age = calculateAge(dateOfBirthToUse);
        }

        // Calculate BMI if we have both height and weight
        if (weightToUse && heightToUse) {
            bmi = calculateBMI(weightToUse, heightToUse);
        }

        // Calculate BMR if we have all required values
        if (age !== null && weightToUse && heightToUse && genderToUse) {
            bmr = calculateBMR(weightToUse, heightToUse, age, genderToUse);
        }

        // Format blood pressure if both components are provided
        if (blood_pressure_systolic && blood_pressure_diastolic) {
            blood_pressure = `${blood_pressure_systolic}/${blood_pressure_diastolic}`;
        }

        if (metrics) {
            // Update existing metrics
            await metrics.update({
                weight: weight || metrics.weight,
                height: height || metrics.height,
                blood_pressure_systolic: blood_pressure_systolic || metrics.blood_pressure_systolic,
                blood_pressure_diastolic: blood_pressure_diastolic || metrics.blood_pressure_diastolic,
                blood_pressure: blood_pressure || metrics.blood_pressure,
                gender: gender?.toUpperCase() || metrics.gender,
                date_of_birth: date_of_birth || metrics.date_of_birth,
                blood_type: blood_type || metrics.blood_type,
                bmi: bmi !== null ? bmi : metrics.bmi,
                bmr: bmr !== null ? bmr : metrics.bmr
            });
        } else {
            // Create new metrics
            metrics = await HealthMetrics.create({
                customer_id,
                weight: weightToUse,
                height: heightToUse,
                blood_pressure_systolic,
                blood_pressure_diastolic,
                blood_pressure,
                gender: genderToUse,
                date_of_birth: dateOfBirthToUse,
                blood_type,
                bmi,
                bmr
            });
        }

        // Create history record if values changed
        if (oldMetrics) {
            const changes = [];
            if (weight && oldMetrics.weight !== weight) {
                changes.push({ metric_type: 'WEIGHT', value_numeric: weight });
            }
            if (height && oldMetrics.height !== height) {
                changes.push({ metric_type: 'HEIGHT', value_numeric: height });
            }
            if (blood_pressure && oldMetrics.blood_pressure !== blood_pressure) {
                changes.push({ metric_type: 'BLOOD_PRESSURE', value_text: blood_pressure });
            }
            if (bmi !== null && oldMetrics.bmi !== bmi.toString()) {
                changes.push({ metric_type: 'BMI', value_numeric: bmi });
            }
            if (bmr !== null && oldMetrics.bmr !== bmr) {
                changes.push({ metric_type: 'BMR', value_numeric: bmr });
            }

            // Record changes in history
            for (const change of changes) {
                await HealthMetricsHistory.create({
                    customer_id,
                    ...change,
                    recorded_at: new Date()
                });
            }
        }

        // Get updated metrics with customer info
        const updatedMetrics = await HealthMetrics.findOne({
            where: { customer_id },
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        // Add age to response
        const response = {
            ...updatedMetrics.toJSON(),
            age
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error updating metrics:', error);
        res.status(500).json({ error: 'Failed to update metrics', details: error.message });
    }
};

// Get metrics history
exports.getMetricsHistory = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { metric_type, start_date, end_date } = req.query;

        // Check authorization
        if (!req.user.role) {
            // Customer can only view their own history
            if (req.user.id !== parseInt(customerId)) {
                return res.status(403).json({ error: 'Not authorized to view this history' });
            }
        } else if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
            return res.status(403).json({ error: 'Not authorized to view metrics history' });
        }

        // Build where clause
        const whereClause = {
            customer_id: customerId
        };

        if (metric_type) {
            whereClause.metric_type = metric_type;
        }

        if (start_date || end_date) {
            whereClause.recorded_at = {};
            if (start_date) {
                whereClause.recorded_at[Op.gte] = new Date(start_date);
            }
            if (end_date) {
                whereClause.recorded_at[Op.lte] = new Date(end_date);
            }
        }

        const history = await HealthMetricsHistory.findAll({
            where: whereClause,
            order: [['recorded_at', 'DESC']],
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'phone', 'email']
            }]
        });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error getting metrics history:', error);
        res.status(500).json({ error: 'Failed to retrieve metrics history' });
    }
};

// Delete metrics history entry (admin only)
exports.deleteMetricsHistory = async (req, res) => {
    try {
        const { id } = req.params;

        // Only admin can delete history entries
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can delete metrics history' });
        }

        const historyEntry = await HealthMetricsHistory.findByPk(id);
        if (!historyEntry) {
            return res.status(404).json({ error: 'History entry not found' });
        }

        await historyEntry.destroy();
        res.status(200).json({ message: 'History entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting metrics history:', error);
        res.status(500).json({ error: 'Failed to delete metrics history' });
    }
};
