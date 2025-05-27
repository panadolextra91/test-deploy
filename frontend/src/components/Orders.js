import React, { useState, useEffect, useCallback } from "react";
import {
    UserOutlined,
    EyeOutlined,
    BellOutlined, // Added BellOutlined
} from '@ant-design/icons';
import { Avatar, Button, Table, Tag, message, Input, Badge, Dropdown, List, Spin } from "antd"; // Added Badge, Dropdown, List, Spin
import axios from "axios";
import './Orders.css'; // Assuming this contains relevant styles
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import OrderDetailsForm from "./OderDetailsForm"; // Corrected typo from OderDetailsForm to OrderDetailsForm if that was intended
import { useNavigate } from "react-router-dom";
import { getSessionData } from "../utils/sessionUtils";

const { Search } = Input;

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false);
    const [userRole, setUserRole] = useState(() => sessionStorage.getItem('userRole')); // Initialize from session
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState(() => sessionStorage.getItem('userAvatarUrl')); // Initialize with full URL

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            console.log('Orders: Token or backendUrl missing for profile fetch.');
            // Redirect to login if no token, but don't navigate if only backendUrl is missing temporarily
            if (!token) navigate('/login');
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
            setUserRole(userData.role); // Set role from fetched profile
            sessionStorage.setItem('userRole', userData.role); // Update role in session

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
            setUserId(userData.id); // This is crucial for notifications

            // Check role again after fetching, though initial check is also good
            if (!['admin', 'pharmacist'].includes(userData.role)) {
                message.error('You do not have permission to view this page');
                navigate('/');
            }

        } catch (error) {
            console.error("Orders: Failed to fetch user profile:", error);
            setAvatarUrl(null); // Fallback
            sessionStorage.removeItem('userAvatarUrl');
            if (error.response && error.response.status === 401) { // Unauthorized
                sessionStorage.clear(); // Clear all session data
                navigate('/login');
            }
        }
    }, [navigate, backendUrl]);

    const fetchOrders = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(response.data || []);
        } catch (error) {
            console.error('Orders: Error fetching orders:', error);
            message.error('Failed to fetch orders. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);
    
    // Main useEffect for initial data fetching
    useEffect(() => {
        const { token, role: roleFromSession } = getSessionData();
        if (!token || !['admin', 'pharmacist'].includes(roleFromSession) ) {
            message.error("Unauthorized access or invalid role.");
            navigate(roleFromSession === "admin" || roleFromSession === "pharmacist" ? (roleFromSession === "admin" ? "/admin-dashboard" : "/dashboard") : "/");
            return;
        }
        
        fetchUserProfile(); // Fetch profile first to get userId and confirm role
        fetchOrders();
    }, [fetchUserProfile, fetchOrders, navigate]);


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
            setNotifications(response.data || []);
        } catch (error) {
            console.error("Orders: Failed to fetch notifications:", error);
            // message.error("Unable to load notifications."); // Can be noisy
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
            setNotificationCount(response.data.count || 0);
        } catch (error) {
            console.error("Orders: Failed to fetch notification count:", error);
        }
    }, [userId, backendUrl]);

    // Fetch notifications when userId is available
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (userId && token) {
            fetchNotifications(token);
            fetchNotificationCount(token);
        }
    }, [userId, fetchNotifications, fetchNotificationCount]);


    const markNotificationAsRead = async (notificationId) => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId || !backendUrl) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications(token); 
            fetchNotificationCount(token); 
        } catch (error) {
            console.error("Orders: Failed to mark notification as read:", error);
            message.error("Unable to mark notification as read.");
        }
    };

    const markAllNotificationsAsRead = async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId || !backendUrl) return;
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
            console.error("Orders: Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const onSearch = async (value) => {
        const token = sessionStorage.getItem("token");
        if (!value) {
            fetchOrders(); 
            return;
        }
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            return;
        }
        setLoading(true);
        try {
            const searchResponse = await axios.get(
                `${backendUrl}/api/orders/search?query=${encodeURIComponent(value)}`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrders(searchResponse.data || []);
            message.success(searchResponse.data && searchResponse.data.length > 0 ? `Found ${searchResponse.data.length} result(s) for "${value}".` : `No orders found for "${value}".`);
        } catch (error) {
            console.error('Orders: Error searching orders:', error);
            message.error(error.response?.data?.message || `Error searching for "${value}". Please try again.`);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsOrderDetailsVisible(true);
    };

    const handleOrderDetailsCancel = () => {
        setIsOrderDetailsVisible(false);
        setSelectedOrder(null); // Clear selected order
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (!['pending', 'approved', 'denied', 'completed'].includes(newStatus)) {
            message.error(`Invalid order status: ${newStatus}`);
            return;
        }
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            return;
        }
        try {
            await axios.patch(
                `${backendUrl}/api/orders/${orderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success(`Order status updated to ${newStatus}`);
            fetchOrders(); 
            if (isOrderDetailsVisible) { // Close details modal after status update
                setIsOrderDetailsVisible(false);
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Orders: Error updating order status:', error);
            message.error('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'default';
        switch (status.toLowerCase()) {
            case 'pending': return 'gold';
            case 'denied': return 'red';
            case 'approved': return 'blue';
            case 'completed': return 'green';
            default: return 'default';
        }
    };

    const columns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', width: 60, align: 'center', fixed: 'left', render: (id) => <span>#{id}</span> },
        { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 150, align: 'center', render: (customer) => (<span>{customer?.name || 'N/A'}</span>) },
        { title: 'Pharmacy', dataIndex: 'pharmacy', key: 'pharmacy', width: 150, align: 'center', render: (pharmacy) => (<span>{pharmacy?.name || 'N/A'}</span>) },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120, align: 'center', render: (status) => (<Tag color={getStatusColor(status)} style={{fontWeight: 'bold'}}>{(status || 'N/A').toUpperCase()}</Tag>) },
        { title: 'Total Amount', dataIndex: 'total_amount', key: 'total_amount', width: 100, align: 'center', render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}` },
        { title: 'Created Date', dataIndex: 'created_at', key: 'created_at', width: 150, align: 'center', render: (date) => date ? new Date(date).toLocaleString() : 'N/A' },
        { title: 'Updated Date', dataIndex: 'updated_at', key: 'updated_at', width: 150, align: 'center', render: (date) => date ? new Date(date).toLocaleString() : 'N/A' },
        {
            title: 'Actions', key: 'actions', width: 100, fixed: 'right', align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button icon={<EyeOutlined />} onClick={() => viewOrderDetails(record)} type="primary" ghost style={{ borderRadius: 50, minWidth: '80px', minHeight: '32px' }} size="small">Details</Button>
                </div>
            )
        }
    ];

    const Sidebar = userRole === 'admin' ? AdminSidebar : PharmacistSidebar;

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
        <div className="orders-container">
            <Sidebar activeKey="orders" /> {/* Ensure activeKey is passed if Sidebar uses it */}
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Orders Management</h1>
                        <p>Dashboard / Orders</p>
                    </div>
                    <div className='header-right' style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                        <div onClick={handleAvatarClick} style={{cursor: 'pointer'}}>
                        <Avatar 
                            size={50} 
                            icon={!avatarUrl && <UserOutlined />}
                            src={avatarUrl} // Directly use state which should be full URL
                            onError={() => {
                                setAvatarUrl(null); // Fallback if src fails
                                sessionStorage.removeItem('userAvatarUrl'); 
                                return false; // Prevent default browser error icon
                            }}
                        />
                        </div>
                    </div>
                </header>

                <div className="orders-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Search
                                className="search-bar"
                                placeholder="Search by order ID or customer name"
                                allowClear
                                onSearch={onSearch}
                                style={{width: 300}} // Added width to search bar
                            />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={orders}
                            loading={loading}
                            scroll={{ x: 1500 }}
                            size="small"
                            rowKey="id"
                        />
                    </div>
                </div>

                {selectedOrder && ( // Conditionally render OrderDetailsForm
                    <OrderDetailsForm
                        visible={isOrderDetailsVisible}
                        order={selectedOrder}
                        onCancel={handleOrderDetailsCancel}
                        updateOrderStatus={updateOrderStatus}
                        getStatusColor={getStatusColor}
                    />
                )}
            </main>
        </div>
    );
};

export default Orders;
