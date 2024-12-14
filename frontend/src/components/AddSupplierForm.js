import React from 'react';
import { Modal, Form, Input } from 'antd';
//AddSupplierForm.js
const AddSupplierForm = ({ visible, onCreate, onCancel }) => {
    const [form] = Form.useForm();

    return (
        <Modal
            centered
            visible={visible}
            title="Add Supplier"
            okText="Add"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={() => {
                form
                    .validateFields()
                    .then((values) => {
                        form.resetFields();
                        onCreate(values);
                    })
                    .catch((info) => {
                        console.log('Validate Failed:', info);
                    });
            }}
        >
            <Form
                form={form}
                layout="vertical"
                name="add_supplier_form"
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

export default AddSupplierForm;
