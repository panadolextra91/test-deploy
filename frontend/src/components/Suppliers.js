import React, { useEffect, useState, useCallback } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    BellOutlined
} from '@ant-design/icons';
import { Avatar, Button, message, Space, Table, Badge, Dropdown, List, Spin } from "antd";
import './Suppliers.css';
import AddSupplierForm from "./AddSupplierForm";
import EditSupplierForm from "./EditSupplierForm";
import axios from "axios";
import PharmacistSidebar from "./PharmacistSidebar";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";

const Suppliers = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${backendUrl}${savedAvatarUrl}` : null;
    });

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchSuppliers();
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

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const userRole = sessionStorage.getItem('userRole');

    const fetchUserProfile = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
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
                `${backendUrl}/api/notifications/user/${userId}`,
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
                `${backendUrl}/api/notifications/user/${userId}/unread/count`,
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
                `${backendUrl}/api/notifications/${notificationId}/read`,
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
                `${backendUrl}/api/notifications/user/${userId}/read/all`,
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

    const fetchSuppliers = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Use sessionStorage consistently
            const response = await axios.get(`${backendUrl}/api/suppliers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const fetchedSuppliers = response.data.map(supplier => ({
                key: supplier.id,
                name: supplier.name,
                contact: supplier.contact_info,
                address: supplier.address
            }));
            setSuppliers(fetchedSuppliers);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            if (error.response && error.response.status === 401) {
                message.error('Unauthorized');
            } else {
                message.error('Failed to fetch suppliers');
            }
        }
    };

    const showAddSupplierModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditSupplierModal = (key) => {
        const supplierToEdit = suppliers.find(supplier => supplier.key === key);
        setCurrentSupplier(supplierToEdit);
        setIsEditModalVisible(true);
    };

    const handleAddSupplier = async (values) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(`${backendUrl}/api/suppliers`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers([...suppliers, {
                key: response.data.id,
                name: response.data.name,
                contact: response.data.contact_info,
                address: response.data.address
            }]);
            message.success("Supplier added successfully.");
            setIsAddModalVisible(false);
        } catch (error) {
            console.error("Error adding supplier:", error);
            message.error("Failed to add supplier.");
        }
    };

    const handleEditSupplier = async (values) => {
        try {
            const token = sessionStorage.getItem('token');
            const payload = {
                name: values.name,
                contact_info: values.contact_info,
                address: values.address
            };

            await axios.put(
                `${backendUrl}/api/suppliers/${currentSupplier.key}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const updatedSuppliers = suppliers.map(sup =>
                sup.key === currentSupplier.key ? { ...sup, ...payload } : sup
            );
            setSuppliers(updatedSuppliers);
            message.success("Supplier updated successfully.");
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Error updating supplier:", error);
            message.error("Failed to update supplier.");
        }
    };

    const handleCancelAdd = () => {
        setIsAddModalVisible(false);
    };

    const handleCancelEdit = () => {
        setIsEditModalVisible(false);
    };

    const deleteSupplier = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${backendUrl}/api/suppliers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(suppliers.filter(supplier => supplier.key !== id));
            message.success("Supplier deleted successfully.");
        } catch (error) {
            console.error("Error deleting supplier:", error);
            message.error("Failed to delete supplier.");
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            align: 'center'
        },
        {
            title: 'Contact',
            dataIndex: 'contact',
            key: 'contact',
            align: 'center'
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            align: 'center'
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (text, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} style={{ borderRadius: 50 }} onClick={() => showEditSupplierModal(record.key)}>Edit</Button>
                    <Button icon={<DeleteOutlined />} style={{ borderRadius: 50 }} danger onClick={() => deleteSupplier(record.key)}>Delete</Button>
                </Space>
            )
        }
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
        <div className="suppliers-container">
            { userRole === 'admin' ? <AdminSidebar/> : <PharmacistSidebar/>}

            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Suppliers</h1>
                        <p>Dashboard / Supplies / Supplier List</p>
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
                                src={avatarUrl}
                                onError={() => {
                                    setAvatarUrl(null);
                                    sessionStorage.removeItem('userAvatarUrl');
                                }}
                            />
                        </div>
                    </div>
                </header>
                <div className="suppliers-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button
                                className="add-button"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showAddSupplierModal}
                            >
                                Add Supplier
                            </Button>
                        </div>
                    </div>
                    <div className="table-container">
                        <Table 
                            columns={columns} 
                            dataSource={suppliers}
                            scroll={{ x: 800 }}
                            size="small"
                            rowKey="key"
                        />
                    </div>
                </div>
                <AddSupplierForm
                    visible={isAddModalVisible}
                    onCreate={handleAddSupplier}
                    onCancel={handleCancelAdd}
                />
                <EditSupplierForm
                    visible={isEditModalVisible}
                    onEdit={handleEditSupplier}
                    onCancel={handleCancelEdit}
                    supplier={currentSupplier}
                />
            </main>
        </div>
    );
};

export default Suppliers;
