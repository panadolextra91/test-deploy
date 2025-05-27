import React, { useState, useEffect } from "react";
import {
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { Table, Button, message, Avatar, Input } from "antd";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import "./Medicines.css";
import axios from "axios";
import AddCustomerForm from "./AddCustomerForm";
import CustomerDetailsForm from "./CustomerDetailsForm"; // EditCustomerForm is no longer needed
import { useNavigate } from "react-router-dom";

const CustomerManage = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [isAddCustomerVisible, setIsAddCustomerVisible] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState(null); // State for the details modal
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });
    const userRole = sessionStorage.getItem("userRole");

    useEffect(() => {
        fetchCustomers();
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

    const onSearch = async (value) => {
        const token = sessionStorage.getItem("token");
        if (!value) {
            fetchCustomers();
            return;
        }
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/phone/${value}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers([response.data]); // Wrap single result in an array
            message.success(`Found customer with phone number "${value}".`);
        } catch (error) {
            console.error("Error searching customers:", error);
            setCustomers([]); // Clear table if no customer is found
            message.error(`No customer found for phone number "${value}".`);
        }
    };

    const handleAvatarClick = () => navigate("/profile");

    const fetchCustomers = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(response.data);
        } catch (error) {
            message.error("Failed to fetch customer data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (values) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers`,
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Add new customer to the top of the list
            setCustomers([response.data, ...customers]);
            message.success("Customer added successfully.");
            setIsAddCustomerVisible(false);
        } catch (error) {
            message.error("Failed to add customer.");
        }
    };

    const handleDeleteCustomer = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(customers.filter((customer) => customer.id !== id));
            message.success("Customer deleted successfully.");
        } catch (error) {
            message.error("Failed to delete customer.");
        }
    };

    const columns = [
        { title: "Name", dataIndex: "name", key: "name", align: 'center' },
        { title: "Phone", dataIndex: "phone", key: "phone", align: 'center' },
        { title: "Email", dataIndex: "email", key: "email", align: 'center' },
        {
            title: "Actions", key: "actions", align: 'center', render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => setViewingCustomer(record)}
                        type="primary"
                        ghost
                        style={{ borderRadius: 50, minWidth: '80px', minHeight: '32px' }}
                        size="small"
                    >
                        Details
                    </Button>
                    <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteCustomer(record.id)}
                        style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="medicines-container">
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Customer Management</h1>
                        <p>Dashboard / Customer Management</p>
                    </div>
                    <div className="header-right">
                        <div onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
                            <Avatar size={50} icon={!avatarUrl && <UserOutlined />} src={avatarUrl} onError={() => { setAvatarUrl(null); sessionStorage.removeItem('userAvatarUrl'); }} />
                        </div>
                    </div>
                </header>
                <div className="medicines-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button className="add-button" type="primary" icon={<PlusOutlined />} onClick={() => setIsAddCustomerVisible(true)}>
                                Add Customer
                            </Button>
                            <Search className="search-bar" placeholder="Search customers by phone..." allowClear onSearch={onSearch} />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={customers}
                            rowKey={(record) => record.id}
                            loading={loading}
                            size="small"
                            scroll={{ x: 1200 }}
                        />
                    </div>
                </div>
                <AddCustomerForm
                    visible={isAddCustomerVisible}
                    onCreate={handleAddCustomer}
                    onCancel={() => setIsAddCustomerVisible(false)}
                />
                
                {/* The CustomerDetailsForm is now the single point for viewing and editing details */}
                <CustomerDetailsForm
                    visible={!!viewingCustomer}
                    customerId={viewingCustomer?.id}
                    onCancel={() => {
                        setViewingCustomer(null);
                    }}
                    onUpdate={() => {
                        // Refreshes the customer list in the background without closing the modal
                        fetchCustomers();
                    }}
                />
            </main>
        </div>
    );
};

export default CustomerManage;