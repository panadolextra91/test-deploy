import React from 'react';
import { Modal, Button, Descriptions, Tag, Table } from 'antd';

const OrderDetailsForm = ({ 
    visible, 
    order, 
    onCancel, 
    updateOrderStatus, 
    getStatusColor 
}) => {
    if (!order) return null;

    return (
        <Modal
            title={`Order Details - #${order?.id || ''}`}
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Close
                </Button>
            ]}
            width={800}
        >
            <div>
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Status">
                        <Tag color={getStatusColor(order.status)} style={{fontWeight: 'bold'}}>
                            {order.status.toUpperCase()}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                        ${parseFloat(order.total_amount).toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer" span={2}>
                        {order.customer?.name || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Pharmacy" span={2}>
                        {order.pharmacy?.name || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Shipping Address" span={2}>
                        {order.shipping_address || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>
                        {order.note || 'No notes'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Date Created">
                        {new Date(order.created_at).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                        {new Date(order.updated_at).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>

                <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Order Items</h3>
                <Table
                    dataSource={order.items || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                >
                    <Table.Column title="Medicine" dataIndex="medicine" key="medicine" 
                        render={(medicine) => medicine?.name || 'N/A'} />
                    <Table.Column title="Quantity" dataIndex="quantity" key="quantity" />
                    <Table.Column title="Unit Price" dataIndex="price" key="price" 
                        render={(price) => `$${parseFloat(price).toFixed(2)}`} />
                    <Table.Column title="Subtotal" key="subtotal" 
                        render={(_, record) => `$${(parseFloat(record.price) * record.quantity).toFixed(2)}`} />
                </Table>

                {/* Order Status Update Buttons */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {order.status === 'pending' && (
                        <>
                            <Button 
                                type="primary" 
                                onClick={() => updateOrderStatus(order.id, 'approved')}
                            >
                                Approve Order
                            </Button>
                            <Button 
                                danger
                                onClick={() => updateOrderStatus(order.id, 'denied')}
                            >
                                Deny Order
                            </Button>
                        </>
                    )}
                    {order.status === 'approved' && (
                        <Button 
                            type="primary" 
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Mark as Completed
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsForm;
