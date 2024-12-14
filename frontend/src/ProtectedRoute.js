// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, userRole, allowedRoles }) => {
    if (!userRole) return null;  // Render nothing if userRole is still null (loading)

    if (allowedRoles.includes(userRole)) {
        console.log("Access granted for role:", userRole); // Debug log
        return children;
    }

    console.log("Access denied for role:", userRole); // Debug log
    return <Navigate to="/" replace />;
};

export default ProtectedRoute;
