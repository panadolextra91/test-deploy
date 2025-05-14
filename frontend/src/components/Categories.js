import React, { useState, useEffect } from "react";
import {
    UserOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Space, Table, message } from "antd";
import axios from "axios";
import './Categories.css';
import EditCategoryForm from "./EditCategoryForm";
import PharmacistSidebar from "./PharmacistSidebar";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";

const Categories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    // Fetch categories from the backend
    useEffect(() => {
        fetchCategories();
        // Only fetch profile if avatar URL is not in sessionStorage
        if (!sessionStorage.getItem('userAvatarUrl')) {
            fetchUserProfile();
        }
    }, []);

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const userRole = sessionStorage.getItem('userRole');

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

    const fetchCategories = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Use sessionStorage consistently
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
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
    };

    const showEditCategoryModal = (key) => {
        const categoryToEdit = categories.find(category => category.key === key);
        setCurrentCategory(categoryToEdit);
        setIsEditModalVisible(true);
    };

    const handleEditCategory = async (values) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const payload = {
                name: values.name,
                description: values.des
            };
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/categories/${currentCategory.key}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
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
    };

    const deleteCategory = async (key) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/categories/${key}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            message.success('Category deleted successfully');
            fetchCategories(); // Refresh the list
        } catch (error) {
            console.error('Error deleting category:', error);
            message.error('Failed to delete category');
        }
    };

    const columns = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category'
        },
        {
            title: 'Description',
            dataIndex: 'des',
            key: 'des'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} style={{ borderRadius: 50 }} onClick={() => showEditCategoryModal(record.key)}>Edit</Button>
                </Space>
            )
        }
    ];

    return (
        <div className="categories-container">
            {/* Sidebar Navigation */}
            {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Categories Management</h1>
                        <p>Dashboard / Categories</p>
                    </div>
                    <div className='header-right'>
                        <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
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
                <section className="categories-table">
                    <Table columns={columns} dataSource={categories} />
                </section>
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
