import React, { useState, useEffect } from "react";
import {
    Input,
    Button,
    message,
    Spin,
} from "antd";
import './Profile.css';
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";

const Profile = () => {
    const [profile, setProfile] = useState(null); // Use null to handle loading state
    const [loading, setLoading] = useState(true); // Add loading state
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
    const userRole = sessionStorage.getItem('userRole');

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/users/profile', { // Correct endpoint
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text(); // Log the raw response for debugging
                    console.error('Error Response:', errorText);
                    throw new Error('Failed to fetch user profile');
                }

                const data = await response.json(); // Parse the JSON response
                setProfile(data);
            } catch (error) {
                message.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);


    // Handle profile input changes
    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    // Save changes to the user profile
    const handleSaveChanges = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    username: profile.username,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            message.success('Profile updated successfully');
        } catch (error) {
            message.error(error.message);
        }
    };

    // Handle password change
    const handlePasswordChange = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify({oldPassword: passwords.oldPassword, newPassword: passwords.newPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change password');
            }

            message.success('Password changed successfully');
            setPasswords({ oldPassword: '', newPassword: '' }); // Reset password fields
        } catch (error) {
            message.error(error.message);
        }
    };

    if (loading) {
        return <Spin size="large" className="loading-spinner" />;
    }

    return (
        <div className="profile-container">
            {/* Sidebar Navigation */}
            {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>User Profile</h1>
                        <p>Dashboard / User Profile</p>
                    </div>
                </header>

                <section className="profile-form">
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
                            disabled={!passwords.oldPassword} //disabled if old pass is empty
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
