import React, { useState, useEffect } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import {Avatar, Button, Space, Table, Tag, Tooltip, message, Input} from "antd";
import axios from "axios";
import './Medicines.css';
import AddMedicineForm from "./AddMedicineForm";
import EditMedicineForm from "./EditMedicineForm";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import moment from "moment";
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
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines/name/${value}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMedicines(response.data); // Update with multiple results
            message.success(`Found ${response.data.length} result(s) for "${value}".`);
        } catch (error) {
            console.error('Error searching medicines:', error);
            message.error(`No medicines found for "${value}".`);
        }
    };

    useEffect(() => {
        fetchMedicines();
        fetchCategories();
        fetchSuppliers();
        fetchLocations();
        // Only fetch profile if avatar URL is not in sessionStorage
        if (!sessionStorage.getItem('userAvatarUrl')) {
            fetchUserProfile();
        }
    }, []);

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const role = sessionStorage.getItem('userRole');

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedicines(response.data);
        } catch (error) {
            message.error("Failed to fetch medicines data.");
        } finally {
            setLoading(false);
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

            // Format the medicine data with names instead of IDs
            const formattedMedicine = {
                ...newMedicine,
                category: category ? category.name : 'N/A',
                supplier: supplier ? supplier.name : 'N/A',
                location: location ? location.name : 'N/A'
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
            // Update the local state with the updated medicine data
            const updatedMedicines = medicines.map(med =>
                med.id === updatedMedicine.id ? updatedMedicine : med
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
            width: 100,
            render: (record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {record.imageUrl ? (
                        <img
                            src={record.imageUrl}
                            alt={record.name}
                            style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px'
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
                                borderRadius: '4px'
                            }}
                        >
                            No Image
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Medicine Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Tooltip title={text}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${parseFloat(price).toFixed(2)}`
        },
        {
            title: 'Stock',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity) => quantity
        },
        {
            title: 'Stock Status',
            key: 'stockStatus',
            render: (text, record) => (
                <Tag color={record.quantity <= 0 ? 'gray' : record.quantity < LOW_STOCK_THRESHOLD ? 'red' : 'green'}>
                    {record.quantity <= 0 ? 'Out of Stock' : record.quantity < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                </Tag>
            )
        },
        {
            title: 'Expiration Date',
            dataIndex: 'expiry_date',
            key: 'expiry_date',
            render: (date) => {
                const formattedDate = new Date(date).toLocaleDateString();
                return isNaN(new Date(date).getTime()) ? 'Invalid Date' : formattedDate;
            }
        },
        {
            title: 'Supplier',
            dataIndex: 'supplier',
            key: 'supplier',
            render: (supplier) => supplier || 'N/A'
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (location) => location || 'N/A'
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => category || 'N/A'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} style={{ borderRadius: 50 }} onClick={() => showEditMedicineModal(record)}>Edit</Button>
                    <Button icon={<DeleteOutlined />} style={{ borderRadius: 50 }} danger onClick={() => deleteMedicine(record.id)}>Delete</Button>
                </Space>
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

                <section className="medicines-table">
                    <section className="table-header">
                        <Button
                            className="add-button"
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={showAddMedicineModal}
                        >
                            Add Medicine
                        </Button>
                        <Search
                            placeholder="Search medicines..."
                            allowClear
                            onSearch={onSearch}
                            style={{ width: 500}}
                        />

                    </section>
                    <Table columns={columns} dataSource={medicines} loading={loading}/>
                </section>
                <AddMedicineForm visible={isAddModalVisible} onCreate={handleAddMedicine} onCancel={handleCancel}
                                 categories={categories} suppliers={suppliers} locations={locations}/>
                <EditMedicineForm visible={isEditModalVisible} onEdit={handleEditMedicine} onCancel={handleCancel}
                                  medicine={editingMedicine} suppliers={suppliers} locations={locations} categories={categories}/>
            </main>
        </div>
    );
};

export default Medicines;
