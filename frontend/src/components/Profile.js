import React, { useState, useEffect } from "react";
import {
    Input,
    Button,
    message,
    Spin,
    Upload,
} from "antd";
import { UploadOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import './Profile.css';
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState(null);
    const userRole = sessionStorage.getItem('userRole');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error Response:', errorText);
                    throw new Error('Failed to fetch user profile');
                }
                const data = await response.json();
                setProfile(data);
                if (data.avatarUrl) {
                    setAvatarUrl(data.avatarUrl);
                }
            } catch (error) {
                message.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify({ name: profile.name, email: profile.email, username: profile.username }),
            });
            if (!response.ok) throw new Error('Failed to update profile');
            message.success('Profile updated successfully');
        } catch (error) {
            message.error(error.message);
        }
    };

    const handlePasswordChange = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change password');
            }
            message.success('Password changed successfully');
            setPasswords({ oldPassword: '', newPassword: '' });
        } catch (error) {
            message.error(error.message);
        }
    };

    // Updated avatar upload logic
    const handleAvatarUpload = async (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Image must be smaller than 5MB!');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setAvatarLoading(true);
        setAvatarError(null);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/avatar`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                    body: formData,
                }
            );
            if (!response.ok) throw new Error('Failed to upload avatar');
            const data = await response.json();
            setAvatarUrl(data.avatarUrl);
            message.success('Avatar uploaded successfully');
        } catch (err) {
            const errMsg = err.message || 'Error uploading avatar';
            setAvatarError(errMsg);
            message.error(errMsg);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        setAvatarLoading(true);
        setAvatarError(null);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/avatar`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                }
            );
            if (!response.ok) throw new Error('Failed to delete avatar');
            setAvatarUrl(null);
            message.success('Avatar deleted successfully');
        } catch (err) {
            const errMsg = err.message || 'Error deleting avatar';
            setAvatarError(errMsg);
            message.error(errMsg);
        } finally {
            setAvatarLoading(false);
        }
    };

    // Upload props
    const uploadProps = {
        beforeUpload: (file) => {
            handleAvatarUpload(file);
            return false;
        },
        showUploadList: false,
        disabled: avatarLoading,
    };

    if (loading) {
        return <Spin size="large" className="loading-spinner" />;
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
                </header>

                <section className="profile-form">
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
                                >
                                    Delete Avatar
                                </Button>
                            )}
                        </div>
                        {avatarError && (
                            <div className="avatar-error">{avatarError}</div>
                        )}
                    </div>

                    {/* rest of form unchanged */}
                    <div className="form-group">
                        <label>Full Name</label>
                        <Input
                            name="name"
                            value={profile?.name}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <Input
                            name="username"
                            value={profile?.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <Input
                            name="email"
                            value={profile?.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Old Password</label>
                        <Input
                            type="password"
                            name="oldPassword"
                            value={passwords.oldPassword}
                            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                            placeholder="Enter your current password"
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <Input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            placeholder="Enter your new password"
                            disabled={!passwords.oldPassword}
                        />
                    </div>

                    <div className="form-actions">
                        <Button type="primary" onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                        <Button type="default" disabled={!passwords.oldPassword} danger onClick={handlePasswordChange}>
                            Change Password
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Profile;