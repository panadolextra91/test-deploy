import React, { useState, useEffect, useCallback } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    BellOutlined,
} from "@ant-design/icons";
import { Table, Button, message, Avatar, Modal, Tag, Badge, Dropdown, List, Spin } from "antd"; // Modal is not used, can be removed if not planned for future
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import AddUserForm from "./AddUserForm";
import EditUserForm from "./EditUserForm";
import "./Medicines.css"; // Assuming this contains relevant styles
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserManage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isAddUserVisible, setIsAddUserVisible] = useState(false);
    const [isEditUserVisible, setIsEditUserVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${backendUrl}${savedAvatarUrl}` : null;
    });

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const userRole = sessionStorage.getItem("userRole");

    useEffect(() => {
        fetchUsers();
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
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data.avatarUrl) {
                sessionStorage.setItem('userAvatarUrl', response.data.avatarUrl);
                setAvatarUrl(response.data.avatarUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
            setUserId(response.data.id);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
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

    const handleAvatarClick = () => {
        navigate("/profile");
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(`${backendUrl}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            message.error("Failed to fetch user data.");
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (values) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.post(
                `${backendUrl}/api/users`,
                values,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setUsers([response.data, ...users]); // Add new user to the beginning of the list
            message.success("User added successfully.");
            setIsAddUserVisible(false);
        } catch (error) {
            message.error(error.response?.data?.error || "Failed to add user.");
            console.error("Error adding user:", error);
        }
    };

    const handleEditUser = async (values) => {
        if (!editingUser || !editingUser.id) {
            message.error("No user selected for editing.");
            return;
        }
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.put(
                `${backendUrl}/api/users/${editingUser.id}`,
                values,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            const updatedUser = response.data;
            
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === updatedUser.id ? { ...user, ...updatedUser } : user
                )
            );
            
            message.success("User updated successfully.");
            setIsEditUserVisible(false);
            setEditingUser(null);
            // fetchUsers(); // Consider if a full refetch is always needed or if local update is sufficient
        } catch (error) {
            console.error("Error updating user:", error);
            message.error(error.response?.data?.error || "Failed to update user.");
        }
    };

    const handleDeleteUser = async (id) => {
        // Prevent admin from deleting themselves if they are the only admin
        if (userRole === 'admin') {
            const currentUser = users.find(user => user.id === id);
            if (currentUser && currentUser.role === 'admin') {
                const adminCount = users.filter(user => user.role === 'admin').length;
                if (adminCount <= 1) {
                    message.error("Cannot delete the only admin account.");
                    return;
                }
            }
        }

        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`${backendUrl}/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(users.filter((user) => user.id !== id));
            message.success("User deleted successfully.");
        } catch (error) {
            message.error(error.response?.data?.error || "Failed to delete user.");
            console.error("Error deleting user:", error);
        }
    };

    const showEditModal = (user) => {
        setEditingUser(user);
        setIsEditUserVisible(true);
    };

    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            align: 'center',
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            align: 'center',
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            align: 'center',
            render: (role) => {
                const capitalizedRole = capitalizeFirstLetter(role);
                if (role === "admin") {
                    return <Tag color="blue">{capitalizedRole}</Tag>;
                }
                return capitalizedRole; // Display "Pharmacist" as plain text
            },
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
                        onClick={() => showEditModal(record)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteUser(record.id)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                        // Disable delete for the current admin user if they are an admin
                        disabled={userRole === 'admin' && record.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}
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
        <div className="medicines-container"> {/* Consider renaming className if it's generic */}
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}

            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>User Management</h1>
                        <p>Dashboard / User Management</p>
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
                                    setAvatarUrl(null); // Fallback if src fails
                                    sessionStorage.removeItem('userAvatarUrl'); // Clear invalid URL
                                }}
                            />
                        </div>
                    </div>
                </header>
                <div className="medicines-table"> {/* Consider renaming className */}
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button
                                className="add-button"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddUserVisible(true)}
                            >
                                Add User
                            </Button>
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={users}
                            rowKey={(record) => record.id}
                            loading={loading}
                            size="small"
                            scroll={{ x: 1200 }} // Adjust scroll as needed
                        />
                    </div>
                </div>
                <AddUserForm
                    visible={isAddUserVisible}
                    onCreate={handleAddUser}
                    onCancel={() => setIsAddUserVisible(false)}
                />
                <EditUserForm
                    visible={isEditUserVisible}
                    onEdit={handleEditUser}
                    onCancel={() => {
                        setIsEditUserVisible(false);
                        setEditingUser(null); // Clear editing user on cancel
                    }}
                    initialValues={editingUser}
                />
            </main>
        </div>
    );
};

export default UserManage;
