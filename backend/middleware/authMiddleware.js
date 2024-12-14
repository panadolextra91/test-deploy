const jwt = require('jsonwebtoken');

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // Log headers only in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        console.log('Authorization Header:', authHeader);
        console.log('Extracted Token:', token);
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
        // Use JWT_SECRET from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Log decoded payload only in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            console.log('Decoded Token:', decoded);
        }

        req.user = decoded; // Attach user data to the request object
        next();
    } catch (error) {
        console.error('Token Verification Error:', error.message); // Log error message only
        res.status(400).json({ error: 'Invalid token' });
    }
};

module.exports = authenticateToken;
