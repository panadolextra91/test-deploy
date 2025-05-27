import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Card, message, Badge, Dropdown, Button, List, Spin, Col, Row, DatePicker, Select } from "antd";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import { Bar, Line, Pie } from "@ant-design/plots";
import axios from "axios";
import { getSessionData } from "../utils/sessionUtils";
import "./PharmacistDashboard.css";
import PharmacistSidebar from "./PharmacistSidebar";

const { RangePicker } = DatePicker;
const { Option } = Select;

const PharmacistDashboard = () => {
  const [dailyIncomeData, setDailyIncomeData] = useState([]);
  const [sellingMedicinesData, setSellingMedicinesData] = useState([]);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(() => sessionStorage.getItem('userAvatarUrl')); // Initialize with full URL
  const [revenueData, setRevenueData] = useState({ income: 0, outcome: 0, total: 0 });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [nearExpiryAlerts, setNearExpiryAlerts] = useState([]);
  const [outOfStockAlerts, setOutOfStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Top brands state variables
  const [topBrandsData, setTopBrandsData] = useState([]);
  const [topBrandsDateRange, setTopBrandsDateRange] = useState(null);
  const [topBrandsLoading, setTopBrandsLoading] = useState(false);
  
  // Sales by category state variables
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
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const fetchUserProfile = useCallback(async (token) => {
    if (!token || !backendUrl) return;
    try {
      const response = await axios.get(`${backendUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;
      setUserName(userData.name);
      if (userData.avatarUrl) {
        const fullUrl = userData.avatarUrl.startsWith('http')
          ? userData.avatarUrl
          : `${backendUrl}${userData.avatarUrl.startsWith('/') ? '' : '/'}${userData.avatarUrl.replace(/\\/g, '/')}`;
        sessionStorage.setItem('userAvatarUrl', fullUrl);
        setAvatarUrl(fullUrl);
      } else {
        sessionStorage.removeItem('userAvatarUrl');
        setAvatarUrl(null);
      }
      setUserId(userData.id); // Crucial for triggering notification fetch
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // message.error("Unable to load user profile."); // Avoid too many messages
      setAvatarUrl(null); // Fallback
      sessionStorage.removeItem('userAvatarUrl');
    }
  }, [backendUrl]);

  const fetchSellingMedicinesData = useCallback(async (token) => {
    if (!token || !backendUrl) return;
    try {
      const response = await axios.get(`${backendUrl}/api/invoices/sales/selling-medicines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellingMedicinesData(response.data);
    } catch (error) {
      console.error("Failed to fetch selling medicines data:", error);
      message.error("Unable to load selling medicines data.");
    }
  }, [backendUrl]);

  const fetchDailyIncome = useCallback(async (token) => {
    if (!token || !backendUrl) return;
    try {
      const response = await axios.get(
          `${backendUrl}/api/invoices/sales/daily-income`,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      const formattedData = response.data.map((item) => ({
        date: item.date,
        total_income: parseFloat(item.total_income),
      }));
      setDailyIncomeData(formattedData);
    } catch (error) {
      console.error("Failed to fetch daily income data:", error);
      message.error("Unable to load daily income data.");
    }
  }, [backendUrl]);

  const fetchRevenueData = useCallback(async (token) => {
    if (!token || !backendUrl) return;
    try {
      const response = await axios.get(`${backendUrl}/api/invoices/revenue/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRevenueData(response.data);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
      message.error("Unable to load revenue data.");
    }
  }, [backendUrl]);

  const fetchDashboardData = useCallback(async (token) => {
    if (!token || !backendUrl) return;
    try {
      const [lowStockRes, nearExpiryRes, outOfStockRes] = await Promise.all([
        axios.get(`${backendUrl}/api/medicines/low-stock`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${backendUrl}/api/medicines/near-expiry`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${backendUrl}/api/medicines/out-of-stock`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setLowStockAlerts(lowStockRes.data);
      setNearExpiryAlerts(nearExpiryRes.data);
      setOutOfStockAlerts(outOfStockRes.data);
    } catch (error) {
      console.error("Failed to load dashboard alerts data:", error);
      message.error("Unable to load dashboard alerts data.");
    }
  }, [backendUrl]);

  // New function for fetching top brands data
  const fetchTopBrandsData = useCallback(async (startDate, endDate) => {
    const { token } = getSessionData();
    if (!token || !backendUrl) return;
    
    setTopBrandsLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/invoices/sales/top-brands-by-date`,
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
  }, [backendUrl]);

  // New function for fetching sales by category data
  const fetchSalesByCategoryData = useCallback(async (startDate, endDate, type = 'revenue') => {
    const { token } = getSessionData();
    if (!token || !backendUrl) return;
    
    setCategoryLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/invoices/sales/by-category`,
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
  }, [backendUrl]);

  // Handler for top brands date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setTopBrandsDateRange(dates);
      fetchTopBrandsData(dates[0], dates[1]);
    }
  };

  // Handler for category date range change
  const handleCategoryDateRangeChange = (dates) => {
    setCategoryDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      fetchSalesByCategoryData(dates[0], dates[1], categoryAnalysisType);
    } else {
      fetchSalesByCategoryData(null, null, categoryAnalysisType);
    }
  };

  // Handler for category analysis type change
  const handleCategoryTypeChange = (type) => {
    setCategoryAnalysisType(type);
    if (categoryDateRange && categoryDateRange[0] && categoryDateRange[1]) {
      fetchSalesByCategoryData(categoryDateRange[0], categoryDateRange[1], type);
    } else {
      fetchSalesByCategoryData(null, null, type);
    }
  };

  // Main useEffect for initial data fetching
  useEffect(() => {
    const { token, role } = getSessionData();
    if (!token || role !== "pharmacist") {
      message.error("Unauthorized access.");
      navigate(role === "admin" ? "/admin-dashboard" : "/");
      return;
    }
    setLoading(true);
    Promise.all([
      fetchSellingMedicinesData(token),
      fetchDailyIncome(token),
      fetchRevenueData(token),
      fetchDashboardData(token),
      fetchUserProfile(token), // Fetch profile unconditionally
      fetchSalesByCategoryData(null, null, 'revenue') // Load initial category data
    ]).finally(() => setLoading(false));
  }, [navigate, fetchUserProfile, fetchSellingMedicinesData, fetchDailyIncome, fetchRevenueData, fetchDashboardData, fetchSalesByCategoryData]);

  const fetchNotifications = useCallback(async (token) => {
    if (!userId || !token || !backendUrl) return;
    setNotificationLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/notifications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { include_resolved: 'false' }
        }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // message.error("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }, [userId, backendUrl]);

  const fetchNotificationCount = useCallback(async (token) => {
    if (!userId || !token || !backendUrl) return;
    try {
      const response = await axios.get(
        `${backendUrl}/api/notifications/user/${userId}/unread/count`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNotificationCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [userId, backendUrl]);

  // Fetch notifications when userId is available
  useEffect(() => {
    const { token } = getSessionData();
    if (userId && token) {
      fetchNotifications(token);
      fetchNotificationCount(token);
    }
  }, [userId, fetchNotifications, fetchNotificationCount]);


  const markNotificationAsRead = async (notificationId) => {
    const { token } = getSessionData();
    if (!token || !userId) return;
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications(token);
      fetchNotificationCount(token);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      message.error("Unable to mark notification as read.");
    }
  };

  const markAllNotificationsAsRead = async () => {
    const { token } = getSessionData();
    if (!token || !userId) return;
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/user/${userId}/read/all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications(token);
      fetchNotificationCount(token);
      message.success("All notifications marked as read.");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      message.error("Unable to mark all notifications as read.");
    }
  };

  const revenueChartConfig = {
    data: [
      { type: "Income", value: revenueData.income || 0 },
      { type: "Outcome", value: revenueData.outcome || 0 },
    ],
    xField: "type",
    yField: "value",
    colorField: "type",
    height: 250,
    padding: 'auto',
  };

  const sellingMedicinesChartConfig = {
    data: sellingMedicinesData.map((item) => ({
      name: item.medicine?.name || "Unknown Medicine",
      quantity: parseInt(item.total_quantity) || 0,
    })),
    xField: 'name',
    yField: 'quantity',
    colorField: 'name',
    meta: {
      quantity: { alias: 'Quantity Sold' },
      name: { alias: 'Medicine' },
    },
    height: 300,
    padding: 'auto',
  };

  const dailyIncomeChartConfig = {
    data: dailyIncomeData,
    xField: 'date',
    yField: 'total_income',
    xAxis: { type: 'time', tickCount: 5, title: { text: 'Date', style: { fontSize: 10 } } },
    yAxis: { label: { formatter: (value) => `$${Math.round(value / 1000)}k` }, title: { text: 'Income', style: { fontSize: 10 } } },
    smooth: true,
    point: { size: 3, shape: 'circle' },
    height: 250,
    padding: 'auto',
  };

  // New chart config for top brands
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
    height: 300,
    padding: 'auto',
  };

  // New chart config for sales by category
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Notifications ({notificationCount})</span>
            {notificationCount > 0 && (
              <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }} style={{ padding: 0, fontSize: '12px' }}>
                Mark all as read
              </Button>
            )}
          </div>
          {notificationLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="small" /></div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>No new notifications</div>
          ) : (
            <List
              size="small"
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: notification.is_read ? '#fff' : '#f6ffed', borderBottom: '1px solid #f0f0f0' }}
                  onClick={(e) => { e.stopPropagation(); if (!notification.is_read) markNotificationAsRead(notification.id); }}
                >
                  <List.Item.Meta
                    title={<div style={{ fontSize: '13px', fontWeight: notification.is_read ? 'normal' : 'bold', marginBottom: '4px' }}>{notification.title}</div>}
                    description={
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{notification.message}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{new Date(notification.created_at).toLocaleString()}</div>
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
        <PharmacistSidebar />
        <main className="main-content">
          <header className="header">
            <div className="header-left">
              <h1>Welcome Back, {userName || "Pharmacist"}</h1>
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
                  <Button type="text" icon={<BellOutlined />} size="large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }} />
                </Badge>
              </Dropdown>
              <div onClick={handleAvatarClick} style={{cursor: "pointer"}}>
                <Avatar 
                  size={50} 
                  icon={!avatarUrl && <UserOutlined />}
                  src={avatarUrl} // Assumes avatarUrl in state is the full URL
                  onError={() => {
                    setAvatarUrl(null); // Fallback if src fails
                    sessionStorage.removeItem('userAvatarUrl');
                  }}
                />
              </div>
            </div>
          </header>

          <Spin spinning={loading} tip="Loading Dashboard Data...">
            <section className="alerts">
                <Card size="small" title="Out Of Stock" className="alert-card">
                    <ul>{outOfStockAlerts.length > 0 ? outOfStockAlerts.map((alert) => (<li key={alert.id}>{alert.name} - {alert.quantity} left</li>)) : <li>No items out of stock.</li>}</ul>
                </Card>
                <Card size="small" title="Low Stock" className="alert-card">
                    <ul>{lowStockAlerts.length > 0 ? lowStockAlerts.map((alert) => (<li key={alert.id}>{alert.name} - {alert.quantity} left</li>)) : <li>No items with low stock.</li>}</ul>
                </Card>
                <Card size="small" title="Near Expiry" className="alert-card">
                    <ul>{nearExpiryAlerts.length > 0 ? nearExpiryAlerts.map((alert) => (<li key={alert.id}>{alert.name} - Expires on {new Date(alert.expiry_date).toLocaleDateString()}</li>)) : <li>No items nearing expiry.</li>}</ul>
                </Card>
            </section>

            <Row gutter={[16, 16]} className="charts-row">
              <Col xs={24} lg={12}>
                <Card title="Total Revenue This Month" size="small">
                  <Bar {...revenueChartConfig} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Daily Income (This Month)" size="small">
                  <Line {...dailyIncomeChartConfig} />
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} className="charts-row" style={{marginTop: '16px'}}>
                <Col xs={24}>
                    <Card title="Top Selling Medicines (All Time)" size="small">
                        <Bar {...sellingMedicinesChartConfig} />
                    </Card>
                </Col>
            </Row>

            {/* New Top Brands Section */}
            <Row gutter={[16, 16]} className="charts-row" style={{marginTop: '16px'}}>
              <Col xs={24}>
                <Card 
                  title="Top 5 Selling Brands by Revenue"
                  loading={topBrandsLoading}
                  size="small"
                  extra={
                    <RangePicker
                      onChange={handleDateRangeChange}
                      format="YYYY-MM-DD"
                      placeholder={['Start Date', 'End Date']}
                      style={{ width: 250 }}
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
              </Col>
            </Row>

            {/* New Sales by Category Section */}
            <Row gutter={[16, 16]} className="charts-row" style={{marginTop: '16px'}}>
              <Col xs={24}>
                <Card 
                  title="Sales by Medicine Category"
                  loading={categoryLoading}
                  size="small"
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
                        style={{ width: 250 }}
                        allowClear
                      />
                    </div>
                  }
                >
                  {salesByCategoryData.length > 0 ? (
                    <>
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <Pie {...salesByCategoryChartConfig} />
                        </div>
                        <div style={{ flex: 1, minWidth: '300px' }}>
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
              </Col>
            </Row>
          </Spin>
        </main>
      </div>
  );
};

export default PharmacistDashboard;