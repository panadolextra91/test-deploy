import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Button, Table, Select, InputNumber, message } from 'antd';
import axios from 'axios';
import debounce from 'lodash.debounce';

const { Option } = Select;

const AddInvoice = ({ visible, onCreate, onCancel }) => { // Destructure onCreate from props
    const [form] = Form.useForm();
    const [items, setItems] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [customerPhone, setCustomerPhone] = useState('');
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [invoiceType, setInvoiceType] = useState('sale'); // Default to 'sale'

    useEffect(() => {
        if (visible) {
            const initialize = async () => {
                await fetchMedicines();
                // Optionally, reset the form and states when the modal is opened
                form.resetFields();
                setItems([]);
                setSelectedMedicine(null);
                setItemQuantity(1);
                setCustomerPhone('');
                setInvoiceType('sale'); // Reset to default or as needed
            };
            initialize();
        }
    }, [visible]);

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMedicines(response.data);
        } catch (error) {
            console.error("Error fetching medicines:", error);
            message.error("Failed to fetch medicines data.");
        }
    };

    const searchCustomer = async (phone) => {
        try {
            setLoadingCustomer(true);
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }

            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/customers/phone/${phone}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data) {
                form.setFieldsValue({ customer_name: response.data.name });
                message.success("Customer found!");
            } else {
                form.setFieldsValue({ customer_name: null });
                message.warning("No customer found. A new customer will be created if left blank.");
            }
        } catch (error) {
            console.error("Error fetching customer:", error);
            message.error("Failed to fetch customer.");
        } finally {
            setLoadingCustomer(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((phone) => {
            if (phone) {
                searchCustomer(phone);
            } else {
                form.setFieldsValue({ customer_name: null });
            }
        }, 500),
        [] // Empty dependencies ensure this is created only once
    );

    const handlePhoneChange = (phone) => {
        setCustomerPhone(phone);
        debouncedSearch(phone);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const token = sessionStorage.getItem("token");
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }

            let customerId = null;

            if (values.customer_phone) {
                try {
                    const response = await axios.get(
                        `${process.env.REACT_APP_BACKEND_URL}/api/customers/phone/${values.customer_phone}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data) {
                        customerId = response.data.id;
                    }
                } catch (error) {
                    console.error("Error fetching/creating customer:", error);
                    message.error("Failed to fetch or create customer.");
                    return;
                }
            }

            const payload = {
                invoice_date: new Date().toISOString(),
                type: values.status,
                customer_id: customerId,
                items: items.map((item) => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                })),
            };

            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/invoices`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            message.success("Invoice created successfully!");
            onCreate(response.data);
            await fetchMedicines();
            handleCancel();
        } catch (error) {
            console.error("Error creating invoice or customer:", error.response?.data || error.message);
            const errorMsg = error.response?.data?.error || "Failed to create invoice";
            message.error(errorMsg);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setItems([]);
        setSelectedMedicine(null);
        setItemQuantity(1);
        setCustomerPhone('');
        setInvoiceType('sale'); // Reset to default
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            title="Add Invoice"
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSave} disabled={!items.length}>
                    Save
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="customer_phone"
                    label="Customer Phone"
                    rules={[{ required: false, message: "Please enter customer phone number!" }]}
                >
                    <Input
                        placeholder="Enter customer phone"
                        value={customerPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        disabled={loadingCustomer}
                    />
                </Form.Item>

                <Form.Item name="customer_name" label="Customer Name">
                    <Input placeholder="Customer name will appear here or can be left blank" />
                </Form.Item>

                <Form.Item name="status" label="Type" rules={[{ required: true, message: "Please select invoice type!" }]}>
                    <Select
                        placeholder="Select type"
                        onChange={(value) => setInvoiceType(value)}
                        value={invoiceType}
                    >
                        <Option value="sale">Sale</Option>
                        <Option value="purchase">Purchase</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddInvoice;
