import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Button, Table, Select, InputNumber, message, Tooltip } from 'antd';
import axios from 'axios';
import debounce from 'lodash.debounce';

const { Option } = Select;

const AddInvoice = ({ visible, onCreate, onCancel }) => {
    const [form] = Form.useForm();
    const [items, setItems] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [customerPhone, setCustomerPhone] = useState('');
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [invoiceType, setInvoiceType] = useState('sale'); // Default to 'sale'

    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (visible) {
            const initialize = async () => {
                if (invoiceType === 'sale') {
                    await fetchMedicines();
                } else {
                    await fetchProducts();
                }
                form.resetFields();
                setItems([]);
                setSelectedMedicine(null);
                setSelectedProduct(null);
                setItemQuantity(1);
                setCustomerPhone('');
                setInvoiceType('sale');
            };
            initialize();
        }
    }, [visible]);

    useEffect(() => {
        if (visible) {
            if (invoiceType === 'sale') {
                fetchMedicines();
            } else {
                fetchProducts();
            }
            setSelectedMedicine(null);
            setSelectedProduct(null);
            setItemQuantity(1);
        }
    }, [invoiceType, visible]);

    const fetchMedicines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }
            const response = await axios.get(`${backendUrl}/api/medicines`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMedicines(response.data);
        } catch (error) {
            console.error("Error fetching medicines:", error);
            message.error("Failed to fetch medicines data.");
        }
    };

    const fetchProducts = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                message.error("Authentication token is missing.");
                return;
            }
            const response = await axios.get(`${backendUrl}/api/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error("Failed to fetch products data.");
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
                `${backendUrl}/api/customers/phone/${phone}`,
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
        []
    );

    const handlePhoneChange = (phone) => {
        setCustomerPhone(phone);
        debouncedSearch(phone);
    };

    const handleTypeChange = (value) => {
        setInvoiceType(value);
    };

    const handleAddItem = () => {
        if (invoiceType === 'sale') {
            if (!selectedMedicine) {
                message.error("Please select a medicine.");
                return;
            }
            const medicine = medicines.find(med => med.id === selectedMedicine.id);
            if (!medicine) {
                message.error("Selected medicine not found.");
                return;
            }
            const price = Number(medicine.price);
            const availableQuantity = Number(medicine.quantity);
            if (isNaN(price) || isNaN(availableQuantity)) {
                message.error("Invalid data for the selected medicine.");
                return;
            }
            if (itemQuantity < 1) {
                message.error("Quantity must be at least 1.");
                return;
            }
            let maxAllowedQuantity = availableQuantity;
            if (itemQuantity > maxAllowedQuantity) {
                message.error(`Selected quantity exceeds allowed stock (${maxAllowedQuantity}).`);
                return;
            }
            const existingItemIndex = items.findIndex((item) => item.medicine_id === selectedMedicine.id);
            if (existingItemIndex >= 0) {
                const existingItem = items[existingItemIndex];
                const newQuantity = existingItem.quantity + itemQuantity;
                if (newQuantity > maxAllowedQuantity) {
                    message.error(`Total quantity for "${selectedMedicine.name}" exceeds allowed stock (${maxAllowedQuantity}).`);
                    return;
                }
                const updatedItems = [...items];
                updatedItems[existingItemIndex].quantity = newQuantity;
                updatedItems[existingItemIndex].total = newQuantity * existingItem.price;
                setItems(updatedItems);
            } else {
                const newItem = {
                    key: items.length + 1,
                    medicine_id: selectedMedicine.id,
                    name: selectedMedicine.name,
                    quantity: itemQuantity,
                    price: price,
                    total: itemQuantity * price,
                    available_quantity: maxAllowedQuantity,
                };
                setItems([...items, newItem]);
            }
            setSelectedMedicine(null);
            setItemQuantity(1);
        } else if (invoiceType === 'purchase') {
            if (!selectedProduct) {
                message.error("Please select a product.");
                return;
            }
            const product = products.find(prod => prod.id === selectedProduct.id);
            if (!product) {
                message.error("Selected product not found.");
                return;
            }
            const price = Number(product.price);
            const availableQuantity = Number(product.quantity || 0);
            if (isNaN(price)) {
                message.error("Invalid price for the selected product.");
                return;
            }
            if (itemQuantity < 1) {
                message.error("Quantity must be at least 1.");
                return;
            }
            let maxAllowedQuantity = availableQuantity + 1000;
            if (itemQuantity > maxAllowedQuantity) {
                message.error(`Selected quantity exceeds allowed stock (${maxAllowedQuantity}).`);
                return;
            }
            const existingItemIndex = items.findIndex((item) => item.product_id === selectedProduct.id);
            if (existingItemIndex >= 0) {
                const existingItem = items[existingItemIndex];
                const newQuantity = existingItem.quantity + itemQuantity;
                if (newQuantity > maxAllowedQuantity) {
                    message.error(`Total quantity for "${selectedProduct.name}" exceeds allowed stock (${maxAllowedQuantity}).`);
                    return;
                }
                const updatedItems = [...items];
                updatedItems[existingItemIndex].quantity = newQuantity;
                updatedItems[existingItemIndex].total = newQuantity * existingItem.price;
                setItems(updatedItems);
            } else {
                const newItem = {
                    key: items.length + 1,
                    product_id: selectedProduct.id,
                    name: product.name,
                    brand: product.brand,
                    supplier: product.supplier ? product.supplier.name : '',
                    quantity: itemQuantity,
                    price: price,
                    total: itemQuantity * price,
                    available_quantity: maxAllowedQuantity
                };
                setItems([...items, newItem]);
            }
            setSelectedProduct(null);
            setItemQuantity(1);
        }
    };

    const handleQuantityChange = (key, newQuantity) => {
        if (newQuantity === 0) {
            setItems(items.filter((item) => item.key !== key));
        } else {
            const item = items.find((item) => item.key === key);
            if (!item) return;

            let maxAllowedQuantity = item.available_quantity;
            if (invoiceType === 'sale') {
                maxAllowedQuantity = item.available_quantity;
            } else if (invoiceType === 'purchase') {
                maxAllowedQuantity = item.available_quantity + 1000;
            }

            if (newQuantity > maxAllowedQuantity) {
                message.error(`Quantity exceeds allowed stock (${maxAllowedQuantity}).`);
                return;
            }

            const updatedItems = items.map((item) =>
                item.key === key
                    ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
                    : item
            );
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
                try {
                    const response = await axios.get(
                        `${backendUrl}/api/customers/phone/${values.customer_phone}`,
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

            let itemsPayload;
            if (invoiceType === 'sale') {
                itemsPayload = items.map((item) => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    price: item.price,
                }));
            } else {
                itemsPayload = items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    brand: item.brand || '',
                }));
            }

            const payload = {
                type: invoiceType,
                customer_id: customerId,
                invoice_date: new Date(),
                items: itemsPayload,
            };

            const response = await axios.post(
                `${backendUrl}/api/invoices`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            message.success("Invoice created successfully!");
            onCreate(response.data);

            if (invoiceType === 'sale') await fetchMedicines();
            else await fetchProducts();

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
        setInvoiceType('sale');
        onCancel();
    };

    const columns = [
        {
            title: invoiceType === 'sale' ? "Medicine Name" : "Product Name",
            dataIndex: "name",
            key: "name",
        },
        ...(invoiceType === 'purchase'
            ? [
                {
                    title: "Brand",
                    dataIndex: "brand",
                    key: "brand",
                },
                {
                    title: "Supplier",
                    dataIndex: "supplier",
                    key: "supplier",
                },
            ]
            : []),
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
            title="Add Invoice"
            onCancel={handleCancel}
            width={700}
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
                        value={invoiceType}
                    >
                        <Option value="sale">Sale</Option>
                        <Option value="purchase">Purchase</Option>
                    </Select>
                </Form.Item>

                <div style={{ marginBottom: 16 }}>
                    {invoiceType === 'sale' ? (
                        <>
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
                                        disabled={medicine.quantity === 0}
                                    >
                                        <Tooltip title={
                                            <div>
                                                <p><strong>Brand:</strong> {medicine.brand || 'N/A'}</p>
                                                <p><strong>Available Stock:</strong> {medicine.quantity}</p>
                                                <p><strong>Price:</strong> ${parseFloat(medicine.price).toFixed(2)}</p>
                                                {medicine.expiry_date && <p><strong>Expiry:</strong> {new Date(medicine.expiry_date).toLocaleDateString()}</p>}
                                            </div>
                                        }>
                                            {medicine.name} {medicine.quantity <= 0 ? "(Out of stock)" : ""}
                                        </Tooltip>
                                    </Option>
                                ))}
                            </Select>
                            <InputNumber
                                min={1}
                                max={selectedMedicine ? selectedMedicine.quantity : 1}
                                placeholder="Quantity"
                                value={itemQuantity}
                                onChange={(value) => setItemQuantity(value)}
                                style={{ width: '20%', marginRight: 8 }}
                                disabled={!selectedMedicine}
                            />
                            <Button type="primary" onClick={handleAddItem} disabled={!selectedMedicine}>
                                Add Item
                            </Button>
                        </>
                    ) : (
                        <>
                            <Select
                                placeholder="Select a product"
                                value={selectedProduct?.id || null}
                                onChange={(value) => {
                                    const product = products.find((p) => p.id === value);
                                    setSelectedProduct(product);
                                }}
                                style={{ width: '40%', marginRight: 8 }}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {products.map((product) => (
                                    <Option key={product.id} value={product.id}>
                                        <Tooltip title={
                                            <div>
                                                <p><strong>Brand:</strong> {product.brand || 'N/A'}</p>
                                                <p><strong>Supplier:</strong> {product.supplier ? product.supplier.name : 'N/A'}</p>
                                                <p><strong>Price:</strong> ${parseFloat(product.price).toFixed(2)}</p>
                                                <p><strong>Available Stock:</strong> {product.quantity || 0}</p>
                                            </div>
                                        }>
                                            {product.name}
                                        </Tooltip>
                                    </Option>
                                ))}
                            </Select>
                            <InputNumber
                                min={1}
                                max={selectedProduct ? (selectedProduct.quantity || 0) + 1000 : 1}
                                placeholder="Quantity"
                                value={itemQuantity}
                                onChange={(value) => setItemQuantity(value)}
                                style={{ width: '20%', marginRight: 8 }}
                                disabled={!selectedProduct}
                            />
                            <Button type="primary" onClick={handleAddItem} disabled={!selectedProduct}>
                                Add Item
                            </Button>
                        </>
                    )}
                </div>

                <Table columns={columns} dataSource={items} pagination={false} rowKey="key" />
            </Form>
        </Modal>
    );
};

export default AddInvoice;
