import React, { useState, useEffect } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { Avatar, Button, Table, Tag, Tooltip, message, Input, Select } from "antd";
import axios from "axios";
import './Medicines.css';
import AddMedicineForm from "./AddMedicineForm";
import EditMedicineForm from "./EditMedicineForm";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";

import {useNavigate} from "react-router-dom";

const Medicines = () => {
    const { Search } = Input;
    const LOW_STOCK_THRESHOLD = 20;
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    // These state variables are used in the AddMedicineForm and EditMedicineForm components
    // They are passed as props to those components
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(undefined);
    // Using avatarUrl state instead of userAvatarUrl for consistency
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    const onSearch = async (value) => {
        const token = sessionStorage.getItem('token');

        if (!value) {
            fetchMedicines(); // Fetch all medicines if search is cleared
            return;
        }

        try {
            // First, search for medicines by name
            const searchResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/name/${value}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // If no results found, show message and return
            if (!searchResponse.data || searchResponse.data.length === 0) {
                message.info(`No medicines found for "${value}".`);
                setMedicines([]);
                return;
            }

            // For each found medicine, fetch its complete details
            const detailedMedicines = await Promise.all(
                searchResponse.data.map(async (medicine) => {
                    try {
                        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/${medicine.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        return response.data;
                    } catch (error) {
                        console.error(`Error fetching details for medicine ${medicine.id}:`, error);
                        return medicine; // Return the original medicine if details fetch fails
                    }
                })
            );

            setMedicines(detailedMedicines);
            message.success(`Found ${detailedMedicines.length} result(s) for "${value}".`);
        } catch (error) {
            console.error('Error searching medicines:', error);
            message.error(error.response?.data?.message || `Error searching for "${value}". Please try again.`);
        }
    };

    useEffect(() => {
        fetchMedicines();
        fetchCategories();
        fetchSuppliers();
        fetchLocations();
        fetchBrands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (!sessionStorage.getItem('userAvatarUrl')) {
            fetchUserProfile();
        }
    }, []);

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const role = sessionStorage.getItem('userRole');

    const fetchMedicines = async (brandId) => {
        const token = sessionStorage.getItem('token');
        try {
            const url = new URL(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`);
            if (brandId) {
                url.searchParams.append('brand_id', brandId);
            }
            
            const response = await axios.get(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMedicines(response.data);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            message.error('Failed to load medicines');
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/brands`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands(response.data);
        } catch (error) {
            console.error('Error fetching brands:', error);
            message.error('Failed to load brands');
        }
    };

    const fetchCategories = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Ensure token is retrieved
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            message.error("Failed to fetch categories.");
        }
    };

    const fetchSuppliers = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Ensure token is retrieved
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(response.data);
        } catch (error) {
            message.error("Failed to fetch suppliers.");
        }
    };

    const fetchLocations = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Ensure token is retrieved
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(response.data);
        } catch (error) {
            message.error("Failed to fetch locations.");
        }
    };

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

    const showAddMedicineModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditMedicineModal = (medicine) => {
        setEditingMedicine(medicine);
        setIsEditModalVisible(true);
    };

    const handleAddMedicine = async (newMedicine) => {
        try {
            // Find the names for the IDs
            const category = categories.find(cat => cat.id === newMedicine.category_id);
            const supplier = suppliers.find(sup => sup.id === newMedicine.supplier_id);
            const location = locations.find(loc => loc.id === newMedicine.location_id);
            const brand = brands.find(b => b.id === newMedicine.brand_id);

            // Format the medicine data with names instead of IDs
            const formattedMedicine = {
                ...newMedicine,
                category: category ? category.name : 'N/A',
                supplier: supplier ? supplier.name : 'N/A',
                location: location ? location.name : 'N/A',
                brand: brand ? brand.name : 'N/A',
                brand_manufacturer: brand ? brand.manufacturer || '' : ''
            };

            setMedicines([...medicines, formattedMedicine]);
            setIsAddModalVisible(false);
        } catch (error) {
            console.error("Error formatting medicine data:", error);
            message.error("Failed to add medicine. Please try again.");
        }
    };

    const handleEditMedicine = async (updatedMedicine) => {
        try {
            // Find the names for the IDs
            const category = categories.find(cat => cat.id === updatedMedicine.category_id);
            const supplier = suppliers.find(sup => sup.id === updatedMedicine.supplier_id);
            const location = locations.find(loc => loc.id === updatedMedicine.location_id);
            const brand = brands.find(b => b.id === updatedMedicine.brand_id);

            // Format the medicine data with names instead of IDs
            const formattedMedicine = {
                ...updatedMedicine,
                category: category ? category.name : 'N/A',
                supplier: supplier ? supplier.name : 'N/A',
                location: location ? location.name : 'N/A',
                brand: brand ? brand.name : 'N/A',
                brand_manufacturer: brand ? brand.manufacturer || '' : ''
            };

            // Update the local state with the updated medicine data
            const updatedMedicines = medicines.map(med =>
                med.id === updatedMedicine.id ? formattedMedicine : med
            );
            setMedicines(updatedMedicines);
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Error updating medicine:", error);
            message.error("Failed to update medicine state. Please refresh the page.");
        }
    };

    const handleCancel = () => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
    };

    const deleteMedicine = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedicines(medicines.filter(medicine => medicine.id !== id));
            message.success("Medicine deleted successfully.");
        } catch (error) {
            message.error("Failed to delete medicine.");
        }
    };

    const columns = [
        {
            title: 'Image',
            key: 'image',
            align: 'center',
            width: 90,
            fixed: 'left',
            render: (record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {record.imageUrl ? (
                        <img
                            src={record.imageUrl}
                            alt={record.name}
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
            )
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: 150,
            render: (text) => (
                <Tooltip title={text}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
            width: 120,
            align: 'center',
            render: (brand, record) => (
                <Tooltip title={record.brand_manufacturer ? `${brand} (${record.brand_manufacturer})` : brand}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {brand || 'N/A'}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 70,
            align: 'center',
            render: (price) => (
                <div style={{ textAlign: 'center', paddingRight: '12px' }}>
                    ${parseFloat(price).toFixed(2)}
                </div>
            )
        },
        {
            title: 'Stock',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 80,
            align: 'center',
            render: (quantity) => (
                <div style={{ textAlign: 'center' }}>
                    {quantity}
                </div>
            )
        },
        {
            title: 'Status',
            key: 'stockStatus',
            width: 100,
            align: 'center',
            render: (text, record) => (
                <Tag color={record.quantity <= 0 ? 'gray' : record.quantity < LOW_STOCK_THRESHOLD ? 'red' : 'green'}>
                    {record.quantity <= 0 ? 'Out of Stock' : record.quantity < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                </Tag>
            )
        },
        {
            title: 'Expiry',
            dataIndex: 'expiry_date',
            key: 'expiry_date',
            width: 100,
            align: 'center',
            render: (date) => {
                const formattedDate = <Tag color="blue">{new Date(date).toLocaleDateString()}</Tag>;
                return isNaN(new Date(date).getTime()) ? 'Invalid Date' : formattedDate;
            }
        },
        {
            title: 'Supplier',
            dataIndex: 'supplier',
            key: 'supplier',
            width: 120,
            align: 'center',
            render: (supplier) => (
                <Tooltip title={supplier}>
                    <div style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        textAlign: 'center'
                    }}>
                        {supplier || 'N/A'}
                    </div>
                </Tooltip>
            )
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            width: 90,
            align: 'center',
            render: (location) => (
                <div style={{ textAlign: 'center' }}>
                    {location || 'N/A'}
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            align: 'center',
            render: (category) => (
                <Tooltip title={category}>
                    <div style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        textAlign: 'center'
                    }}>
                        {category || 'N/A'}
                    </div>
                </Tooltip>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            align: 'center',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
                    <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showEditMedicineModal(record)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Edit
                    </Button>
                    <Button 
                        size="small" 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => deleteMedicine(record.id)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="medicines-container">
            { role === 'admin' ? <AdminSidebar/> : <PharmacistSidebar/> }

            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Medicines</h1>
                        <p>Dashboard / Medicines</p>
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

                <div className="medicines-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button
                                className="add-button"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showAddMedicineModal}
                            >
                                Add Medicine
                            </Button>
                            
                            <Select
                                className="brand-filter"
                                showSearch
                                placeholder="Filter by brand"
                                optionFilterProp="children"
                                onChange={(value) => {
                                    setSelectedBrand(value);
                                    fetchMedicines(value);
                                }}
                                onClear={() => {
                                    setSelectedBrand(undefined);
                                    fetchMedicines();
                                }}
                                allowClear
                                value={selectedBrand}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {brands.map(brand => (
                                    <Select.Option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Search
                                className="search-bar"
                                placeholder="Search medicines..."
                                allowClear
                                onSearch={onSearch}
                            />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={medicines}
                            loading={loading}
                            scroll={{ x: 1500 }}
                            size="small"
                            rowKey="id"
                        />
                    </div>
                </div>
                <AddMedicineForm visible={isAddModalVisible} onCreate={handleAddMedicine} onCancel={handleCancel}
                                 categories={categories} suppliers={suppliers} locations={locations} brands={brands}/>
                <EditMedicineForm visible={isEditModalVisible} onEdit={handleEditMedicine} onCancel={handleCancel}
                                  medicine={editingMedicine} suppliers={suppliers} locations={locations} categories={categories} brands={brands}/>
            </main>
        </div>
    );
};

export default Medicines;
