import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PharmacistDashboard from './components/PharmacistDashboard';
import Login from "./components/Login";
import Medicines from './components/Medicines.js';
import Categories from "./components/Categories";
import SalesInvoices from "./components/SalesInvoices";
import Suppliers from './components/Suppliers';
import Profile from './components/Profile';
import AdminDashboard from "./components/AdminDashboard";
import AdminSidebar from './components/AdminSidebar';
import PharmacistSidebar from './components/PharmacistSidebar';
import UserManage from "./components/UserManage";
import CustomerManage from "./components/CustomerManage";
import ForgotPassword from "./components/ForgotPassword";
function App() {
    const ProtectedRoute = ({ children, role }) => {
        const storedRole =
            sessionStorage.getItem("userRole") || localStorage.getItem("userRole");

        console.log("Stored Role:", storedRole); // Debug log
        console.log("Required Role:", role);     // Debug log

        // If no role is found, redirect to the login page
        if (!storedRole) {
            console.error("No role found. Redirecting to login.");
            return <Navigate to="/" replace />;
        }

        // If the stored role matches the required role, grant access
        if (storedRole === role) {
            console.log("Access granted for role:", storedRole); // Debug log
            return children;
        }

        // Redirect based on mismatched roles
        console.error(`Unauthorized access for role: ${storedRole}`);
        if (storedRole === "admin") {
            return <Navigate to="/admin-dashboard" replace />;
        }
        if (storedRole === "pharmacist") {
            return <Navigate to="/dashboard" replace />;
        }

        // Default redirect for unauthorized roles
        return <Navigate to="/" replace />;
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute role="pharmacist">
                        <PharmacistDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path='/medicines' element={<Medicines />} />
                <Route path='/categories' element={<Categories />} />
                <Route path='/suppliers' element={<Suppliers />} />
                <Route path='/sales-invoices' element={<SalesInvoices />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/users-manage' element={<UserManage/>}/>
                <Route path='/customers-manage' element={<CustomerManage/>}/>
                <Route path='/forgot-password' element={<ForgotPassword/>}/>
            </Routes>
        </Router>
    );
}

export default App;
