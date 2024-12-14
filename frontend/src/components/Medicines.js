import React, { useState, useEffect } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import {Avatar, Button, Space, Table, Tag, Tooltip, message, Input} from "antd";
import axios from "axios";
import logo from '../imgs/trace.svg';
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

    const onSearch = async (value) => {
        const token = sessionStorage.getItem('token');

        if (!value) {
            fetchMedicines(); // Fetch all medicines if search is cleared
            return;
        }

        try {
            const response = await axios.get(`http://localhost:3000/api/medicines/name/${value}`, {
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
    }, []);

    const handleAvaterClick = () => {
        navigate('/profile');
    }
    const role = sessionStorage.getItem('userRole');

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/medicines', {
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
            const response = await axios.get('http://localhost:3000/api/categories', {
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
            const response = await axios.get('http://localhost:3000/api/suppliers', {
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
            const response = await axios.get('http://localhost:3000/api/locations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(response.data);
        } catch (error) {
            message.error("Failed to fetch locations.");
        }
    };


    const showAddMedicineModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditMedicineModal = (medicine) => {
        setEditingMedicine(medicine);
        setIsEditModalVisible(true);
    };

    const handleAddMedicine = async (values) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post('http://localhost:3000/api/medicines', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedicines([...medicines, response.data]); // Add new medicine to state
            message.success("Medicine added successfully.");
            setIsAddModalVisible(false);
        } catch (error) {
            message.error("Failed to add medicine.");
        }
    };

    const handleEditMedicine = async (updatedMedicine) => {
        try {
            const token = sessionStorage.getItem('token');

            // Map the current values to their respective IDs
            const category = categories.find(cat => cat.name === updatedMedicine.category);
            const supplier = suppliers.find(sup => sup.name === updatedMedicine.supplier);
            const location = locations.find(loc => loc.name === updatedMedicine.location);
    
            // Validate that the mapping worked
            if (!category || !supplier || !location) {
                message.error("Invalid category, supplier, or location.");
                return;
            }
    
            // Prepare the payload for the API
            const payload = {
                name: updatedMedicine.name,
                category_id: category.id,
                description: updatedMedicine.description,
                price: updatedMedicine.price,
                quantity: updatedMedicine.quantity,
                supplier_id: supplier.id,
                location_id: location.id,
                expiry_date: updatedMedicine.expirationDate
                    ? moment(updatedMedicine.expirationDate).format('YYYY-MM-DD')
                    : null,
            };
    
            // Send the update request to the API
            const response = await axios.put(
                `http://localhost:3000/api/medicines/${updatedMedicine.id}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
    
            // Update the local state with the response data
            const updatedMedicines = medicines.map(med =>
                med.id === updatedMedicine.id ? { ...med, ...response.data } : med
            );
            setMedicines(updatedMedicines);
    
            message.success("Medicine updated successfully.");
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Error updating medicine:", error);
            message.error("Failed to update medicine. Please try again.");
        }
    };

    const handleCancel = () => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
    };

    const deleteMedicine = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/medicines/${id}`, {
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
                        <div onClick={handleAvaterClick} style={{cursor: 'pointer'}}>
                            <Avatar size={50} icon={<UserOutlined/>}/>
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
                                  medicine={editingMedicine} suppliers={suppliers} locations={locations}/>
            </main>
        </div>
    );
};

export default Medicines;
