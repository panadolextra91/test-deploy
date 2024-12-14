// EditMedicineForm.js
import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker } from 'antd';
import moment from 'moment';

const { Option } = Select;

const EditMedicineForm = ({ visible, onEdit, onCancel, medicine, suppliers, locations }) => {
    const [form] = Form.useForm();

    // Populate the form with the selected medicine’s data
    useEffect(() => {
        if (medicine) {
            form.setFieldsValue({
                ...medicine,
                expirationDate: medicine.expiry_date ? moment(medicine.expiry_date) : null,
                supplier: medicine.supplier || '',
                location: medicine.location || '',
                category: medicine.category || '',
            });
        }
    }, [medicine, form]);

    return (
        <Modal
            centered
            visible={visible}
            title="Edit Medicine"
            okText="Save"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={() => {
                form
                    .validateFields()
                    .then((values) => {
                        onEdit({ ...medicine, ...values }); // Pass updated values
                        form.resetFields();
                    })
                    .catch((info) => {
                        console.log('Validation Failed:', info);
                    });
            }}
        >
            <Form form={form} layout="vertical" name="form_in_modal">
                <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name of the medicine!' }]}>
                    <Input placeholder="Enter the name of the medicine" />
                </Form.Item>
                <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select a category!' }]}>
                    <Select placeholder="Select a category">
                        <Option value="Pain Relief">Pain Relief</Option>
                        <Option value="Antibiotics">Antibiotics</Option>
                        <Option value="Allergy">Allergy</Option>
                        {/* Add more categories as needed */}
                    </Select>
                </Form.Item>
                <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description!' }]}>
                    <Input.TextArea placeholder="Enter a description" />
                </Form.Item>
                <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please input the price!' }]}>
                    <Input placeholder="Enter the price" />
                </Form.Item>
                <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Please input the quantity!' }]}>
                    <Input placeholder="Enter the quantity" />
                </Form.Item>
                {/* <Form.Item name="supplier" label="Supplier" rules={[{ required: true, message: 'Please enter supplier information!' }]}>
                    <Input placeholder="Enter supplier" />
                </Form.Item>
                <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Please enter location information!' }]}>
                    <Input placeholder="Enter location" />
                </Form.Item> */}
                <Form.Item name="supplier" label="Supplier" rules={[{ required: true, message: 'Please select a supplier!' }]}>
                    <Select placeholder="Select a supplier">
                        {suppliers.map((supplier) => (
                            <Option key={supplier.id} value={supplier.name}>
                                {supplier.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Please select a location!' }]}>
                    <Select placeholder="Select a location">
                        {locations.map((location) => (
                            <Option key={location.id} value={location.name}>
                                {location.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="expirationDate" label="Expiration Date" rules={[{ required: true, message: 'Please select the expiration date!' }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditMedicineForm;
