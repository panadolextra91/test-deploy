import React, { useState, useEffect, useCallback } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    BellOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Table, Input, message, Tag, Badge, Dropdown, List, Spin } from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import AddInvoice from "./AddInvoice";
import EditInvoice from "./EditInvoice";
import { useNavigate } from "react-router-dom";
import "./SalesInvoices.css";

const SalesInvoices = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });
    const userRole = sessionStorage.getItem("userRole");
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchInvoices();
        // Only fetch profile if avatar URL is not in sessionStorage
        if (!sessionStorage.getItem('userAvatarUrl')) {
            fetchUserProfile();
        } else {
            fetchUserProfile(); // Still fetch for userId
        }
    }, []);

    // Fetch notifications when userId is available
    useEffect(() => {
        if (userId) {
            const token = sessionStorage.getItem('token');
            fetchNotifications(token);
            fetchNotificationCount(token);
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data.avatarUrl) {
                // Save to sessionStorage
                sessionStorage.setItem('userAvatarUrl', response.data.avatarUrl);
                setAvatarUrl(response.data.avatarUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
            setUserId(response.data.id);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Don't show error message to user for avatar loading failure
            setAvatarUrl(null);
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
                    params: { include_resolved: 'false' }
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
        const token = sessionStorage.getItem('token');
        try {
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchNotifications(token);
            fetchNotificationCount(token);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            message.error("Unable to mark notification as read.");
        }
    };

    const markAllNotificationsAsRead = async () => {
        const token = sessionStorage.getItem('token');
        try {
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/notifications/user/${userId}/read/all`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchNotifications(token);
            fetchNotificationCount(token);
            message.success("All notifications marked as read.");
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const fetchInvoices = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Use sessionStorage consistently
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/invoices`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const fetchedInvoices = response.data.map((invoice) => ({
                ...invoice,
                customerName: invoice.customer?.name || "N/A",
                customerPhone: invoice.customer?.phone || "N/A",
                totalAmount: Number(invoice.total_amount),
                items: invoice.items.map((item) => ({
                    ...item,
                    name: item.medicine?.name || item.product?.name || "N/A",
                    brand: item.product?.brand || "",
                    supplier: item.product?.supplier?.name || "",
                })),
            }));
            setInvoices(fetchedInvoices);
            setFilteredInvoices(fetchedInvoices);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            message.error("Failed to fetch invoices");
        }
    };

    const handleSearch = (value) => {
        if (!value.trim()) {
            setFilteredInvoices(invoices); // Show all invoices if the input is empty
            return;
        }

        const filtered = invoices.filter((invoice) =>
            invoice.customerPhone.includes(value.trim())
        );

        setFilteredInvoices(filtered);

        if (filtered.length === 0) {
            message.warning("No invoices found for this phone number.");
        }
    };

    const handleAvatarClick = () => {
        navigate("/profile");
    };

    const showAddInvoiceModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditInvoiceModal = (invoice) => {
        setEditingInvoice(invoice);
        setIsEditModalVisible(true);
    };

    const deleteInvoice = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Remove the deleted invoice from both invoices and filteredInvoices state
            setInvoices(invoices.filter((invoice) => invoice.id !== id));
            setFilteredInvoices(filteredInvoices.filter((invoice) => invoice.id !== id));
            message.success("Invoice deleted successfully");
            // Optionally, you can call fetchInvoices() to ensure data consistency
            // fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            message.error("Failed to delete invoice");
        }
    };

    const handleCancel = () => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
        setEditingInvoice(null);
    };

    const columns = [
        {
            title: "Customer Name",
            dataIndex: "customerName",
            key: "customerName",
            align: 'center',
        },
        {
            title: "Customer Phone",
            dataIndex: "customerPhone",
            key: "customerPhone",
            align: 'center',
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            align: 'center',
            render: (type) => type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
        },
        {
            title: "Total Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            align: 'center',
            render: (text, record) => <Tag color={record.type === 'sale' ? 'green' : record.type === 'purchase' ? 'red' : 'blue'}>${text.toFixed(2)}</Tag>,
        },
        {
            title: "Created Date",
            dataIndex: "invoice_date",
            key: "invoice_date",
            align: 'center',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
        {
            title: "Actions",
            key: "actions",
            align: 'center',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showEditInvoiceModal(record)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Edit
                    </Button>
                    <Button 
                        size="small" 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => deleteInvoice(record.id)}
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
        <div className="sales-container">
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}

            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Sales & Invoices Management</h1>
                        <p>Dashboard / Sales & Invoices</p>
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
                                src={avatarUrl}
                                onError={() => {
                                    setAvatarUrl(null);
                                    sessionStorage.removeItem('userAvatarUrl');
                                }}
                            />
                        </div>
                    </div>
                </header>

                <div className="sales-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button
                                className="add-button"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showAddInvoiceModal}
                            >
                                Add Invoice
                            </Button>
                            <Search
                                className="search-bar"
                                placeholder="Search by customer phone"
                                allowClear
                                onSearch={handleSearch}
                            />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table 
                            columns={columns} 
                            dataSource={filteredInvoices} 
                            rowKey="id"
                            size="small"
                            scroll={{ x: 1200 }}
                        />
                    </div>
                </div>

                <AddInvoice
                    visible={isAddModalVisible}
                    onCreate={(newInvoice) => { // Handle onCreate callback
                        setIsAddModalVisible(false);
                        fetchInvoices(); // Refresh the list
                    }}
                    onCancel={handleCancel}
                />
                <EditInvoice
                    visible={isEditModalVisible}
                    onEdit={(updatedInvoice) => {
                        setIsEditModalVisible(false);
                        fetchInvoices(); // Refresh the list
                    }}
                    onCancel={handleCancel}
                    invoice={editingInvoice}
                />
            </main>
        </div>
    );
};

export default SalesInvoices;
