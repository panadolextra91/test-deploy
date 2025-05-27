import React, { useState, useEffect, useCallback } from "react";
import {
    Input,
    Button,
    message,
    Spin,
    Upload,
    Avatar, // Added Avatar
    Badge, // Added Badge
    Dropdown, // Added Dropdown
    List, // Added List
} from "antd";
import { 
    UploadOutlined, 
    UserOutlined, 
    DeleteOutlined,
    BellOutlined, // Added BellOutlined
} from '@ant-design/icons';
import './Profile.css';
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import axios from "axios"; // Using axios for consistency with other notification implementations
import { useNavigate } from "react-router-dom"; // Added useNavigate

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // For overall page loading
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState(null);
    const userRole = sessionStorage.getItem('userRole');
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate(); // Initialize navigate

    // Avatar state - initialized from sessionStorage
    const [avatarUrl, setAvatarUrl] = useState(() => sessionStorage.getItem('userAvatarUrl'));

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        setLoading(true); // Start loading when fetching profile
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            message.error("Authentication details are missing.");
            setLoading(false);
            navigate('/login'); // Redirect if no token
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            setProfile(data);
            if (data.avatarUrl) {
                const fullUrl = data.avatarUrl.startsWith('http')
                    ? data.avatarUrl
                    : `${backendUrl}${data.avatarUrl.startsWith('/') ? '' : '/'}${data.avatarUrl.replace(/\\/g, '/')}`;
                setAvatarUrl(fullUrl);
                sessionStorage.setItem('userAvatarUrl', fullUrl);
            } else {
                setAvatarUrl(null);
                sessionStorage.removeItem('userAvatarUrl');
            }
            setUserId(data.id); // Set userId for notifications
        } catch (error) {
            console.error('Profile: Failed to fetch user profile:', error);
            message.error(error.response?.data?.error || 'Failed to fetch user profile');
            if (error.response?.status === 401) {
                sessionStorage.clear();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [backendUrl, navigate]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

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
            console.error("Profile: Failed to fetch notifications:", error);
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
            console.error("Profile: Failed to fetch notification count:", error);
        }
    }, [userId, backendUrl]);

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
            console.error("Profile: Failed to mark notification as read:", error);
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
            console.error("Profile: Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        const token = sessionStorage.getItem('token');
        if (!profile || !token || !backendUrl) {
            message.error("Profile data or authentication details missing.");
            return;
        }
        try {
            const response = await axios.put(`${backendUrl}/api/users/profile`, 
                { name: profile.name, email: profile.email, username: profile.username },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success('Profile updated successfully');
            setProfile(response.data); // Update profile state with response from backend
        } catch (error) {
            console.error('Profile: Failed to update profile:', error);
            message.error(error.response?.data?.error || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            message.error("Authentication details missing.");
            return;
        }
        try {
            await axios.put(`${backendUrl}/api/users/change-password`, 
                { oldPassword: passwords.oldPassword, newPassword: passwords.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success('Password changed successfully');
            setPasswords({ oldPassword: '', newPassword: '' });
        } catch (error) {
            console.error('Profile: Failed to change password:', error);
            message.error(error.response?.data?.error || 'Failed to change password');
        }
    };

    const handleAvatarUpload = async (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false; // Prevent upload
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Image must be smaller than 5MB!');
            return false; // Prevent upload
        }

        const formData = new FormData();
        formData.append('avatar', file);
        setAvatarLoading(true);
        setAvatarError(null);
        const token = sessionStorage.getItem('token');

        try {
            const response = await axios.post(
                `${backendUrl}/api/users/avatar`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );
            const data = response.data;
            if (data.avatarUrl) {
                const fullUrl = data.avatarUrl.startsWith('http')
                    ? data.avatarUrl
                    : `${backendUrl}${data.avatarUrl.startsWith('/') ? '' : '/'}${data.avatarUrl.replace(/\\/g, '/')}`;
                setAvatarUrl(fullUrl);
                sessionStorage.setItem('userAvatarUrl', fullUrl); // Update session storage
                message.success('Avatar uploaded successfully');
            } else {
                throw new Error("Avatar URL not returned from server.");
            }
        } catch (err) {
            console.error('Profile: Error uploading avatar:', err);
            const errMsg = err.response?.data?.error || err.message || 'Error uploading avatar';
            setAvatarError(errMsg);
            message.error(errMsg);
        } finally {
            setAvatarLoading(false);
        }
        return false; // Prevent antd default upload
    };

    const handleDeleteAvatar = async () => {
        setAvatarLoading(true);
        setAvatarError(null);
        const token = sessionStorage.getItem('token');
        try {
            await axios.delete(
                `${backendUrl}/api/users/avatar`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAvatarUrl(null);
            sessionStorage.removeItem('userAvatarUrl'); // Remove from session storage
            message.success('Avatar deleted successfully');
        } catch (err) {
            console.error('Profile: Error deleting avatar:', err);
            const errMsg = err.response?.data?.error || err.message || 'Error deleting avatar';
            setAvatarError(errMsg);
            message.error(errMsg);
        } finally {
            setAvatarLoading(false);
        }
    };

    const uploadProps = {
        beforeUpload: (file) => {
            handleAvatarUpload(file); // Call our handler
            return Upload.LIST_IGNORE; // Prevent antd's default upload behavior
        },
        showUploadList: false,
        disabled: avatarLoading,
    };

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
    
    const handleAvatarClick = () => navigate("/profile");


    if (loading && !profile) { // Show spinner only if profile is not yet loaded
        return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spin size="large" /></div>;
    }

    return (
        <div className="profile-container">
            {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>User Profile</h1>
                        <p>Dashboard / User Profile</p>
                    </div>
                    {/* Added Notification Dropdown and Avatar to Header */}
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
                        <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                            <Avatar
                                size={50}
                                icon={!avatarUrl && <UserOutlined />}
                                src={avatarUrl} // Uses the state variable
                                onError={() => {
                                    setAvatarUrl(null); // Fallback if src fails
                                    sessionStorage.removeItem('userAvatarUrl');
                                    return false; // Prevent default browser error icon
                                }}
                            />
                        </div>
                    </div>
                </header>

                <section className="profile-form">
                    <Spin spinning={avatarLoading || (loading && !profile)} tip={avatarLoading ? "Updating avatar..." : "Loading profile..."}>
                        <div className="avatar-section">
                            <div className="avatar-container">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="avatar-image" />
                                ) : (
                                    <UserOutlined className="avatar-placeholder" />
                                )}
                            </div>
                            <div className="avatar-actions">
                                <Upload {...uploadProps}>
                                    <Button icon={<UploadOutlined />} loading={avatarLoading}>
                                        {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                                    </Button>
                                </Upload>
                                {avatarUrl && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleDeleteAvatar}
                                        loading={avatarLoading}
                                        style={{marginLeft: '8px'}}
                                    >
                                        Delete Avatar
                                    </Button>
                                )}
                            </div>
                            {avatarError && (
                                <div className="avatar-error" style={{color: 'red', marginTop: '8px'}}>{avatarError}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <Input
                                name="name"
                                value={profile?.name || ''}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Username</label>
                            <Input
                                name="username"
                                value={profile?.username || ''}
                                onChange={handleInputChange}
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <Input
                                name="email"
                                value={profile?.email || ''}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-group">
                            <label>Old Password</label>
                            <Input.Password 
                                name="oldPassword"
                                value={passwords.oldPassword}
                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                placeholder="Enter your current password"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <Input.Password
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                placeholder="Enter your new password"
                                disabled={!passwords.oldPassword}
                            />
                        </div>

                        <div className="form-actions">
                            <Button type="primary" onClick={handleSaveChanges} loading={loading && !!profile}> {/* Show loading on button if saving */}
                                Save Changes
                            </Button>
                            <Button type="default" disabled={!passwords.oldPassword || (loading && !!profile)} danger onClick={handlePasswordChange}>
                                Change Password
                            </Button>
                        </div>
                    </Spin>
                </section>
            </main>
        </div>
    );
};

export default Profile;
