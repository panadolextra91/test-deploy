import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Card, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Bar, Line } from "@ant-design/plots"; // Ensure you have this installed
import axios from "axios";
import { getSessionData } from "../utils/sessionUtils";
import AdminSidebar from "./AdminSidebar";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [usersData, setUsersData] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [roleFilter, setRoleFilter] = useState('all'); // For role-based filtering
    const [dailyIncomeData, setDailyIncomeData] = useState([]);
    const [sellingMedicinesData, setSellingMedicinesData] = useState([]);
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [revenueData, setRevenueData] = useState({ income: 0, outcome: 0, total: 0 });
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [nearExpiryAlerts, setNearExpiryAlerts] = useState([]);
    const [outOfStockAlerts, setOutOfStockAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { token, role } = getSessionData();
        console.log('Token for dashboard admin:', token);
        if (!token || role !== "admin") {
            message.error("Unauthorized access.");
            navigate(role === "pharmacist" ? "/dashboard" : "/");
            return;
        }
        fetchDailyIncome(token);
        fetchRevenueData(token);
        fetchDashboardData(token);
        fetchUserProfile(token);
        fetchSellingMedicinesData(token);
        fetchUsersData(token);
    }, [navigate]);

    const fetchUsersData = async (token) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const users = response.data; // Use the array directly from the response

            console.log("Fetched users data:", users);

            setUsersData(users || []); // Fallback to an empty array if users is undefined
            setTotalUsers(users?.length || 0); // Set the total number of users
        } catch (error) {
            console.error("Failed to fetch users data:", error);
            message.error("Unable to load users data.");
            setUsersData([]); // Reset to an empty array on error
            setTotalUsers(0); // Reset total users on error
        }
    };

    const fetchSellingMedicinesData = async (token) => {
        try {
            console.log("Token being sent:", token);

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/sales/selling-medicines`, {
                headers: { Authorization: `Bearer ${token}` }, // Ensure token is here
            });
            setSellingMedicinesData(response.data);
        } catch (error) {
            console.error("Failed to fetch selling medicines data:", error);
            message.error("Unable to load selling medicines data.");
        }
    };

    const fetchRevenueData = async (token) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/revenue/monthly`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRevenueData(response.data);
        } catch (error) {
            console.error("Failed to fetch revenue data:", error);
            message.error("Unable to load revenue data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyIncome = async (token) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/invoices/sales/daily-income`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Transform the data for the line chart
            const formattedData = response.data.map((item) => ({
                date: item.date, // Make sure 'date' matches your backend's response
                total_income: parseFloat(item.total_income),
            }));

            setDailyIncomeData(formattedData);
        } catch (error) {
            console.error("Failed to fetch daily income data:", error);
            message.error("Unable to load daily income data.");
        }
    };

    const fetchDashboardData = async (token) => {
        try {
            const lowStockResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/low-stock`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLowStockAlerts(lowStockResponse.data);

            const nearExpiryResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/near-expiry`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNearExpiryAlerts(nearExpiryResponse.data);

            const outOfStockResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/out-of-stock`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOutOfStockAlerts(outOfStockResponse.data);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            message.error("Unable to load dashboard data.");
        }
    };

    const fetchUserProfile = async (token) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserName(response.data.name);
            // Set avatar URL if it exists
            if (response.data.avatarUrl) {
                setAvatarUrl(response.data.avatarUrl);
                console.log('Setting avatar URL:', response.data.avatarUrl);
            } else {
                setAvatarUrl(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            message.error("Unable to load user profile.");
        }
    };

    const revenueChartConfig = {
        data: [
            { type: "Income", value: revenueData.income },
            { type: "Outcome", value: revenueData.outcome },
        ],
        xField: "type",
        yField: "value",
        colorField: "type",
    };

    const sellingMedicinesChartConfig = {
        data: sellingMedicinesData.map((item) => ({
            name: item.medicine.name,
            quantity: parseInt(item.total_quantity),
        })),
        xField: 'name',
        yField: 'quantity',
        colorField: 'name', // Optional: Different colors for each bar
        meta: {
            quantity: { alias: 'Quantity Sold' },
            name: { alias: 'Medicine' },
        },
    };

    const dailyIncomeChartConfig = {
        data: dailyIncomeData,
        xField: 'date',
        yField: 'total_income',
        xAxis: {
            type: 'time',
            tickCount: 10,
        },
        yAxis: {
            label: {
                formatter: (value) => `$${value}`,
            },
        },
        smooth: true, // Optional: Makes the line smoother
        point: {
            size: 5,
            shape: 'circle',
        },
    };

    const filteredUsers = Array.isArray(usersData)
        ? (roleFilter === 'all'
            ? usersData
            : usersData.filter((user) => user.role && user.role === roleFilter))
        : [];

    const handleAvatarClick = () => navigate("/profile");

    return (
        <div className="dashboard-container">
            <AdminSidebar />
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Welcome Back, {userName}</h1>
                        <p>Overview of the pharmacy's current status.</p>
                    </div>
                    <div className="header-right" onClick={handleAvatarClick} style={{cursor: "pointer"}}>
                        <Avatar 
                            size={50} 
                            icon={!avatarUrl && <UserOutlined />}
                            src={avatarUrl}
                            onError={() => {
                                console.error('Failed to load avatar image');
                                setAvatarUrl(null);
                                sessionStorage.removeItem('userAvatarUrl');
                            }}
                        />
                    </div>
                </header>

                <section className="alerts">
                    <div className="out-stock">
                        <h2>Out Of Stock</h2>
                        <ul>
                            {outOfStockAlerts.map((alert) => (
                                <li key={alert.id}>
                                    {alert.name} - {alert.quantity} left - {alert.Location?.name || "No location"}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="low-stock">
                        <h2>Low Stock</h2>
                        <ul>
                            {lowStockAlerts.map((alert) => (
                                <li key={alert.id}>
                                    {alert.name} - {alert.quantity} left - {alert.Location?.name || "No location"}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="near-expiry">
                        <h2>Near Expiry</h2>
                        <ul>
                            {nearExpiryAlerts.map((alert) => (
                                <li key={alert.id}>
                                    {alert.name} - Expires on{" "}
                                    {new Date(alert.expiry_date).toLocaleDateString()} -{" "}
                                    {alert.Location?.name || "No location"}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
                <div className="revenue-container">
                    <section className="revenue-section">
                        <Card loading={loading} title="Total Revenue This Month">
                            <h2>{`$${revenueData.total.toFixed(2)}`}</h2>
                            <Bar {...revenueChartConfig} />
                        </Card>
                    </section>
                    <section className="daily-income-section">
                        <Card title="Daily Income">
                            <Line {...dailyIncomeChartConfig} />
                        </Card>
                    </section>
                </div>
                <section className="selling-medicines-section">
                    <Card title="Selling Medicines">
                        <Bar {...sellingMedicinesChartConfig} />
                    </Card>
                </section>
                <section className="users-section">
                    <Card title={`Total Users: ${Array.isArray(usersData) ? usersData.length : 0}`}
                          style={{marginTop: 16}}>
                        <div style={{marginBottom: 16}}>
                            <label htmlFor="roleFilter">Filter by Role: </label>
                            <select
                                id="roleFilter"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="admin">Admin</option>
                                <option value="pharmacist">Pharmacist</option>
                            </select>
                        </div>
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No users found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </Card>
                </section>

            </main>
        </div>
    );
};

export default AdminDashboard;
