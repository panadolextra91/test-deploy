// SalesInvoices.js

import React, { useState, useEffect } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Space, Table, Input, message } from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import AddInvoice from "./AddInvoice";
import EditInvoice from "./EditInvoice";
import { useNavigate } from "react-router-dom";
import "./SalesInvoices.css";

const SalesInvoices = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const userRole = sessionStorage.getItem("userRole");

    // Fetch invoices from the backend
    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const token =
                localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await axios.get("http://localhost:3000/api/invoices", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const fetchedInvoices = response.data.map((invoice) => ({
                ...invoice,
                customerName: invoice.customer?.name || "N/A",
                customerPhone: invoice.customer?.phone || "N/A", // Add customer phone
                totalAmount: Number(invoice.total_amount),
                items: invoice.items.map((item) => ({
                    ...item,
                    name: item.medicine.name,
                })),
            }));
            setInvoices(fetchedInvoices);
            setFilteredInvoices(fetchedInvoices);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            message.error("Failed to fetch invoices");
        }
    };

    const handleSearch = (value) => {
        if (!value.trim()) {
            setFilteredInvoices(invoices); // Show all invoices if the input is empty
            return;
        }

        const filtered = invoices.filter((invoice) =>
            invoice.customerPhone.includes(value.trim())
        );

        setFilteredInvoices(filtered);

        if (filtered.length === 0) {
            message.warning("No invoices found for this phone number.");
        }
    };

    const handleAvatarClick = () => { // Corrected typo from 'Avater' to 'Avatar'
        navigate("/profile");
    };

    const showAddInvoiceModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditInvoiceModal = (invoice) => {
        setEditingInvoice(invoice);
        setIsEditModalVisible(true);
    };

    const deleteInvoice = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`http://localhost:3000/api/invoices/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Remove the deleted invoice from both invoices and filteredInvoices state
            setInvoices(invoices.filter((invoice) => invoice.id !== id));
            setFilteredInvoices(filteredInvoices.filter((invoice) => invoice.id !== id));
            message.success("Invoice deleted successfully");
            // Optionally, you can call fetchInvoices() to ensure data consistency
            // fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            message.error("Failed to delete invoice");
        }
    };

    const handleCancel = () => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
        setEditingInvoice(null);
    };

    const columns = [
        {
            title: "Customer Name",
            dataIndex: "customerName",
            key: "customerName",
        },
        {
            title: "Customer Phone",
            dataIndex: "customerPhone",
            key: "customerPhone",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) => type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
        },
        {
            title: "Total Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (text) => `$${text.toFixed(2)}`,
        },
        {
            title: "Actions",
            key: "actions",
            render: (text, record) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined />}
                        style={{ borderRadius: 50 }}
                        onClick={() => showEditInvoiceModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 50 }}
                        danger
                        onClick={() => deleteInvoice(record.id)} // Use record.id instead of record.key
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="sales-container">
            {userRole === "admin" ? <AdminSidebar /> : <PharmacistSidebar />}

            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1>Sales & Invoices Management</h1>
                        <p>Dashboard / Sales & Invoices</p>
                    </div>
                    <div className="header-right">
                        <div onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
                            <Avatar size={50} icon={<UserOutlined />} />
                        </div>
                    </div>
                </header>

                <section className="sales-table">
                    <section className='table-header'>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={showAddInvoiceModal}
                            className="add-button"
                        >
                            Add Invoice
                        </Button>
                        <Search
                            placeholder="Search by customer phone"
                            allowClear
                            style={{ width: 500 }}
                            onSearch={handleSearch}
                        />
                    </section>
                    <Table columns={columns} dataSource={filteredInvoices} rowKey="id" /> {/* Set rowKey="id" */}
                </section>

                <AddInvoice
                    visible={isAddModalVisible}
                    onCreate={(newInvoice) => { // Handle onCreate callback
                        setIsAddModalVisible(false);
                        fetchInvoices(); // Refresh the list
                    }}
                    onCancel={handleCancel}
                />
                <EditInvoice
                    visible={isEditModalVisible}
                    onEdit={(updatedInvoice) => {
                        setIsEditModalVisible(false);
                        fetchInvoices(); // Refresh the list
                    }}
                    onCancel={handleCancel}
                    invoice={editingInvoice}
                />
            </main>
        </div>
    );
};

export default SalesInvoices;
