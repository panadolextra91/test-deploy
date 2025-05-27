import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
//AddMedicineForm.js
const { Option } = Select;

const AddMedicineForm = ({ visible, onCreate, onCancel, categories, suppliers, locations, brands }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (loading) return; // Prevent double submission
        
        try {
            setLoading(true);
            const values = await form.validateFields();
            console.log('Form values:', values);
            
            // Create FormData object
            const formData = new FormData();
            
            // Add all the text fields
            formData.append('name', values.name);
            formData.append('category_id', values.category_id.toString());
            formData.append('description', values.description || '');
            formData.append('price', values.price.toString());
            formData.append('quantity', values.quantity.toString());
            formData.append('supplier_id', values.supplier_id.toString());
            formData.append('location_id', values.location_id.toString());
            if (values.brand_id) {
                formData.append('brand_id', values.brand_id.toString());
            }
            formData.append('expiry_date', values.expiry_date.format('YYYY-MM-DD'));

            // Add the image file if it exists
            if (values.image && values.image[0] && values.image[0].originFileObj) {
                formData.append('image', values.image[0].originFileObj);
            }

            // Log FormData contents (for debugging)
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            // Send the request
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/medicines`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data) {
                message.success('Medicine added successfully');
                onCreate(response.data);
                form.resetFields();
                onCancel(); // Close the modal after successful submission
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data
            });
            message.error(error.response?.data?.error || 'Failed to add medicine.');
        } finally {
            setLoading(false);
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
            confirmLoading={loading}
            okButtonProps={{ loading }}
        >
            <Form
                form={form}
                layout="vertical"
                name="add_medicine_form"
            >
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>

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
                            <Option key={category.id} value={category.id}>{category.name}</Option>
                        ))}
                    </Select>
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
                            <Option key={supplier.id} value={supplier.id}>{supplier.name}</Option>
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
                            <Option key={location.id} value={location.id}>{location.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="brand_id"
                    label="Brand"
                    rules={[{ required: true, message: 'Please select a brand!' }]}
                >
                    <Select placeholder="Select brand" allowClear>
                        {brands && brands.map((brand) => (
                            <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Form.Item
                            name="image"
                            label="Medicine Image"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                        >
                            <Upload 
                                name="image"
                                listType="picture"
                                maxCount={1}
                                beforeUpload={() => false}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Upload Image</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please enter a description!' }]}
                        >
                            <Input.TextArea placeholder="Enter a short description of the medicine" rows={4} />
                        </Form.Item>
                        <Form.Item
                            name="expiry_date"
                            label="Expiration Date"
                            rules={[{ required: true, message: 'Please select the expiration date!' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default AddMedicineForm;
