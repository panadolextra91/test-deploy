import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal, Tabs, Card, Descriptions, Table, Tag, Button, Spin, message, Image, Form, Input,
    DatePicker, Select, Upload, Popconfirm, Space, Row, Col, Tooltip
} from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;

// Helper to get authorization headers
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// Helper function to determine BMI status and color
const getBmiInfo = (bmi) => {
    if (!bmi || isNaN(bmi)) {
        return { status: 'Not available', color: 'default' };
    }
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) {
        return { status: 'Underweight: Below 18.5', color: 'red' };
    } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
        return { status: 'Normal weight: 18.5 – 24.9', color: 'green' };
    } else if (bmiValue >= 25.0 && bmiValue <= 29.9) {
        return { status: 'Overweight: 25.0 – 29.9', color: 'gold' };
    } else if (bmiValue >= 30.0 && bmiValue <= 34.9) {
        return { status: 'Obesity Class I: 30.0 – 34.9', color: 'red' };
    } else if (bmiValue >= 35.0 && bmiValue <= 39.9) {
        return { status: 'Obesity Class II: 35.0 – 39.9', color: 'red' };
    } else if (bmiValue >= 40.0) {
        return { status: 'Obesity Class III (Severe Obesity): 40.0 and above', color: 'red' };
    } else {
        return { status: 'Not available', color: 'default' };
    }
};

const CustomerDetailsForm = ({ visible, customerId, onCancel, onUpdate }) => {
    // Component State
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [healthMetrics, setHealthMetrics] = useState(null);
    const [healthRecords, setHealthRecords] = useState([]);
    const [metricsHistory, setMetricsHistory] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingMetrics, setIsEditingMetrics] = useState(false);
    const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isAllergyModalVisible, setIsAllergyModalVisible] = useState(false);
    const [editingAllergy, setEditingAllergy] = useState(null);

    // Antd forms
    const [customerForm] = Form.useForm();
    const [metricsForm] = Form.useForm();
    const [recordForm] = Form.useForm();
    const [allergyForm] = Form.useForm();

    const fetchAllCustomerData = useCallback(async () => {
        if (!visible || !customerId) return;
        setLoading(true);

        // Reset all states to prevent showing old data during fetch
        setCustomer(null);
        setHealthMetrics(null);
        setHealthRecords([]);
        setMetricsHistory([]);
        setAllergies([]);
        customerForm.resetFields();
        metricsForm.resetFields();

        const headers = getAuthHeaders();
        const backendUrl = process.env.REACT_APP_BACKEND_URL;

        // --- THE FIX IS HERE ---
        // The API call for allergies is now corrected to use query parameters.
        const requests = [
            axios.get(`${backendUrl}/api/customers/${customerId}`, { headers }),
            axios.get(`${backendUrl}/api/health-metrics/customer/${customerId}`, { headers }),
            axios.get(`${backendUrl}/api/health-records/customer/${customerId}`, { headers }),
            axios.get(`${backendUrl}/api/health-metrics/history/${customerId}`, { headers }),
            axios.get(`${backendUrl}/api/allergies`, { 
                headers: headers,
                params: { customer_id: customerId } 
            }),
        ];
        
        const [customerRes, metricsRes, recordsRes, historyRes, allergiesRes] = await Promise.allSettled(requests);

        // Handle Customer Info
        if (customerRes.status === 'fulfilled') {
            setCustomer(customerRes.value.data);
            customerForm.setFieldsValue(customerRes.value.data);
        } else {
            message.error('Failed to load customer information.');
        }

        // Handle Health Metrics
        if (metricsRes.status === 'fulfilled') {
            const metricsData = metricsRes.value.data;
            setHealthMetrics(metricsData);
            metricsForm.setFieldsValue({ ...metricsData, date_of_birth: metricsData?.date_of_birth ? dayjs(metricsData.date_of_birth) : null });
        } // If rejected (404), state remains null from the reset above

        // Handle Health Records
        if (recordsRes.status === 'fulfilled') {
            setHealthRecords(recordsRes.value.data);
        } // If rejected, state remains []

        // Handle Metrics History
        if (historyRes.status === 'fulfilled') {
            setMetricsHistory(historyRes.value.data);
        } // If rejected, state remains []

        // Handle Allergies
        if (allergiesRes.status === 'fulfilled') {
            setAllergies(allergiesRes.value.data.data);
        } // If rejected, state remains []
        
        setLoading(false);
    }, [customerId, visible, customerForm, metricsForm]);

    useEffect(() => {
        if (visible) {
            fetchAllCustomerData();
        } else {
            // Reset editing modes when modal is closed
            setIsEditingInfo(false);
            setIsEditingMetrics(false);
        }
    }, [visible, fetchAllCustomerData]);

    const handleActionSuccess = () => {
        fetchAllCustomerData();
        if (onUpdate) {
            onUpdate();
        }
    };

    const handleSaveCustomerInfo = async (values) => {
        try {
            setLoading(true);
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/customers/${customerId}`, values, { headers: getAuthHeaders() });
            message.success('Customer information updated successfully!');
            setIsEditingInfo(false);
            handleActionSuccess();
        } catch (error) {
            console.error('Failed to update customer info:', error);
            message.error('Failed to update customer information.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMetrics = async (values) => {
        try {
            setLoading(true);
            const payload = { ...values, customer_id: customerId, date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null };
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/health-metrics/update`, payload, { headers: getAuthHeaders() });
            message.success('Health metrics updated successfully!');
            setIsEditingMetrics(false);
            handleActionSuccess();
        } catch (error) {
            console.error('Failed to update health metrics:', error);
            message.error('Failed to update health metrics.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllergy = async (allergyId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/allergies/${allergyId}`, { headers: getAuthHeaders() });
            message.success('Allergy deleted successfully!');
            handleActionSuccess();
        } catch (error) {
            message.error('Failed to delete allergy.');
        }
    };

    const handleOpenAllergyModal = (allergy = null) => {
        setEditingAllergy(allergy);
        if (allergy) {
            allergyForm.setFieldsValue(allergy);
        } else {
            allergyForm.resetFields();
        }
        setIsAllergyModalVisible(true);
    };

    const handleSaveAllergy = async (values) => {
        try {
            const method = editingAllergy ? 'put' : 'post';
            const url = editingAllergy
                ? `${process.env.REACT_APP_BACKEND_URL}/api/allergies/${editingAllergy.id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/allergies`;
            const payload = editingAllergy ? values : { ...values, customer_id: customerId };
            await axios[method](url, payload, { headers: getAuthHeaders() });
            message.success(`Allergy ${editingAllergy ? 'updated' : 'added'} successfully!`);
            setIsAllergyModalVisible(false);
            setEditingAllergy(null);
            handleActionSuccess();
        } catch (error) {
            console.error(`Failed to ${editingAllergy ? 'update' : 'add'} allergy:`, error);
            message.error(`Failed to ${editingAllergy ? 'update' : 'add'} allergy.`);
        }
    };

    const handleOpenRecordModal = (record = null) => {
        setEditingRecord(record);
        if (record) {
            recordForm.setFieldsValue({ ...record, date_recorded: record.date_recorded ? dayjs(record.date_recorded) : null });
        } else {
            recordForm.resetFields();
        }
        setIsRecordModalVisible(true);
    };

    const handleDeleteRecord = async (recordId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/health-records/${recordId}`, { headers: getAuthHeaders() });
            message.success('Health record deleted successfully!');
            handleActionSuccess();
        } catch (error) {
            message.error('Failed to delete health record.');
        }
    };

    const handleSaveRecord = async (values) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (key === 'file') {
                if (values.file && values.file[0]?.originFileObj) formData.append('file', values.file[0].originFileObj);
            } else if (key === 'date_recorded' && values.date_recorded) {
                formData.append(key, values.date_recorded.toISOString());
            } else if (values[key] != null) {
                formData.append(key, values[key]);
            }
        });
        formData.append('customer_id', customerId);
        try {
            setLoading(true);
            const url = editingRecord ? `${process.env.REACT_APP_BACKEND_URL}/api/health-records/${editingRecord.id}` : `${process.env.REACT_APP_BACKEND_URL}/api/health-records/`;
            const method = editingRecord ? 'put' : 'post';
            await axios[method](url, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }});
            message.success(`Health record ${editingRecord ? 'updated' : 'created'} successfully!`);
            setIsRecordModalVisible(false);
            handleActionSuccess();
        } catch (error) {
            console.error('Failed to save health record:', error);
            message.error('Failed to save health record.');
        } finally {
            setLoading(false);
        }
    };

    const centerAlign = { align: 'center' };
    const allergyColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', ...centerAlign },
        { title: 'Description', dataIndex: 'description', key: 'description', ...centerAlign, ellipsis: true },
        { title: 'Actions', key: 'actions', ...centerAlign, render: (_, record) => (
                <Space size="small">
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenAllergyModal(record)} />
                    <Popconfirm title="Delete this allergy?" onConfirm={() => handleDeleteAllergy(record.id)}><Button icon={<DeleteOutlined />} danger size="small" /></Popconfirm>
                </Space>
            )
        }
    ];
    const healthRecordColumns = [
        { title: 'Type', dataIndex: 'record_type', key: 'record_type', ...centerAlign, render: (type) => (<Tag color={type === 'LAB_RESULT' ? 'blue' : type === 'PRESCRIPTION' ? 'green' : 'orange'}>{type.replace('_', ' ')}</Tag>) },
        { title: 'Title', dataIndex: 'title', key: 'title', ...centerAlign },
        { title: 'Date', dataIndex: 'date_recorded', key: 'date_recorded', ...centerAlign, render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Provider', dataIndex: 'provider_name', key: 'provider_name', ...centerAlign },
        { title: 'Actions', key: 'actions', ...centerAlign, render: (_, record) => (
                <Space size="small">
                    <Button icon={<EditOutlined />} onClick={() => handleOpenRecordModal(record)} size="small" />
                    <Popconfirm title="Delete this record?" onConfirm={() => handleDeleteRecord(record.id)}><Button icon={<DeleteOutlined />} danger size="small" /></Popconfirm>
                </Space>
            )
        }
    ];
    const metricsHistoryColumns = [
        { title: 'Metric', dataIndex: 'metric_type', key: 'metric_type', ...centerAlign, render: (type) => type.replace(/_/g, ' ') },
        { title: 'Value', key: 'value', ...centerAlign, render: (_, record) => {
                const value = record.value_numeric || record.value_text;
                if (!value) return 'N/A';
                if (record.metric_type === 'BLOOD_PRESSURE') return `${value} mmHg`;
                if (record.metric_type === 'WEIGHT') return `${value} kg`;
                if (record.metric_type === 'HEIGHT') return `${value} cm`;
                return value;
            },
        },
        { title: 'Date Recorded', dataIndex: 'recorded_at', key: 'recorded_at', ...centerAlign, render: (date) => new Date(date).toLocaleString() },
    ];
    const formItemLayout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

    return (
        <Modal title={`Customer Details: ${customer?.name || 'Loading...'}`} visible={visible} onCancel={onCancel} footer={[<Button key="close" onClick={onCancel} size="small">Close</Button>]} width={850} centered>
            <Spin spinning={loading}>
                <Tabs defaultActiveKey="info" size="small" style={{ minHeight: 420 }}>
                    <TabPane tab="Information" key="info">
                        <Card size="small" title="Customer Information" extra={!isEditingInfo && <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditingInfo(true)}>Edit</Button>}>
                            {isEditingInfo ? (
                                <Form form={customerForm} {...formItemLayout} onFinish={handleSaveCustomerInfo} size="small">
                                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                                    <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
                                    <Form.Item name="email" label="Email"><Input /></Form.Item>
                                    <Form.Item wrapperCol={{ ...formItemLayout.wrapperCol, offset: 8 }}><Space><Button type="primary" htmlType="submit" size="small">Save</Button><Button onClick={() => setIsEditingInfo(false)} size="small">Cancel</Button></Space></Form.Item>
                                </Form>
                            ) : (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Name">{customer?.name || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{customer?.phone || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Email">{customer?.email || 'N/A'}</Descriptions.Item>
                                </Descriptions>
                            )}
                        </Card>
                    </TabPane>
                    <TabPane tab="Metrics & Allergies" key="metrics">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card size="small" title="Health Metrics" extra={!isEditingMetrics && <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditingMetrics(true)}>Edit</Button>}>
                                    {isEditingMetrics ? (
                                        <Form form={metricsForm} {...formItemLayout} onFinish={handleSaveMetrics} size="small">
                                            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}><Select><Option value="MALE">Male</Option><Option value="FEMALE">Female</Option></Select></Form.Item>
                                            <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                                            <Form.Item name="weight" label="Weight (kg)"><Input type="number" /></Form.Item>
                                            <Form.Item name="height" label="Height (cm)"><Input type="number" /></Form.Item>
                                            <Form.Item label="Blood Pressure"><Input.Group compact><Form.Item name="blood_pressure_systolic" noStyle><Input style={{ width: '50%' }} type="number" placeholder="Systolic"/></Form.Item><Form.Item name="blood_pressure_diastolic" noStyle><Input style={{ width: '50%' }} type="number" placeholder="Diastolic"/></Form.Item></Input.Group></Form.Item>
                                            <Form.Item name="blood_type" label="Blood Type"><Select>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => <Option key={bt} value={bt}>{bt}</Option>)}</Select></Form.Item>
                                            <Form.Item wrapperCol={{ ...formItemLayout.wrapperCol, offset: 8 }}><Space><Button type="primary" htmlType="submit" size="small">Save</Button><Button onClick={() => setIsEditingMetrics(false)} size="small">Cancel</Button></Space></Form.Item>
                                        </Form>
                                    ) : (
                                        <Descriptions bordered column={1} size="small">
                                            <Descriptions.Item label="Gender">{healthMetrics?.gender || 'N/A'}</Descriptions.Item>
                                            <Descriptions.Item label="DoB">{healthMetrics?.date_of_birth ? new Date(healthMetrics.date_of_birth).toLocaleDateString() : 'N/A'}</Descriptions.Item>
                                            <Descriptions.Item label="Blood Pressure">{healthMetrics?.blood_pressure || 'N/A'}</Descriptions.Item>
                                            <Descriptions.Item label="Weight">{healthMetrics?.weight ? `${healthMetrics.weight} kg` : 'N/A'}</Descriptions.Item>
                                            <Descriptions.Item label="Height">{healthMetrics?.height ? `${healthMetrics.height} cm` : 'N/A'}</Descriptions.Item>
                                            <Descriptions.Item label="BMI">{healthMetrics?.bmi ? (<Tooltip title={getBmiInfo(healthMetrics.bmi).status}><Tag color={getBmiInfo(healthMetrics.bmi).color}>{healthMetrics.bmi}</Tag></Tooltip>) : ('N/A')}</Descriptions.Item>
                                            <Descriptions.Item label="BMR">{healthMetrics?.bmr || 'N/A'}</Descriptions.Item>
                                        </Descriptions>
                                    )}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Allergies" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => handleOpenAllergyModal()}>Add</Button>}>
                                    <Table columns={allergyColumns} dataSource={allergies} rowKey="id" pagination={{ pageSize: 5 }} size="small" locale={{ emptyText: 'No allergies' }} />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>
                    <TabPane tab="Health Records" key="records">
                        <Card size="small" title="Health Records" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => handleOpenRecordModal()}>Add Record</Button>}>
                            <Table size="small" columns={healthRecordColumns} dataSource={healthRecords} rowKey="id" pagination={{ pageSize: 5 }} locale={{ emptyText: 'No health records found' }} expandable={{ expandedRowRender: (record) => (<Descriptions bordered layout="vertical" size="small" style={{background: '#fafafa', padding: '8px'}}><Descriptions.Item label="Description">{record.description||'N/A'}</Descriptions.Item>{record.file_url && (<Descriptions.Item label="Attached File"><Image width={150} src={record.file_url} alt={`Record: ${record.title}`} /></Descriptions.Item>)}</Descriptions>), rowExpandable: record => record.description || record.file_url }} />
                        </Card>
                    </TabPane>
                    <TabPane tab="Metrics History" key="history">
                        <Card size="small" title="Metrics History"><Table size="small" columns={metricsHistoryColumns} dataSource={metricsHistory} rowKey="id" pagination={{ pageSize: 5 }} locale={{ emptyText: 'No metrics history' }}/></Card>
                    </TabPane>
                </Tabs>
            </Spin>
            <Modal title={editingRecord ? 'Edit Health Record' : 'Add Health Record'} visible={isRecordModalVisible} onCancel={() => setIsRecordModalVisible(false)} footer={null} destroyOnClose>
                <Form form={recordForm} {...formItemLayout} onFinish={handleSaveRecord} size="small">
                    <Form.Item name="record_type" label="Record Type" rules={[{ required: true }]}><Select><Option value="PRESCRIPTION">Prescription</Option><Option value="LAB_RESULT">Lab Result</Option><Option value="DOCTOR_NOTE">Doctor's Note</Option></Select></Form.Item>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="date_recorded" label="Date Recorded" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="provider_name" label="Provider Name"><Input /></Form.Item>
                    <Form.Item label="Upload File" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}><Upload name="logo" listType="picture" beforeUpload={() => false} maxCount={1}><Button size="small" icon={<UploadOutlined />}>Click to upload</Button></Upload></Form.Item>
                    <Form.Item wrapperCol={{ ...formItemLayout.wrapperCol, offset: 8 }}><Button type="primary" htmlType="submit" size="small">{editingRecord ? 'Save Changes' : 'Create Record'}</Button></Form.Item>
                </Form>
            </Modal>
            <Modal title={editingAllergy ? "Edit Allergy" : "Add New Allergy"} visible={isAllergyModalVisible} onCancel={() => setIsAllergyModalVisible(false)} onOk={() => allergyForm.submit()} size="small" destroyOnClose>
                <Form form={allergyForm} {...formItemLayout} onFinish={handleSaveAllergy} size="small">
                    <Form.Item name="name" label="Allergy Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};

export default CustomerDetailsForm;