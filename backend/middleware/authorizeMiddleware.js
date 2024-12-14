// Middleware to authorize based on user role
//authorizeMiddleware.js
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('User Role:', req.user.role); // Log the user's role
        console.log('Allowed Roles:', roles);    // Log the allowed roles

        // Check if the user role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            console.error('Access Denied for Role:', req.user.role); // Log denial
            return res.status(403).json({ error: 'Access denied' });
        }

        console.log('Access Granted for Role:', req.user.role); // Log access grant
        next();
    };
};

module.exports = authorize;
