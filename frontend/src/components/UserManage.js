import React, { useState, useEffect } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Table, Button, message, Avatar, Modal, Tag } from "antd"; // Modal is not used, can be removed if not planned for future
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
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    const userRole = sessionStorage.getItem("userRole");

    useEffect(() => {
        fetchUsers();
        if (!sessionStorage.getItem('userAvatarUrl')) {
            fetchUserProfile();
        }
    }, []);

    const fetchUserProfile = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data.avatarUrl) {
                sessionStorage.setItem('userAvatarUrl', response.data.avatarUrl);
                setAvatarUrl(response.data.avatarUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setAvatarUrl(null);
        }
    };

    const handleAvatarClick = () => {
        navigate("/profile");
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
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
                `${process.env.REACT_APP_BACKEND_URL}/api/users`,
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
                `${process.env.REACT_APP_BACKEND_URL}/api/users/${editingUser.id}`,
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
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/users/${id}`, {
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

    return (
        <div className="medicines-container"> {/* Consider renaming className if it's generic */}
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}

            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>User Management</h1>
                        <p>Dashboard / User Management</p>
                    </div>
                    <div className="header-right">
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
