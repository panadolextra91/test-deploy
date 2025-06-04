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
import UserManage from "./components/UserManage";
import CustomerManage from "./components/CustomerManage";
import ForgotPassword from "./components/ForgotPassword";
import Products from "./components/Products";
import PharmaSalesReps from "./components/PharmaSalesReps";
import Brands from "./components/Brands";
import ImportProductList from "./components/ImportProductList";
import Orders from "./components/Orders";
import PharmaSalesLogin from "./components/PharmaSalesLogin";
import PharmaSalesRegister from "./components/PharmaSalesRegister";

function App() {
    const ProtectedRoute = ({ children, roles }) => {
        const storedRole =
            sessionStorage.getItem("userRole") || localStorage.getItem("userRole");

        if (!storedRole) {
            return <Navigate to="/" replace />;
        }

        if (roles.includes(storedRole)) {
            return children;
        }

        if (storedRole === "admin") {
            return <Navigate to="/admin-dashboard" replace />;
        }
        if (storedRole === "pharmacist") {
            return <Navigate to="/dashboard" replace />;
        }

        return <Navigate to="/" replace />;
    };

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/pharma-sales-login' element={<PharmaSalesLogin />} />
                <Route path='/pharma-sales-register' element={<PharmaSalesRegister />} />
                <Route path='/import-product-list' element={<ImportProductList />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute roles={['pharmacist']}>
                        <PharmacistDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path='/medicines' element={
                    <ProtectedRoute roles={['pharmacist', 'admin']}>
                        <Medicines />
                    </ProtectedRoute>
                } />
                <Route path='/categories' element={
                    <ProtectedRoute roles={['pharmacist', 'admin']}>
                        <Categories />
                    </ProtectedRoute>
                } />
                <Route path='/suppliers' element={
                    <ProtectedRoute roles={['pharmacist', 'admin']}>
                        <Suppliers />
                    </ProtectedRoute>
                } />
                <Route path='/products' element={
                    <ProtectedRoute roles={['pharmacist', 'admin']}>
                        <Products />
                    </ProtectedRoute>
                } />
                <Route path='/sales-invoices' element={
                    <ProtectedRoute roles={['pharmacist', 'admin']}>
                        <SalesInvoices />
                    </ProtectedRoute>
                } />
                <Route path='/profile' element={
                    <ProtectedRoute roles={['admin', 'pharmacist']}>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path='/users-manage' element={
                    <ProtectedRoute roles={['admin']}>
                        <UserManage />
                    </ProtectedRoute>
                } />
                <Route path='/customers-manage' element={
                    <ProtectedRoute roles={['admin', 'pharmacist']}>
                        <CustomerManage />
                    </ProtectedRoute>
                } />
                <Route path='/pharma-sales-reps' element={
                    <ProtectedRoute roles={['admin', 'pharmacist']}>
                        <PharmaSalesReps />
                    </ProtectedRoute>
                } />
                <Route path='/brands' element={
                    <ProtectedRoute roles={['admin', 'pharmacist']}>
                        <Brands />
                    </ProtectedRoute>
                } />
                <Route path='/orders' element={
                    <ProtectedRoute roles={['admin', 'pharmacist']}>
                        <Orders />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
