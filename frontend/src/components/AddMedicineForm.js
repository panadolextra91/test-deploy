import React from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
//AddMedicineForm.js
const { Option } = Select;

const AddMedicineForm = ({ visible, onCreate, onCancel, categories, suppliers, locations }) => {
    const [form] = Form.useForm();

    const handleAdd = async () => {
        try {
            const values = await form.validateFields();
            const formattedValues = {
                ...values,
                expiry_date: values.expiry_date.format('YYYY-MM-DD') // Format the date
            };

            onCreate(formattedValues); // Pass formatted values to onCreate
            form.resetFields();
        } catch (error) {
            message.error('Failed to add medicine.');
        }
    };

    return (
        <Modal
            centered
            visible={visible}
            title="Add Medicine"
            okText="Add"
            cancelText="Cancel"
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            onOk={handleAdd}
        >
            <Form
                form={form}
                layout="vertical"
                name="add_medicine_form"
            >
                <Form.Item
                    name="image"
                    label="Medicine Image"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => e.fileList}
                >
                    <Upload name="logo" listType="picture" beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>
                </Form.Item>
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: 'Please input the name of the medicine!' }]}
                >
                    <Input placeholder="Enter the name of the medicine" />
                </Form.Item>
                <Form.Item
                    name="category_id"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category!' }]}
                >
                    <Select placeholder="Select a category">
                        {categories.map((category) => (
                            <Option key={category.id} value={category.id}>{category.name}</Option> // Ensure unique key
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter a description!' }]}
                >
                    <Input.TextArea placeholder="Enter a short description of the medicine" />
                </Form.Item>
                <Form.Item
                    name="price"
                    label="Price"
                    rules={[{ required: true, message: 'Please input the price!' }]}
                >
                    <Input placeholder="Enter the price" type="number" />
                </Form.Item>
                <Form.Item
                    name="quantity"
                    label="Quantity"
                    rules={[{ required: true, message: 'Please input the quantity!' }]}
                >
                    <Input placeholder="Enter the quantity" type="number" />
                </Form.Item>
                <Form.Item
                    name="supplier_id"
                    label="Supplier"
                    rules={[{ required: true, message: 'Please select a supplier!' }]}
                >
                    <Select placeholder="Select supplier">
                        {suppliers.map((supplier) => (
                            <Option key={supplier.id} value={supplier.id}>{supplier.name}</Option> // Ensure unique key
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="location_id"
                    label="Location"
                    rules={[{ required: true, message: 'Please select a location!' }]}
                >
                    <Select placeholder="Select location">
                        {locations.map((location) => (
                            <Option key={location.id} value={location.id}>{location.name}</Option> // Ensure unique key
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="expiry_date"
                    label="Expiration Date"
                    rules={[{ required: true, message: 'Please select the expiration date!' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddMedicineForm;
