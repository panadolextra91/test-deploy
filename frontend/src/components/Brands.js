import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Modal, message, Popconfirm, Image, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import './Medicines.css';
import AdminSidebar from './AdminSidebar';
import PharmacistSidebar from './PharmacistSidebar';
import { useNavigate } from 'react-router-dom';
import EditBrandForm from './EditBrandForm';
import AddBrandForm from './AddBrandForm';

const { Search } = Input;

const Brands = () => {
    const navigate = useNavigate();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [currentBrand, setCurrentBrand] = useState(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    
    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${backendUrl}/api/brands`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands(response.data);
        } catch (error) {
            console.error('Error fetching brands:', error);
            message.error('Failed to fetch brands');
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);

    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl;
    });

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            console.log('No token or backend URL available');
            return;
        }
        
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const userData = response.data;
            if (userData.avatar) {
                const avatarUrl = userData.avatar.startsWith('http') 
                    ? userData.avatar 
                    : `${backendUrl}/${userData.avatar.replace(/\\/g, '/')}`;
                
                setAvatarUrl(avatarUrl);
                sessionStorage.setItem('userAvatarUrl', avatarUrl);
            } else {
                setAvatarUrl(null);
                sessionStorage.removeItem('userAvatarUrl');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setAvatarUrl(null);
            sessionStorage.removeItem('userAvatarUrl');
        }
    }, [backendUrl]);

    useEffect(() => {
        fetchBrands();
        fetchUserProfile();
    }, [fetchBrands, fetchUserProfile]);

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const filteredBrands = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (brand.manufacturer && brand.manufacturer.toLowerCase().includes(searchText.toLowerCase())) ||
        (brand.country && brand.country.toLowerCase().includes(searchText.toLowerCase()))
    );

    const showAddModal = () => {
        setAddModalVisible(true);
    };

    const showEditModal = (brand) => {
        setEditingBrand(brand);
        setEditModalVisible(true);
    };

    const handleAddCancel = () => {
        setAddModalVisible(false);
    };
    
    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingBrand(null);
    };

    const handleViewCancel = () => {
        setViewModalVisible(false);
        setCurrentBrand(null);
    };

    const handleAddSubmit = () => {
        setAddModalVisible(false);
        fetchBrands();
    };
    
    const handleEditSubmit = async (id, formData) => {
        try {
            const token = sessionStorage.getItem('token');
            
            // Update existing brand
            await axios.put(`${backendUrl}/api/brands/${id}`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            message.success('Brand updated successfully');
            
            setEditModalVisible(false);
            setEditingBrand(null);
            fetchBrands();
        } catch (error) {
            console.error('Error updating brand:', error);
            message.error('Failed to update brand');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${backendUrl}/api/brands/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Brand deleted successfully');
            fetchBrands();
        } catch (error) {
            console.error('Error deleting brand:', error);
            if (error.response && error.response.status === 400) {
                message.error(error.response.data.error || 'Cannot delete brand with associated medicines');
            } else {
                message.error('Failed to delete brand');
            }
        }
    };

    const columns = [
        {
            title: 'Logo',
            dataIndex: 'logo',
            key: 'logo',
            width: 70,
            fixed: 'left',
            align: 'center',
            render: (logo) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {logo ? (
                        <img
                            src={logo}
                            alt={logo}
                            style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '50px',
                                height: '50px',
                                background: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            No Image
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 100,
            sorter: (a, b) => a.name.localeCompare(b.name),
            align: 'center',
        },
        {
            title: 'Manufacturer',
            dataIndex: 'manufacturer',
            width: 100,
            key: 'manufacturer',
            align: 'center',
        },
        {
            title: 'Country',
            dataIndex: 'country',
            width: 90,
            key: 'country',
            align: 'center',
        },
        {
            title: 'Medicines',
            dataIndex: 'medicineCount',
            width: 50,
            key: 'medicineCount',
            align: 'center',
            render: (count) => count || 0,
            sorter: (a, b) => (a.medicineCount || 0) - (b.medicineCount || 0),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            align: 'center',
            render: (_, brand) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showEditModal(brand)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Edit
                    </Button>
                        <Button 
                            size="small" 
                            icon={<DeleteOutlined />} 
                            danger
                            style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                            disabled={brand.medicineCount > 0}
                            onClick={() => handleDelete(brand.id)}
                        >
                            Delete
                        </Button>
                </div>
            ),
        },
    ];

    const role = sessionStorage.getItem('userRole');

    return (
        <div className="medicines-container">
            {role === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}
            
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Brands</h1>
                        <p>Dashboard / Brands</p>
                    </div>
                    <div className='header-right'>
                        <div className="user-avatar" onClick={() => navigate('/profile')}>
                            {avatarUrl ? (
                                <Avatar src={avatarUrl} size={40} />
                            ) : (
                                <Avatar icon={<UserOutlined />} size={40} />
                            )}
                        </div>
                    </div>
                </header>

                <div className="medicines-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button
                                className="add-button"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showAddModal}
                            >
                                Add Brand
                            </Button>
                            <Search
                                className="search-bar"
                                placeholder="Search brands..."
                                allowClear
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="table-container">
                        <Table 
                            columns={columns} 
                            dataSource={filteredBrands} 
                            rowKey="id" 
                            loading={loading}
                            size="small"
                            
                        />
                    </div>
                </div>
                
                <AddBrandForm
                    visible={addModalVisible}
                    onAdd={handleAddSubmit}
                    onCancel={handleAddCancel}
                />
                
                <EditBrandForm 
                    visible={editModalVisible}
                    onEdit={handleEditSubmit}
                    onCancel={handleEditCancel}
                    brand={editingBrand}
                />
            </main>
        </div>
    );
};

export default Brands;