import React, { useEffect } from "react";
import { Modal, Form, Input, Select, message } from "antd";

const EditUserForm = ({ visible, onEdit, onCancel, initialValues }) => {
    const [form] = Form.useForm();

    // Set initial form values when the component is rendered
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                username: initialValues.username,
                name: initialValues.name,
                email: initialValues.email,
                role: initialValues.role
            });
        }
    }, [initialValues, form]);

    return (
        <Modal
            title="Edit User"
            visible={visible}
            onCancel={onCancel}
            onOk={() => {
                form
                    .validateFields()
                    .then((values) => {
                        form.resetFields();
                        onEdit(values);
                    })
                    .catch((info) => {
                        console.log("Validate Failed:", info);
                    });
            }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="username"
                    label="Username"
                    rules={[{ required: true, message: "Please enter the username" }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: "Please enter the name" }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        {
                            required: true,
                            type: "email",
                            message: "Please enter a valid email",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: "Please select a role" }]}
                >
                    <Select placeholder="Select a role">
                        <Select.Option value="admin">Admin</Select.Option>
                        <Select.Option value="pharmacist">Pharmacist</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditUserForm;