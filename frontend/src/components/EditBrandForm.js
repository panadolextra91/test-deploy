import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const EditBrandForm = ({ visible, onEdit, onCancel, brand }) => {
    const [form] = Form.useForm();
    const [logoUrl, setLogoUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && brand) {
            form.setFieldsValue({
                name: brand.name,
                manufacturer: brand.manufacturer,
                country: brand.country,
                description: brand.description
            });

            // Set logo URL if brand has logo
            setLogoUrl(brand.logo || null);
        }
    }, [visible, brand, form]);

    // Upload new logo to server
    const handleLogoUpload = async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/brands/${brand.id}/logo`,
                formData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const { logoUrl: newUrl } = response.data;
            setLogoUrl(newUrl);
            message.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Error uploading logo:', error);
            message.error(error.response?.data?.message || 'Failed to upload logo');
        } finally {
            setLoading(false);
        }
    };

    // Delete existing logo
    const handleDeleteLogo = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/brands/${brand.id}/logo`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setLogoUrl(null);
            message.success('Logo deleted successfully');
        } catch (error) {
            console.error('Error deleting logo:', error);
            message.error('Failed to delete logo');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Create FormData object for form fields only
            const formData = new FormData();
            formData.append('name', values.name);
            if (values.manufacturer) formData.append('manufacturer', values.manufacturer);
            if (values.country) formData.append('country', values.country);
            if (values.description) formData.append('description', values.description);
            
            onEdit(brand.id, formData);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Upload component props
    const uploadProps = {
        beforeUpload: (file) => {
            // Check file type
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return Upload.LIST_IGNORE;
            }
            
            // Check file size (2MB limit)
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('Image must be smaller than 2MB!');
                return Upload.LIST_IGNORE;
            }
            
            handleLogoUpload(file);
            return false; // Prevent auto upload
        },
        showUploadList: false,
        accept: 'image/*'
    };

    return (
        <Modal
            title="Edit Brand"
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>Cancel</Button>,
                <Button key="submit" type="primary" onClick={handleSubmit}>Save</Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <div className="brand-logo-section" style={{ textAlign: 'center', marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Brand Logo</label>
                    {logoUrl ? (
                        <div>
                            <img
                                src={logoUrl}
                                alt="Brand Logo"
                                style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Button 
                                    type="primary" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    onClick={handleDeleteLogo}
                                    loading={loading}
                                >
                                    Remove Logo
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />} loading={loading} style={{ width: 200 }}>
                                Upload Brand Logo
                            </Button>
                        </Upload>
                    )}
                </div>
                
                <Form.Item
                    name="name"
                    label="Brand Name"
                    rules={[{ required: true, message: 'Please enter brand name' }]}
                >
                    <Input placeholder="Enter brand name" />
                </Form.Item>
                
                <Form.Item
                    name="manufacturer"
                    label="Manufacturer"
                >
                    <Input placeholder="Enter manufacturer name" />
                </Form.Item>
                
                <Form.Item
                    name="country"
                    label="Country"
                >
                    <Input placeholder="Enter country of origin" />
                </Form.Item>
                
                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea rows={4} placeholder="Enter brand description" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditBrandForm;