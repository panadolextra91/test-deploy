import React, { useState, useEffect } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Table, Button, Space, message, Avatar, Modal } from "antd";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import AddUserForm from "./AddUserForm";
import EditUserForm from "./EditUserForm";
import "./UserManage.css";
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
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    const userRole = sessionStorage.getItem("userRole");

    useEffect(() => {
        fetchUsers();
        // Only fetch profile if avatar URL is not in sessionStorage
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
                // Save to sessionStorage
                sessionStorage.setItem('userAvatarUrl', response.data.avatarUrl);
                setAvatarUrl(response.data.avatarUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Don't show error message to user for avatar loading failure
            setAvatarUrl(null);
        }
    };

    const handleAvatarClick = () => {
        navigate("/profile");
    };

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            message.error("Failed to fetch user data.");
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
            setUsers([...users, response.data]);
            message.success("User added successfully.");
            setIsAddUserVisible(false);
        } catch (error) {
            message.error("Failed to add user.");
        }
    };

    const handleEditUser = async (values) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/${editingUser.id}`,
                values,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const updatedUser = response.data.user;
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === updatedUser.id ? { ...user, ...updatedUser } : user
                )
            );
            message.success(response.data.message || "User updated successfully.");
            setIsEditUserVisible(false);
            setEditingUser(null);
        } catch (error) {
            message.error("Failed to update user.");
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(users.filter((user) => user.id !== id));
            message.success("User deleted successfully.");
        } catch (error) {
            message.error("Failed to delete user.");
        }
    };

    const showEditModal = (user) => {
        setEditingUser(user);
        setIsEditUserVisible(true);
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
        },
        {
            title: "Actions",
            key: "actions",
            render: (text, record) => (
                <Space size="middle">
                    <Button
                        style={{ borderRadius: 50 }}
                        icon={<EditOutlined />}
                        onClick={() => showEditModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        style={{ borderRadius: 50 }}
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() =>
                            Modal.confirm({
                                title: "Are you sure you want to delete this user?",
                                onOk: () => handleDeleteUser(record.id),
                            })
                        }
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="users-container">
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
                                    setAvatarUrl(null);
                                    sessionStorage.removeItem('userAvatarUrl');
                                }}
                            />
                        </div>
                    </div>
                </header>
                <section className="users-table">
                    <Button
                        className="add-button"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddUserVisible(true)}
                        style={{ marginBottom: 16 }}
                    >
                        Add User
                    </Button>
                    <Table
                        columns={columns}
                        dataSource={users}
                        rowKey={(record) => record.id}
                        loading={loading}
                    />
                </section>
                <AddUserForm
                    visible={isAddUserVisible}
                    onCreate={handleAddUser}
                    onCancel={() => setIsAddUserVisible(false)}
                />
                <EditUserForm
                    visible={isEditUserVisible}
                    onEdit={handleEditUser}
                    onCancel={() => setIsEditUserVisible(false)}
                    initialValues={editingUser}
                />
            </main>
        </div>
    );
};

export default UserManage;
