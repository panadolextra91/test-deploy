import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const AddBrandForm = ({ visible, onAdd, onCancel }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [loading, setLoading] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const token = sessionStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('name', values.name);
            if (values.manufacturer) formData.append('manufacturer', values.manufacturer);
            if (values.country) formData.append('country', values.country);
            if (values.description) formData.append('description', values.description);
            
            // Add logo file if exists
            if (fileList.length > 0 && fileList[0].originFileObj) {
                console.log('📎 Adding logo file to FormData:', fileList[0].originFileObj.name);
                formData.append('logo', fileList[0].originFileObj);
            } else if (fileList.length > 0) {
                console.log('⚠️ File exists but no originFileObj:', fileList[0]);
            } else {
                console.log('ℹ️ No logo file selected');
            }
            
            // Create new brand with logo in single request
            await axios.post(`${backendUrl}/api/brands`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            message.success('Brand created successfully');
            onAdd();
            handleCancel();
        } catch (error) {
            console.error('Error submitting brand:', error);
            message.error(error.response?.data?.error || 'Failed to save brand');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setFileList([]);
        onCancel();
    };
    
    // Upload component props
    const uploadProps = {
        onRemove: () => {
            setFileList([]);
        },
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
            
            // Create preview URL for the new file
            setFileList([{
                ...file,
                url: URL.createObjectURL(file),
                originFileObj: file
            }]);
            return false; // Prevent auto upload
        },
        fileList,
    };

    return (
        <Modal
            title="Add Brand"
            visible={visible}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
                <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>Save</Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <div className="brand-logo-section" style={{ textAlign: 'center', marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Brand Logo</label>
                    {fileList.length > 0 && fileList[0].url ? (
                        <div>
                            <img
                                src={fileList[0].url}
                                alt="Brand Logo"
                                style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Button 
                                    type="primary" 
                                    danger 
                                    onClick={() => setFileList([])}
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

export default AddBrandForm;