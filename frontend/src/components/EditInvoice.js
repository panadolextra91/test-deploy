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
    const [invoiceType, setInvoiceType] = useState('sale');

    useEffect(() => {
        if (visible) {
            const initialize = async () => {
                const fetchedMedicines = await fetchMedicines();
                populateForm(fetchedMedicines);
            };
            initialize();
        }
    }, [visible]);

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/medicines`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMedicines(response.data);
            return response.data;
        } catch (error) {
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
            setInvoiceType(invoice.type);

            const preparedItems = invoice.items.map((item) => {
                const medicine = fetchedMedicines.find(med => med.id === item.medicine_id);
                const availableQuantity = invoice.type === 'sale'
                    ? medicine.quantity + item.quantity
                    : medicine.quantity + 1000;

                const price = parseFloat(medicine.price) || 0;

                return {
                    key: item.medicine_id,
                    medicine_id: item.medicine_id,
                    name: medicine.name,
                    quantity: item.quantity,
                    price: price,
                    total: parseFloat((item.quantity * price).toFixed(2)),
                    available_quantity: availableQuantity,
                    toDelete: false,
                };
            });

            setItems(preparedItems);
        }
    };

    const handlePhoneChange = (phone) => {
        setCustomerPhone(phone);
        searchCustomer(phone);
    };

    const handleTypeChange = (type) => {
        setInvoiceType(type);
        setItems(items.map(item => ({
            ...item,
            available_quantity: type === 'sale'
                ? medicines.find(med => med.id === item.medicine_id)?.quantity + item.quantity || 0
                : 1000,
        })));
    };

    const handleAddItem = () => {
        if (!selectedMedicine || itemQuantity < 1) {
            message.error("Please select a valid medicine and quantity.");
            return;
        }

        const existingItem = items.find(item => item.medicine_id === selectedMedicine.id);
        const availableQuantity = invoiceType === 'sale'
            ? selectedMedicine.quantity + (existingItem?.quantity || 0)
            : 1000;

        if (itemQuantity > availableQuantity) {
            message.error(`Quantity exceeds available stock (${availableQuantity}).`);
            return;
        }

        if (existingItem) {
            setItems(items.map(item =>
                item.medicine_id === selectedMedicine.id
                    ? { ...item, quantity: item.quantity + itemQuantity, total: (item.quantity + itemQuantity) * item.price }
                    : item
            ));
        } else {
            setItems([...items, {
                key: selectedMedicine.id,
                medicine_id: selectedMedicine.id,
                name: selectedMedicine.name,
                quantity: itemQuantity,
                price: selectedMedicine.price,
                total: itemQuantity * selectedMedicine.price,
                available_quantity: availableQuantity,
                toDelete: false,
            }]);
        }

        setSelectedMedicine(null);
        setItemQuantity(1);
    };

    const handleQuantityChange = (key, quantity) => {
        if (quantity < 0) {
            return;
        }

        setItems(items.map(item =>
            item.key === key
                ? { ...item, quantity, total: quantity * item.price }
                : item
        ));
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const token = sessionStorage.getItem("token");

            const payload = {
                invoice_date: new Date().toISOString(),
                type: values.status,
                customer_id: customerPhone,
                items: items.map(item => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    toDelete: item.toDelete,
                })),
            };

            const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${invoice.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            message.success("Invoice updated successfully!");
            onEdit(response.data);
            handleCancel();
        } catch (error) {
            message.error("Failed to update invoice.");
        }
    };

    const searchCustomer = useCallback(
        debounce(async (phone) => {
            if (!phone) {
                form.setFieldsValue({ customer_name: null });
                return;
            }

            try {
                setLoadingCustomer(true);
                const token = sessionStorage.getItem("token");
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
        }, 500),
        [form]
    );


    const handleCancel = () => {
        form.resetFields();
        setItems([]);
        setSelectedMedicine(null);
        setItemQuantity(1);
        setCustomerPhone('');
        setInvoiceType('sale');
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
                    max={record.available_quantity}
                    value={quantity}
                    onChange={(value) => handleQuantityChange(record.key, value)}
                />
            ),
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price) => `$${price.toFixed(2)}`,
        },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            render: (total) => `$${total.toFixed(2)}`,
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
                    rules={[{ required: false }]}
                >
                    <Input
                        placeholder="Enter customer phone"
                        value={customerPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                    />
                </Form.Item>

                <Form.Item name="status" label="Type" rules={[{ required: true }]}>
                    <Select value={invoiceType} onChange={handleTypeChange}>
                        <Option value="sale">Sale</Option>
                        <Option value="purchase">Purchase</Option>
                    </Select>
                </Form.Item>

                <div>
                    <Select
                        placeholder="Select a medicine"
                        value={selectedMedicine?.id || null}
                        onChange={(value) => setSelectedMedicine(medicines.find(m => m.id === value))}
                    >
                        {medicines.map(med => (
                            <Option key={med.id} value={med.id}>{med.name}</Option>
                        ))}
                    </Select>
                    <InputNumber
                        min={1}
                        value={itemQuantity}
                        onChange={setItemQuantity}
                    />
                    <Button onClick={handleAddItem}>Add</Button>
                </div>

                <Table columns={columns} dataSource={items} rowKey="key" />
            </Form>
        </Modal>
    );
};

export default EditInvoice;
