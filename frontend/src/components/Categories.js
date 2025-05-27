import React, { useState, useEffect, useCallback } from "react";
import {
    UserOutlined,
    EditOutlined,
    BellOutlined,
    // PlusOutlined, // PlusOutlined was imported but not used, consider removing if no add category feature
    // DeleteOutlined // DeleteOutlined was imported but not used, consider removing if no delete category feature
} from '@ant-design/icons';
import { Avatar, Button, Table, message, Badge, Dropdown, List, Spin } from "antd";
import axios from "axios";
import './Medicines.css'; // Assuming this contains relevant styles
import EditCategoryForm from "./EditCategoryForm";
import PharmacistSidebar from "./PharmacistSidebar";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";

const Categories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        // Initialize directly from sessionStorage, fetchUserProfile will confirm/update
        return savedAvatarUrl; 
    });

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const userRole = sessionStorage.getItem('userRole');

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            console.log('No token or backend URL available for profile fetch in Categories');
            return;
        }
        
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const userData = response.data;
            if (userData.avatarUrl) { // Assuming backend sends avatarUrl directly
                // The avatarUrl from backend might already be a full URL or a relative path
                // If it's relative, it should be handled consistently.
                // For now, let's assume it might be relative as in Brands.js if not full
                 const fullAvatarUrl = userData.avatarUrl.startsWith('http') 
                    ? userData.avatarUrl
                    : `${backendUrl}${userData.avatarUrl.startsWith('/') ? '' : '/'}${userData.avatarUrl.replace(/\\/g, '/')}`;

                setAvatarUrl(fullAvatarUrl);
                sessionStorage.setItem('userAvatarUrl', fullAvatarUrl); // Save the full URL
            } else {
                setAvatarUrl(null);
                sessionStorage.removeItem('userAvatarUrl');
            }
            setUserId(userData.id); // Set userId, which will trigger notification fetch
        } catch (error) {
            console.error('Error fetching user profile in Categories:', error);
            setAvatarUrl(null); // Fallback
            sessionStorage.removeItem('userAvatarUrl');
        }
    }, [backendUrl]);


    const fetchCategories = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${backendUrl}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedCategories = response.data.map(category => ({
                key: category.id,
                category: category.name,
                des: category.description
            }));
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (error.response && error.response.status === 401) {
                message.error('Unauthorized. Please log in again.');
            } else {
                message.error('Failed to fetch categories');
            }
        }
    }, [backendUrl]);

    // Main useEffect for initial data fetching
    useEffect(() => {
        fetchCategories();
        fetchUserProfile(); // Always fetch user profile to get userId for notifications
    }, [fetchCategories, fetchUserProfile]); // Add memoized functions as dependencies

    // Fetch notifications when userId is available
    const fetchNotifications = useCallback(async (token) => {
        if (!userId || !token || !backendUrl) return;
        
        setNotificationLoading(true);
        try {
            const response = await axios.get(
                `${backendUrl}/api/notifications/user/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { include_resolved: 'false' } // Fetch only unread/active
                }
            );
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            // message.error("Unable to load notifications."); // Avoid too many messages
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
    
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (userId && token) {
            fetchNotifications(token);
            fetchNotificationCount(token);
        }
    }, [userId, fetchNotifications, fetchNotificationCount]);


    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const markNotificationAsRead = async (notificationId) => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Re-fetch immediately after marking as read
            fetchNotifications(token);
            fetchNotificationCount(token);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
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
            // Re-fetch immediately
            fetchNotifications(token);
            fetchNotificationCount(token);
            message.success("All notifications marked as read.");
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const showEditCategoryModal = (key) => {
        const categoryToEdit = categories.find(category => category.key === key);
        setCurrentCategory(categoryToEdit);
        setIsEditModalVisible(true);
    };

    const handleEditCategory = async (values) => {
        try {
            const token = sessionStorage.getItem('token');
            const payload = {
                name: values.name,
                description: values.des
            };
            await axios.put(`${backendUrl}/api/categories/${currentCategory.key}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Category updated successfully');
            fetchCategories();
            setIsEditModalVisible(false);
        } catch (error) {
            console.error('Error updating category:', error);
            message.error('Failed to update category');
        }
    };

    const handleCancelEdit = () => {
        setIsEditModalVisible(false);
        setCurrentCategory(null); // Clear current category on cancel
    };

    // deleteCategory function was in original code but no delete button, keeping it for completeness if needed later
    // const deleteCategory = async (key) => {
    //     try {
    //         const token = sessionStorage.getItem('token');
    //         await axios.delete(`${backendUrl}/api/categories/${key}`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //         message.success('Category deleted successfully');
    //         fetchCategories(); 
    //     } catch (error) {
    //         console.error('Error deleting category:', error);
    //         message.error('Failed to delete category');
    //     }
    // };

    const columns = [
        { title: 'Category', dataIndex: 'category', key: 'category', align: 'center' },
        { title: 'Description', dataIndex: 'des', key: 'des', align: 'center' },
        {
            title: 'Actions', key: 'actions', align: 'center', render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showEditCategoryModal(record.key)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Edit
                    </Button>
                    {/* Add Delete Button here if needed, using deleteCategory(record.key) */}
                </div>
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
        <div className="medicines-container">
            {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Categories Management</h1>
                        <p>Dashboard / Categories</p>
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
                        <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                            <Avatar 
                                size={50} 
                                icon={!avatarUrl && <UserOutlined />}
                                src={avatarUrl} // Directly use the state which might be full URL
                                onError={() => {
                                    setAvatarUrl(null); // Fallback if src fails
                                    sessionStorage.removeItem('userAvatarUrl'); // Clear potentially bad URL
                                }}
                            />
                        </div>
                    </div>
                </header>
                <div className="medicines-table">
                    <div className="table-container">
                        <Table 
                            columns={columns} 
                            dataSource={categories} 
                            size="small"
                            scroll={{ x: 1000 }}
                            rowKey="key"
                        />
                    </div>
                </div>
                <EditCategoryForm
                    visible={isEditModalVisible}
                    onEdit={handleEditCategory}
                    onCancel={handleCancelEdit}
                    category={currentCategory}
                />
            </main>
        </div>
    );
};

export default Categories;