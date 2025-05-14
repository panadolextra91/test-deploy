import React, { useEffect, useState } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { Avatar, Button, message, Space, Table } from "antd";
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
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    useEffect(() => {
        fetchSuppliers();
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

    const fetchSuppliers = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Use sessionStorage consistently
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, {
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
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, values, {
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
                `${process.env.REACT_APP_BACKEND_URL}/api/suppliers/${currentSupplier.key}`,
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
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers/${id}`, {
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
            key: 'name'
        },
        {
            title: 'Contact',
            dataIndex: 'contact',
            key: 'contact'
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} style={{ borderRadius: 50 }} onClick={() => showEditSupplierModal(record.key)}>Edit</Button>
                    <Button icon={<DeleteOutlined />} style={{ borderRadius: 50 }} danger onClick={() => deleteSupplier(record.key)}>Delete</Button>
                </Space>
            )
        }
    ];

    return (
        <div className="suppliers-container">
            { userRole === 'admin' ? <AdminSidebar/> : <PharmacistSidebar/>}

            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Suppliers Management</h1>
                        <p>Dashboard / Suppliers</p>
                    </div>
                    <div className='header-right'>
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
                <section className="suppliers-table">
                    <Button className='add-button' type="primary" icon={<PlusOutlined/>} onClick={showAddSupplierModal}
                            style={{marginBottom: 16, borderRadius: 50}}>
                        Add Supplier
                    </Button>
                    <Table columns={columns} dataSource={suppliers}/>
                </section>
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
