// EditInvoice.js

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Button, Table, Select, InputNumber, message } from 'antd';
import axios from 'axios';
import debounce from 'lodash.debounce';

const { Option } = Select;

const EditInvoice = ({ visible, onEdit, onCancel, invoice }) => {
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
                const fetchedMedicines = await fetchMedicines();
                populateForm(fetchedMedicines);
            };
            initialize();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return [];
            }
            const response = await axios.get('http://localhost:3000/api/medicines', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched Medicines:", response.data); // Debugging line
            setMedicines(response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching medicines:", error);
            message.error("Failed to fetch medicines data.");
            return [];
        }
    };

    const populateForm = (fetchedMedicines) => {
        if (invoice && fetchedMedicines.length > 0) {
            form.setFieldsValue({
                customer_phone: invoice.customerPhone !== "N/A" ? invoice.customerPhone : '',
                customer_name: invoice.customerName !== "N/A" ? invoice.customerName : '',
                status: invoice.type,
            });
            setCustomerPhone(invoice.customerPhone !== "N/A" ? invoice.customerPhone : '');
            setInvoiceType(invoice.type); // Set the invoice type based on existing data

            // Prepare items with updated prices and totals
            const preparedItems = invoice.items.map((item, index) => {
                const medicine = fetchedMedicines.find(med => med.id === item.medicine_id);
                if (!medicine) {
                    message.warning(`Medicine with ID ${item.medicine_id} not found.`);
                    return {
                        key: item.medicine_id, // Use medicine_id as key
                        medicine_id: item.medicine_id,
                        name: "Unknown Medicine",
                        quantity: item.quantity,
                        price: 0,
                        total: 0,
                        available_quantity: 0,
                        toDelete: false,
                    };
                }

                // Determine available quantity based on invoice type
                let availableQuantity = 0;
                if (invoice.type === 'sale') {
                    availableQuantity = medicine.quantity + item.quantity;
                } else if (invoice.type === 'purchase') {
                    availableQuantity = medicine.quantity + 1000; // Example upper limit
                }

                // Ensure price is a number
                const price = typeof medicine.price === 'number' ? medicine.price : parseFloat(medicine.price) || 0;

                return {
                    key: item.medicine_id, // Use medicine_id as key
                    medicine_id: item.medicine_id,
                    name: medicine.name,
                    quantity: item.quantity,
                    price: price,
                    total: parseFloat((item.quantity * price).toFixed(2)), // Ensure total is a number with two decimals
                    available_quantity: availableQuantity,
                    toDelete: false, // Initialize the deletion flag
                };
            });

            console.log("Prepared Items:", preparedItems); // Debugging line
            setItems(preparedItems);
        }
    };

    // Add useEffect to monitor items state
    useEffect(() => {
        console.log("Items state updated:", items);
    }, [items]);

    const searchCustomer = async (phone) => {
        try {
            setLoadingCustomer(true);
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }

            if (!phone) {
                form.setFieldsValue({ customer_name: null });
                return;
            }

            const response = await axios.get(
                `http://localhost:3000/api/customers/phone/${phone}`,
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

    const handleTypeChange = (value) => {
        setInvoiceType(value);
        // Update available_quantity for all items based on the new type
        const updatedItems = items.map(item => {
            let newAvailableQuantity = 0;
            const medicine = medicines.find(med => med.id === item.medicine_id);
            if (medicine) {
                if (value === 'sale') {
                    newAvailableQuantity = medicine.quantity + item.quantity;
                } else if (value === 'purchase') {
                    newAvailableQuantity = medicine.quantity + 1000;
                }
            }
            return { ...item, available_quantity: newAvailableQuantity };
        });
        setItems(updatedItems);
    };

    const handleAddItem = () => {
        if (!selectedMedicine) {
            message.error("Please select a medicine.");
            return;
        }

        const medicine = medicines.find(med => med.id === selectedMedicine.id);
        if (!medicine) {
            message.error("Selected medicine not found.");
            return;
        }

        // Determine available quantity based on invoice type
        let availableQuantity = 0;
        const existingItem = items.find(item => item.medicine_id === selectedMedicine.id);
        if (invoiceType === 'sale') {
            availableQuantity = medicine.quantity + (existingItem ? existingItem.quantity : 0);
        } else if (invoiceType === 'purchase') {
            availableQuantity = medicine.quantity + 1000; // Example upper limit
        }

        // Ensure price is a number
        const price = typeof medicine.price === 'number' ? medicine.price : parseFloat(medicine.price) || 0;
        if (isNaN(price) || price <= 0) {
            message.error("Invalid or missing price for the selected medicine.");
            return;
        }

        if (itemQuantity < 1) {
            message.error("Quantity must be at least 1.");
            return;
        }

        if (itemQuantity > availableQuantity) {
            message.error(`Selected quantity exceeds allowed stock (${availableQuantity}).`);
            return;
        }

        if (existingItem) {
            const newQuantity = existingItem.quantity + itemQuantity;
            if (newQuantity > availableQuantity) {
                message.error(`Total quantity for "${selectedMedicine.name}" exceeds allowed stock (${availableQuantity}).`);
                return;
            }

            const updatedItems = items.map(item =>
                item.medicine_id === selectedMedicine.id
                    ? { ...item, quantity: newQuantity, total: parseFloat((newQuantity * item.price).toFixed(2)), toDelete: false }
                    : item
            );
            setItems(updatedItems);
        } else {
            const newItem = {
                key: selectedMedicine.id, // Use medicine_id as key
                medicine_id: selectedMedicine.id,
                name: selectedMedicine.name,
                quantity: itemQuantity,
                price: price,
                total: parseFloat((itemQuantity * price).toFixed(2)),
                available_quantity: availableQuantity, // Store allowed stock for reference
                toDelete: false, // Initialize the deletion flag
            };
            setItems([...items, newItem]);
        }

        setSelectedMedicine(null);
        setItemQuantity(1);
    };

    const handleQuantityChange = (key, newQuantity) => {
        if (newQuantity === 0) {
            // Flag the item for deletion instead of removing it
            const updatedItems = items.map(item =>
                item.key === key
                    ? { ...item, quantity: 0, toDelete: true }
                    : item
            );
            console.log("Updated Items after deletion flag:", updatedItems);
            setItems(updatedItems);
        } else {
            const item = items.find((item) => item.key === key);
            if (!item) return;

            let maxAllowedQuantity = item.available_quantity;

            if (newQuantity > maxAllowedQuantity) {
                message.error(`Quantity exceeds allowed stock (${maxAllowedQuantity}).`);
                return;
            }

            const updatedItems = items.map((item) =>
                item.key === key
                    ? { ...item, quantity: newQuantity, total: parseFloat((newQuantity * item.price).toFixed(2)), toDelete: false }
                    : item
            );
            console.log("Updated Items after quantity change:", updatedItems);
            setItems(updatedItems);
        }
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
                // Fetch or create customer logic
                try {
                    const response = await axios.get(
                        `http://localhost:3000/api/customers/phone/${values.customer_phone}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data) {
                        customerId = response.data.id;
                    } else {
                        // Optionally, create a new customer if not found
                        /*
                        const customerPayload = {
                            name: values.customer_name || "Unknown",
                            phone: values.customer_phone,
                        };
                        const customerResponse = await axios.post(
                            "http://localhost:3000/api/customers",
                            customerPayload,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        customerId = customerResponse.data.id;
                        */
                        // For now, we'll leave it as null
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
                    toDelete: item.toDelete || false, // Include the deletion flag
                })),
            };

            console.log("Payload sent to backend:", payload);

            // Make PUT request to update the invoice
            const response = await axios.put(`http://localhost:3000/api/invoices/${invoice.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Response from backend:", response.data);
            message.success("Invoice updated successfully!");
            // Call onEdit with the updated invoice
            onEdit(response.data);
            // Refetch medicines to update stock
            await fetchMedicines();
            handleCancel();
        } catch (error) {
            console.error("Error updating invoice or customer:", error.response?.data || error.message);
            // Display the specific error message from the backend
            const errorMsg = error.response?.data?.error || "Failed to update invoice";
            message.error(errorMsg);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setItems([]);
        setSelectedMedicine(null);
        setItemQuantity(1);
        setCustomerPhone('');
        setInvoiceType(invoice ? invoice.type : 'sale'); // Reset to original invoice type if available
        onCancel();
    };

    const columns = [
        {
            title: "Item Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            render: (quantity, record) => (
                <InputNumber
                    min={0}
                    max={record.available_quantity} // Limit to allowed stock
                    value={quantity}
                    onChange={(value) => handleQuantityChange(record.key, value)}
                    style={{ width: '100%' }}
                    className={record.toDelete ? 'input-deletion' : ''}
                />
            ),
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price) => (typeof price === "number" ? `$${price.toFixed(2)}` : "N/A"),
        },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            render: (total) => (typeof total === "number" ? `$${total.toFixed(2)}` : "N/A"),
        },
    ];

    return (
        <Modal
            visible={visible}
            title="Edit Invoice"
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
                        onChange={handleTypeChange}
                        value={invoiceType} // Ensure the Select reflects the current type
                    >
                        <Option value="sale">Sale</Option>
                        <Option value="purchase">Purchase</Option>
                    </Select>
                </Form.Item>

                <div style={{ marginBottom: 16 }}>
                    <Select
                        placeholder="Select a medicine"
                        value={selectedMedicine?.id || null}
                        onChange={(value) => {
                            const medicine = medicines.find((m) => m.id === value);
                            setSelectedMedicine(medicine);
                        }}
                        style={{ width: '40%', marginRight: 8 }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {medicines.map((medicine) => (
                            <Option
                                key={medicine.id}
                                value={medicine.id}
                                disabled={invoiceType === 'sale' && medicine.quantity === 0}
                            >
                                {medicine.name} {medicine.quantity > 0 ? `(${medicine.quantity} available)` : "(Out of stock)"}
                            </Option>
                        ))}
                    </Select>
                    <InputNumber
                        min={1}
                        max={selectedMedicine ? (invoiceType === 'sale' ? selectedMedicine.quantity + (items.find(item => item.medicine_id === selectedMedicine.id)?.quantity || 0) : selectedMedicine.quantity + 1000) : 1}
                        placeholder="Quantity"
                        value={itemQuantity}
                        onChange={(value) => setItemQuantity(value)}
                        style={{ width: '20%', marginRight: 8 }}
                        disabled={!selectedMedicine}
                    />
                    <Button type="primary" onClick={handleAddItem} disabled={!selectedMedicine}>
                        Add Item
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={items}
                    pagination={false}
                    rowKey="key"
                />
            </Form>
        </Modal>
    )
};

export default EditInvoice;
