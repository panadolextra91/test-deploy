import React, {useEffect, useState} from "react";
import {
    HomeOutlined,
    MedicineBoxOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    BarChartOutlined,
    UserOutlined,
    LoginOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import {Avatar, Button, message, Space, Table} from "antd";
import logo from '../imgs/trace.svg';
import './Suppliers.css';
import AddSupplierForm from "./AddSupplierForm"; // Import AddSupplierForm component
import EditSupplierForm from "./EditSupplierForm";
import axios from "axios"; // Import EditSupplierForm component
import PharmacistSidebar from "./PharmacistSidebar";
import AdminSidebar from "./AdminSidebar";
import {useNavigate} from "react-router-dom";
//Suppliers.js
const Suppliers = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    });
    const handleAvaterClick = () => {
        navigate('/profile');
    }

    const userRole = sessionStorage.getItem('userRole');

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/suppliers', {
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
            console.error('Error fetching');
            if (error.response && error.response.status === 401) {
                message.error('Unauthorized');
            } else {
                message.error('Fail fetching suppliers');
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
            const response = await axios.post('http://localhost:3000/api/suppliers', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers([...suppliers, response.data]);
            message.success("Supplier added successfully.");
            setIsAddModalVisible(false);
        } catch (error) {
            message.error("Failed to add supplier.");
        }
    };

    const handleEditSupplier = async (values) => {
        try {
            const token = sessionStorage.getItem('token');
            const payload = {
                id: currentSupplier.key,
                name: values.name,
                contact_info: values.contact_info,
                address: values.address,
            };
    
            const response = await axios.put(
                `http://localhost:3000/api/suppliers/${payload.id}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
    
            const updatedValues = suppliers.map(sup =>
                sup.id === payload.id ? { ...sup, ...response.data } : sup
            );
            setSuppliers(updatedValues);
            message.success("Supplier updated successfully.");
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Error updating medicine:", error);
            message.error("Failed to update supplier. Please try again.");
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
            await axios.delete(`http://localhost:3000/api/suppliers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(suppliers.filter(supplier => supplier.id !== id));
            message.success("Supplier deleted successfully.");
        } catch (error) {
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
            {/* Sidebar Navigation */}
            { userRole === 'admin' ? <AdminSidebar/> : <PharmacistSidebar/>}

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Suppliers Management</h1>
                        <p>Dashboard / Suppliers</p>
                    </div>
                    <div className='header-right'>
                        <div onClick={handleAvaterClick} style={{cursor: 'pointer'}}>
                            <Avatar size={50} icon={<UserOutlined/>}/>
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
    )
}

export default Suppliers;
