import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Modal, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const EditPharmaSalesRepForm = ({ visible, onEdit, onCancel, salesRep }) => {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && salesRep) {
      fetchSuppliers();
      form.setFieldsValue({
        name: salesRep.name,
        email: salesRep.email,
        phone: salesRep.phone,
        supplier_id: salesRep.supplier_id
      });
    }
  }, [visible, salesRep, form]);

  const fetchSuppliers = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (err) {
      message.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onEdit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      title="Edit Sales Representative"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Update"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter name' }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: 'Please enter phone number' }]}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>
        <Form.Item
          name="supplier_id"
          label="Supplier"
          rules={[{ required: true, message: 'Please select a supplier' }]}
        >
          <Select placeholder="Select a supplier" loading={loading}>
            {suppliers.map(supplier => (
              <Option key={supplier.id} value={supplier.id}>{supplier.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPharmaSalesRepForm;