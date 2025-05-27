import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, Upload, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import './EditMedicineForm.css';

const { Option } = Select;

const EditMedicineForm = ({ visible, onEdit, onCancel, medicine, suppliers, locations, categories, brands }) => {
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Populate form and image URL when medicine changes
    useEffect(() => {
        if (medicine) {
            form.setFieldsValue({
                name: medicine.name,
                category_id: medicine.category_id,
                description: medicine.description,
                price: medicine.price,
                quantity: medicine.quantity,
                supplier_id: medicine.supplier_id,
                location_id: medicine.location_id,
                brand_id: medicine.brand_id,
                expiry_date: medicine.expiry_date ? moment(medicine.expiry_date) : null,
            });
            setImageUrl(medicine.imageUrl || null);
        }
    }, [medicine, form]);

    // Upload new image to Cloudinary
    const handleImageUpload = async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/medicines/${medicine.id}/image`,
                formData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const { imageUrl: newUrl } = response.data;
            setImageUrl(newUrl);
            message.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    // Delete existing image from Cloudinary
    const handleDeleteImage = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/medicines/${medicine.id}/image`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setImageUrl(null);
            message.success('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            message.error('Failed to delete image');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission (fields only)
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Build payload without image
            const payload = {
                name: values.name,
                category_id: values.category_id,
                description: values.description,
                price: values.price,
                quantity: values.quantity,
                supplier_id: values.supplier_id,
                location_id: values.location_id,
                brand_id: values.brand_id,
                expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined
            };

            const token = sessionStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/medicines/${medicine.id}`,
                payload,
                { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
            );

            // Construct updated medicine object
            const updatedMedicine = {
                ...response.data,
                id: medicine.id,
                category_id: values.category_id,
                supplier_id: values.supplier_id,
                location_id: values.location_id,
                brand_id: values.brand_id,
                imageUrl: imageUrl
            };

            message.success('Medicine updated successfully');
            onEdit(updatedMedicine);
            onCancel();
        } catch (error) {
            console.error('Error updating medicine:', error);
            message.error(error.response?.data?.message || 'Failed to update medicine');
        } finally {
            setLoading(false);
        }
    };

    // Upload component props
    const uploadProps = {
        beforeUpload: (file) => {
            const allowed = ['image/jpeg','image/png','image/gif','image/webp','image/avif'];
            if (!allowed.includes(file.type)) {
                message.error('Unsupported file type');
                return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 >= 5) {
                message.error('Image must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }
            handleImageUpload(file);
            return false;
        },
        showUploadList: false,
        accept: 'image/*'
    };

    return (
        <Modal
            centered
            visible={visible}
            title="Edit Medicine"
            okText="Save"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={() => form.validateFields().then(handleSubmit).catch(info => console.log('Validation Failed:', info))}
        >
            <Form form={form} layout="vertical" name="edit_medicine_form">
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name!' }]}>  
                            <Input placeholder="Name of medicine" />
                        </Form.Item>

                        <Form.Item name="category_id" label="Category" rules={[{ required: true, message: 'Select a category!' }]}>  
                            <Select placeholder="Category">
                                {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                            </Select>
                        </Form.Item>

                        <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Enter the price!' }]}>  
                            <Input type="number" placeholder="Price" step="0.01" />
                        </Form.Item>

                        <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Enter the quantity!' }]}>  
                            <Input type="number" placeholder="Quantity" />
                        </Form.Item>

                        <Form.Item name="supplier_id" label="Supplier" rules={[{ required: true, message: 'Select a supplier!' }]}>  
                            <Select placeholder="Supplier">
                                {suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                            </Select>
                        </Form.Item>

                        <Form.Item name="location_id" label="Location" rules={[{ required: true, message: 'Select a location!' }]}>  
                            <Select placeholder="Location">
                                {locations.map(l => <Option key={l.id} value={l.id}>{l.name}</Option>)}
                            </Select>
                        </Form.Item>

                        <Form.Item name="brand_id" label="Brand" rules={[{ required: true, message: 'Please select a brand!' }]}>  
                            <Select placeholder="Brand" allowClear>
                                {brands && brands.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="medicine-image-section" style={{ textAlign: 'center', marginBottom: 24 }}>
                            {imageUrl ? (
                                <div>
                                    <img
                                        src={imageUrl}
                                        alt="Medicine"
                                        style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                                    />
                                    <div style={{ marginTop: '8px' }}>
                                        <Button 
                                            type="primary" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            onClick={handleDeleteImage}
                                            loading={loading}
                                        >
                                            Remove Image
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Upload {...uploadProps}>
                                    <Button icon={<UploadOutlined />} loading={loading} style={{ width: 200 }}>
                                        Upload Medicine Image
                                    </Button>
                                </Upload>
                            )}
                        </div>

                        <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Enter a description!' }]}>  
                            <Input.TextArea placeholder="Short description" rows={4} />
                        </Form.Item>

                        <Form.Item name="expiry_date" label="Expiration Date" rules={[{ required: true, message: 'Select the expiration date!' }]}>  
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default EditMedicineForm;