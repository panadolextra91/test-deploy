import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
//EditSupplierForm.js
const EditSupplierForm = ({ visible, onEdit, onCancel, supplier }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (supplier) {
      // Load the current supplier data into the form
      form.setFieldsValue({
        name: supplier.name,
        contact_info: supplier.contact,
        address: supplier.address,
      });
    }
  }, [supplier, form]);

  return (
    <Modal
        centered
      visible={visible}
      title="Edit Supplier"
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onEdit(values);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_supplier_form"
      >
        <Form.Item
          name="name"
          label="Supplier Name"
          rules={[
            {
              required: true,
              message: 'Please enter the supplier name!',
            },
          ]}
        >
          <Input placeholder="Enter supplier name" />
        </Form.Item>
        <Form.Item
          name="contact_info"
          label="Contact"
          rules={[
            {
              required: true,
              message: 'Please enter the supplier email!',
            },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          name="address"
          label="Address"
          rules={[
            {
              required: true,
              message: 'Please enter the supplier address!',
            },
          ]}
        >
          <Input placeholder="Enter address" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSupplierForm;
