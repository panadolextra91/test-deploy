import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Card, message, DatePicker, Select, Badge, Dropdown, Button, List, Spin } from "antd";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import { Bar, Line, Pie } from "@ant-design/plots"; // Ensure you have this installed
import axios from "axios";
import { getSessionData } from "../utils/sessionUtils";
import AdminSidebar from "./AdminSidebar";
import "./AdminDashboard.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
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
    const [topBrandsData, setTopBrandsData] = useState([]);
    const [topBrandsDateRange, setTopBrandsDateRange] = useState(null);
    const [topBrandsLoading, setTopBrandsLoading] = useState(false);
    const [salesByCategoryData, setSalesByCategoryData] = useState([]);
    const [categoryDateRange, setCategoryDateRange] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryAnalysisType, setCategoryAnalysisType] = useState('revenue');
    
    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

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
        fetchSalesByCategoryData(null, null, 'revenue'); // Load initial category data
    }, [navigate]);

    // Fetch notifications when userId is available
    useEffect(() => {
        if (userId) {
            const { token } = getSessionData();
            fetchNotifications(token);
            fetchNotificationCount(token);
        }
    }, [userId]);

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
            setUserId(response.data.id);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            message.error("Unable to load user profile.");
        }
    };

    const fetchNotifications = async (token) => {
        if (!userId) return;
        
        setNotificationLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/user/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { include_resolved: 'false' } // Only get unresolved notifications
                }
            );
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            message.error("Unable to load notifications.");
        } finally {
            setNotificationLoading(false);
        }
    };

    const fetchNotificationCount = async (token) => {
        if (!userId) return;
        
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/user/${userId}/unread/count`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNotificationCount(response.data.count);
        } catch (error) {
            console.error("Failed to fetch notification count:", error);
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        const { token } = getSessionData();
        try {
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Refresh notifications and count
            fetchNotifications(token);
            fetchNotificationCount(token);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            message.error("Unable to mark notification as read.");
        }
    };

    const markAllNotificationsAsRead = async () => {
        const { token } = getSessionData();
        try {
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/user/${userId}/read/all`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Refresh notifications and count
            fetchNotifications(token);
            fetchNotificationCount(token);
            message.success("All notifications marked as read.");
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const fetchTopBrandsData = async (startDate, endDate) => {
        const { token } = getSessionData();
        setTopBrandsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/invoices/sales/top-brands-by-date`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: startDate.format('YYYY-MM-DD'),
                        endDate: endDate.format('YYYY-MM-DD')
                    }
                }
            );
            setTopBrandsData(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch top brands data:", error);
            message.error("Unable to load top brands data.");
            setTopBrandsData([]);
        } finally {
            setTopBrandsLoading(false);
        }
    };

    const handleDateRangeChange = (dates) => {
        if (dates && dates[0] && dates[1]) {
            setTopBrandsDateRange(dates);
            fetchTopBrandsData(dates[0], dates[1]);
        }
    };

    const fetchSalesByCategoryData = async (startDate, endDate, type = 'revenue') => {
        const { token } = getSessionData();
        setCategoryLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/invoices/sales/by-category`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: startDate ? startDate.format('YYYY-MM-DD') : undefined,
                        endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined,
                        type: type
                    }
                }
            );
            setSalesByCategoryData(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch sales by category data:", error);
            message.error("Unable to load sales by category data.");
            setSalesByCategoryData([]);
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleCategoryDateRangeChange = (dates) => {
        setCategoryDateRange(dates);
        if (dates && dates[0] && dates[1]) {
            fetchSalesByCategoryData(dates[0], dates[1], categoryAnalysisType);
        } else {
            fetchSalesByCategoryData(null, null, categoryAnalysisType);
        }
    };

    const handleCategoryTypeChange = (type) => {
        setCategoryAnalysisType(type);
        if (categoryDateRange && categoryDateRange[0] && categoryDateRange[1]) {
            fetchSalesByCategoryData(categoryDateRange[0], categoryDateRange[1], type);
        } else {
            fetchSalesByCategoryData(null, null, type);
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

    const topBrandsChartConfig = {
        data: topBrandsData.map((item) => ({
            brand: item.brand_name,
            value: parseFloat(item.total_revenue),
        })),
        xField: 'brand',
        yField: 'value',
        colorField: 'brand',
        meta: {
            value: { 
                alias: 'Total Revenue ($)',
                formatter: (value) => `$${value.toFixed(2)}`
            },
            brand: { alias: 'Brand' },
        },
        color: '#1890ff',
    };

    const salesByCategoryChartConfig = {
        data: salesByCategoryData.map((item) => ({
            category: item.category_name,
            Value: item.value,
            percentage: item.percentage
        })),
        angleField: 'Value',
        colorField: 'category',
        radius: 0.8,
        innerRadius: 0.4,
        
        legend: {
            position: 'bottom',
            layout: 'horizontal',
            itemName: {
                style: {
                    fontSize: 12,
                },
            },
        },
        interactions: [
            {
                type: 'element-active',
            },
        ],
    };

    const handleAvatarClick = () => navigate("/profile");

    const notificationDropdownItems = [
        {
            key: 'notifications',
            label: (
                <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        marginBottom: '8px'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            Notifications ({notificationCount})
                        </span>
                        {notificationCount > 0 && (
                            <Button 
                                type="link" 
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAllNotificationsAsRead();
                                }}
                                style={{ padding: 0, fontSize: '12px' }}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    
                    {notificationLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="small" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '20px', 
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            No new notifications
                        </div>
                    ) : (
                        <List
                            size="small"
                            dataSource={notifications}
                            renderItem={(notification) => (
                                <List.Item
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: notification.is_read ? '#fff' : '#f6ffed',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!notification.is_read) {
                                            markNotificationAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <List.Item.Meta
                                        title={
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: notification.is_read ? 'normal' : 'bold',
                                                marginBottom: '4px'
                                            }}>
                                                {notification.title}
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    {notification.message}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#999'
                                                }}>
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="dashboard-container">
            <AdminSidebar />
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Welcome Back, {userName}</h1>
                        <p>Overview of the pharmacy's current status.</p>
                    </div>
                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Dropdown
                            menu={{ items: notificationDropdownItems }}
                            trigger={['click']}
                            open={notificationDropdownOpen}
                            onOpenChange={setNotificationDropdownOpen}
                            placement="bottomRight"
                        >
                            <Badge count={notificationCount} size="small">
                                <Button
                                    type="text"
                                    icon={<BellOutlined />}
                                    size="large"
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px'
                                    }}
                                />
                            </Badge>
                        </Dropdown>
                        
                        <div onClick={handleAvatarClick} style={{cursor: "pointer"}}>
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
                <section className="top-brands-section" style={{ marginTop: 16 }}>
                    <Card 
                        title="Top 5 Selling Brands by Revenue"
                        loading={topBrandsLoading}
                        extra={
                            <RangePicker
                                onChange={handleDateRangeChange}
                                format="YYYY-MM-DD"
                                placeholder={['Start Date', 'End Date']}
                                style={{ width: 300 }}
                            />
                        }
                    >
                        {topBrandsData.length > 0 ? (
                            <>
                                <Bar {...topBrandsChartConfig} />
                                <div style={{ marginTop: 16 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Rank</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Brand Name</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Total Revenue</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Quantity Sold</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Avg per Transaction</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topBrandsData.map((brand) => (
                                                <tr key={brand.brand_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '8px' }}>{brand.rank}</td>
                                                    <td style={{ padding: '8px' }}>{brand.brand_name}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>${brand.total_revenue}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>{brand.total_quantity_sold}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>{brand.average_quantity_per_transaction}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                {topBrandsDateRange ? 'No data available for the selected date range' : 'Please select a date range to view top brands'}
                            </div>
                        )}
                    </Card>
                </section>
                <section className="sales-by-category-section" style={{ marginTop: 16 }}>
                    <Card 
                        title="Sales by Medicine Category"
                        loading={categoryLoading}
                        extra={
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <Select
                                    value={categoryAnalysisType}
                                    onChange={handleCategoryTypeChange}
                                    style={{ width: 120 }}
                                >
                                    <Option value="revenue">Revenue</Option>
                                    <Option value="quantity">Quantity</Option>
                                </Select>
                                <RangePicker
                                    onChange={handleCategoryDateRangeChange}
                                    format="YYYY-MM-DD"
                                    placeholder={['Start Date', 'End Date']}
                                    style={{ width: 300 }}
                                    allowClear
                                />
                            </div>
                        }
                    >
                        {salesByCategoryData.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div style={{ flex: 1 }}>
                                        <Pie {...salesByCategoryChartConfig} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>
                                                        {categoryAnalysisType === 'revenue' ? 'Revenue' : 'Quantity'}
                                                    </th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Percentage</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Transactions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesByCategoryData.map((category) => (
                                                    <tr key={category.category_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '8px' }}>{category.category_name}</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                                            {categoryAnalysisType === 'revenue' 
                                                                ? `$${category.total_revenue}` 
                                                                : category.total_quantity_sold
                                                            }
                                                        </td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>{category.percentage}%</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>{category.number_of_transactions}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                {categoryDateRange ? 'No data available for the selected date range' : 'Loading category data...'}
                            </div>
                        )}
                    </Card>
                </section>

            </main>
        </div>
    );
};

export default AdminDashboard;
