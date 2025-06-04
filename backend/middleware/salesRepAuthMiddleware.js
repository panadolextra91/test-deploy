const jwt = require('jsonwebtoken');

// Middleware to verify JWT token for sales reps
const authenticateSalesRep = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // Log headers only in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        console.log('Sales Rep Authorization Header:', authHeader);
        console.log('Sales Rep Extracted Token:', token);
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
        // Use JWT_SECRET from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Log decoded payload only in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            console.log('Sales Rep Decoded Token:', decoded);
        }

        // Verify this is a sales rep token
        if (decoded.role !== 'sales_rep') {
            return res.status(403).json({ error: 'Access denied, invalid role' });
        }

        req.salesRep = decoded; // Attach sales rep data to the request object
        next();
    } catch (error) {
        console.error('Sales Rep Token Verification Error:', error.message);
        res.status(400).json({ error: 'Invalid token' });
    }
};

module.exports = authenticateSalesRep; 