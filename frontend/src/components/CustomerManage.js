import React, { useState, useEffect } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Table, Button, Space, message, Avatar, Modal, Input } from "antd";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import "./CustomerManage.css";
import axios from "axios";
import AddCustomerForm from "./AddCustomerForm";
import EditCustomerForm from "./EditCustomerForm";
import { useNavigate } from "react-router-dom";

const CustomerManage = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [isAddCustomerVisible, setIsAddCustomerVisible] = useState(false);
    const [isEditCustomerVisible, setIsEditCustomerVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const userRole = sessionStorage.getItem("userRole");

    const onSearch = async (value) => {
        const token = sessionStorage.getItem("token");

        if (!value) {
            fetchCustomers(); // Fetch all customers if the search input is cleared
            return;
        }

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/phone/${value}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setCustomers([response.data]); // Wrap the single customer in an array for consistency
            message.success(`Found customer with phone number "${value}".`);
        } catch (error) {
            console.error("Error searching customers:", error);
            setCustomers([]); // Clear the table if no customer is found
            message.error(`No customer found for phone number "${value}".`);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleAvatarClick = () => {
        navigate("/profile");
    };

    const fetchCustomers = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
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
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setCustomers([...customers, response.data]);
            message.success("Customer added successfully.");
            setIsAddCustomerVisible(false);
        } catch (error) {
            message.error("Failed to add customer.");
        }
    };

    const handleEditCustomer = async (values) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/${editingCustomer.id}`,
                values,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setCustomers(
                customers.map((customer) =>
                    customer.id === editingCustomer.id ? response.data : customer
                )
            );
            message.success("Customer updated successfully.");
            setIsEditCustomerVisible(false);
            setEditingCustomer(null);
        } catch (error) {
            message.error("Failed to update customer.");
        }
    };

    const handleDeleteCustomer = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setCustomers(customers.filter((customer) => customer.id !== id));
            message.success("Customer deleted successfully.");
        } catch (error) {
            message.error("Failed to delete customer.");
        }
    };

    const showEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsEditCustomerVisible(true);
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
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
                                title: "Are you sure you want to delete this customer?",
                                onOk: () => handleDeleteCustomer(record.id),
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
        <div className="customers-container">
            {/* Sidebar Navigation */}
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Customer Management</h1>
                        <p>Dashboard / Customer Management</p>
                    </div>
                    <div className="header-right">
                        <div onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
                            <Avatar size={50} icon={<UserOutlined />} />
                        </div>
                    </div>
                </header>
                <section className="customers-table">
                    <section className="table-header">
                        <Button
                            className="add-button"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsAddCustomerVisible(true)}
                            style={{ marginBottom: 16 }}
                        >
                            Add Customer
                        </Button>
                        <Search
                            placeholder="Search customers..."
                            allowClear
                            onSearch={onSearch}
                            style={{ width: 500 }}
                        />
                    </section>
                    <Table
                        columns={columns}
                        dataSource={customers}
                        rowKey={(record) => record.id}
                        loading={loading}
                    />
                </section>
                <AddCustomerForm
                    visible={isAddCustomerVisible}
                    onCreate={handleAddCustomer}
                    onCancel={() => setIsAddCustomerVisible(false)}
                />
                <EditCustomerForm
                    visible={isEditCustomerVisible}
                    onEdit={handleEditCustomer}
                    onCancel={() => setIsEditCustomerVisible(false)}
                    initialValues={editingCustomer}
                />
            </main>
        </div>
    );
};

export default CustomerManage;
