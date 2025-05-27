import React, { useState, useEffect, useCallback } from "react";
import {
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    EyeOutlined,
    BellOutlined,
} from "@ant-design/icons";
import { Table, Button, message, Avatar, Input, Badge, Dropdown, List, Spin } from "antd";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import "./Medicines.css"; // Assuming this contains relevant styles
import axios from "axios";
import AddCustomerForm from "./AddCustomerForm";
import CustomerDetailsForm from "./CustomerDetailsForm";
import { useNavigate } from "react-router-dom";

const CustomerManage = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [isAddCustomerVisible, setIsAddCustomerVisible] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState(() => sessionStorage.getItem('userAvatarUrl')); // Initialize with full URL
    const userRole = sessionStorage.getItem("userRole");
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            console.log('CustomerManage: Token or backendUrl missing for profile fetch.');
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
            if (userData.avatarUrl) {
                // Ensure the URL is absolute or correctly prefixed
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
        } catch (error) {
            console.error("CustomerManage: Failed to fetch user profile:", error);
            setAvatarUrl(null); // Fallback
            sessionStorage.removeItem('userAvatarUrl');
        }
    }, [backendUrl]);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            if (!token || !backendUrl) {
                message.error("Authentication token or backend URL is missing.");
                setLoading(false);
                return;
            }
            const response = await axios.get(`${backendUrl}/api/customers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data || []);
        } catch (error) {
            console.error("CustomerManage: Failed to fetch customer data:", error);
            message.error("Failed to fetch customer data.");
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);

    // Main useEffect for initial data fetching
    useEffect(() => {
        fetchUserProfile(); // Fetch profile unconditionally to get userId
        fetchCustomers();
    }, [fetchUserProfile, fetchCustomers]);


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
            console.error("CustomerManage: Failed to fetch notifications:", error);
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
            console.error("CustomerManage: Failed to fetch notification count:", error);
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
        if (!token || !userId) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications(token); // Re-fetch to update list
            fetchNotificationCount(token); // Re-fetch to update count
        } catch (error) {
            console.error("CustomerManage: Failed to mark notification as read:", error);
            message.error("Unable to mark notification as read.");
        }
    };

    const markAllNotificationsAsRead = async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/user/${userId}/read/all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications(token); // Re-fetch
            fetchNotificationCount(token); // Re-fetch
            message.success("All notifications marked as read.");
        } catch (error) {
            console.error("CustomerManage: Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const onSearch = async (value) => {
        const token = sessionStorage.getItem("token");
        if (!value) {
            fetchCustomers(); // Fetch all if search is cleared
            return;
        }
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(
                `${backendUrl}/api/customers/phone/${value}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(response.data ? [response.data] : []);
            message.success(response.data ? `Found customer with phone number "${value}".` : `No customer found for phone number "${value}".`);
        } catch (error) {
            console.error("CustomerManage: Error searching customers:", error);
            setCustomers([]);
            message.error(`No customer found for phone number "${value}".`);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => navigate("/profile");

    const handleAddCustomer = async (values) => {
        try {
            const token = sessionStorage.getItem("token");
            if (!token || !backendUrl) {
                message.error("Authentication token or backend URL is missing.");
                return;
            }
            const response = await axios.post(
                `${backendUrl}/api/customers`,
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(prevCustomers => [response.data, ...prevCustomers]);
            message.success("Customer added successfully.");
            setIsAddCustomerVisible(false);
        } catch (error) {
            console.error("CustomerManage: Failed to add customer:", error);
            message.error(error.response?.data?.error || "Failed to add customer.");
        }
    };

    const handleDeleteCustomer = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            if (!token || !backendUrl) {
                message.error("Authentication token or backend URL is missing.");
                return;
            }
            await axios.delete(
                `${backendUrl}/api/customers/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(prevCustomers => prevCustomers.filter((customer) => customer.id !== id));
            message.success("Customer deleted successfully.");
        } catch (error) {
            console.error("CustomerManage: Failed to delete customer:", error);
            message.error(error.response?.data?.error || "Failed to delete customer.");
        }
    };

    const columns = [
        { title: "Name", dataIndex: "name", key: "name", align: 'center' },
        { title: "Phone", dataIndex: "phone", key: "phone", align: 'center' },
        { title: "Email", dataIndex: "email", key: "email", align: 'center' },
        {
            title: "Actions", key: "actions", align: 'center', render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => setViewingCustomer(record)}
                        type="primary"
                        ghost
                        style={{ borderRadius: 50, minWidth: '80px', minHeight: '32px' }}
                        size="small"
                    >
                        Details
                    </Button>
                    <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteCustomer(record.id)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

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
        <div className="medicines-container">
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Customer Management</h1>
                        <p>Dashboard / Customer Management</p>
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
                        <div onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
                            <Avatar 
                                size={50} 
                                icon={!avatarUrl && <UserOutlined />} 
                                src={avatarUrl} // Directly use the state which should be a full URL
                                onError={() => { 
                                    setAvatarUrl(null); // Fallback if src fails
                                    sessionStorage.removeItem('userAvatarUrl'); 
                                }} 
                            />
                        </div>
                    </div>
                </header>
                <div className="medicines-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button className="add-button" type="primary" icon={<PlusOutlined />} onClick={() => setIsAddCustomerVisible(true)}>
                                Add Customer
                            </Button>
                            <Search className="search-bar" placeholder="Search customers by phone..." allowClear onSearch={onSearch} />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={customers}
                            rowKey={(record) => record.id}
                            loading={loading}
                            size="small"
                            scroll={{ x: 1200 }}
                        />
                    </div>
                </div>
                <AddCustomerForm
                    visible={isAddCustomerVisible}
                    onCreate={handleAddCustomer}
                    onCancel={() => setIsAddCustomerVisible(false)}
                />
                <CustomerDetailsForm
                    visible={!!viewingCustomer}
                    customerId={viewingCustomer?.id}
                    onCancel={() => {
                        setViewingCustomer(null);
                    }}
                    onUpdate={() => {
                        fetchCustomers(); // Refreshes the customer list in the background
                    }}
                />
            </main>
        </div>
    );
};

export default CustomerManage;
