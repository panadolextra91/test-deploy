import React, { useState, useEffect, useCallback } from "react";
import {
    UserOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { Avatar, Button, Table, Tag, message, Input } from "antd";
import axios from "axios";
import './Orders.css';
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import OrderDetailsForm from "./OderDetailsForm";
import { useNavigate } from "react-router-dom";

const Orders = () => {
    const { Search } = Input;
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false);
    const [userRole, setUserRole] = useState(null);
    
    // Using avatarUrl state for user profile image
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Initialize from sessionStorage if available
        const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
        return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
    });

    const handleAvatarClick = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    const fetchOrders = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Failed to fetch orders. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data.avatarUrl) {
                // Save to sessionStorage
                sessionStorage.setItem('userAvatarUrl', response.data.avatarUrl);
                setAvatarUrl(response.data.avatarUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Don't show error message to user for avatar loading failure
            setAvatarUrl(null);
            if (error.response && error.response.status === 401) {
                sessionStorage.removeItem('token');
                navigate('/login');
            }
        }
    }, [navigate, setAvatarUrl]);

    const checkUserRole = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setUserRole(response.data.role);
            
            // Redirect if not admin or pharmacist
            if (!['admin', 'pharmacist'].includes(response.data.role)) {
                message.error('You do not have permission to view this page');
                navigate('/');
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            navigate('/login');
        }
    }, [navigate, setUserRole]);
    
    const onSearch = async (value) => {
        const token = sessionStorage.getItem('token');

        if (!value) {
            fetchOrders(); // Fetch all orders if search is cleared
            return;
        }

        try {
            // Search for orders by customer name or order ID
            const searchResponse = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/orders/search?query=${encodeURIComponent(value)}`, 
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // If no results found, show message and return
            if (!searchResponse.data || searchResponse.data.length === 0) {
                message.info(`No orders found for "${value}".`);
                setOrders([]);
                return;
            }

            setOrders(searchResponse.data);
            message.success(`Found ${searchResponse.data.length} result(s) for "${value}".`);
        } catch (error) {
            console.error('Error searching orders:', error);
            message.error(error.response?.data?.message || `Error searching for "${value}". Please try again.`);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchUserProfile(); // Always fetch user profile when component mounts
        checkUserRole();
    }, [fetchOrders, fetchUserProfile, checkUserRole]);

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsOrderDetailsVisible(true);
    };

    const handleOrderDetailsCancel = () => {
        setIsOrderDetailsVisible(false);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        // Only allow valid statuses based on the Order model
        if (!['pending', 'approved', 'denied', 'completed'].includes(newStatus)) {
            message.error(`Invalid order status: ${newStatus}`);
            return;
        }
        
        const token = sessionStorage.getItem('token');
        try {
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success(`Order status updated to ${newStatus}`);
            fetchOrders(); // Refresh the orders list
            if (isOrderDetailsVisible) {
                setIsOrderDetailsVisible(false);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            message.error('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'gold';
            case 'denied':
                return 'red';
            case 'approved':
                return 'blue';
            case 'completed':
                return 'green';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            align: 'center',
            fixed: 'left',
            render: (id) => <span>#{id}</span>
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            width: 150,
            align: 'center',
            render: (customer) => (
                <span>{customer?.name || 'N/A'}</span>
            )
        },
        {
            title: 'Pharmacy',
            dataIndex: 'pharmacy',
            key: 'pharmacy',
            width: 150,
            align: 'center',
            render: (pharmacy) => (
                <span>{pharmacy?.name || 'N/A'}</span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status) => (
                <Tag color={getStatusColor(status)} style={{fontWeight: 'bold'}}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 100,
            align: 'center',
            render: (amount) => `$${parseFloat(amount).toFixed(2)}`
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            align: 'center',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Updated Date',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 150,
            align: 'center',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => viewOrderDetails(record)}
                        type="primary"
                        ghost
                        style={{ borderRadius: 50, minWidth: '80px', minHeight: '32px' }}
                        size="small"
                    >Details</Button>
                </div>
            )
        }
    ];

    // Determine which sidebar to display based on user role
    const Sidebar = userRole === 'admin' ? AdminSidebar : PharmacistSidebar;

    return (
        <div className="orders-container">
            <Sidebar activeKey="orders" />
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Orders Management</h1>
                        <p>Dashboard / Orders</p>
                    </div>
                    <div className='header-right'>
                        <div onClick={handleAvatarClick} style={{cursor: 'pointer'}}>
                        <Avatar 
                            size={50} 
                            icon={!avatarUrl && <UserOutlined />}
                            src={avatarUrl}
                            onError={() => {
                                setAvatarUrl(null);
                                sessionStorage.removeItem('userAvatarUrl');
                                return false;
                            }}
                        />
                        </div>
                    </div>
                </header>

                <div className="orders-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Search
                                className="search-bar"
                                placeholder="Search by order ID or customer name"
                                allowClear
                                onSearch={onSearch}
                            />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={orders}
                            loading={loading}
                            scroll={{ x: 1500 }}
                            size="small"
                            rowKey="id"
                        />
                    </div>
                </div>

                {/* Order Details Modal */}
                <OrderDetailsForm
                    visible={isOrderDetailsVisible}
                    order={selectedOrder}
                    onCancel={handleOrderDetailsCancel}
                    updateOrderStatus={updateOrderStatus}
                    getStatusColor={getStatusColor}
                />
            </main>
        </div>
    );
};

export default Orders;
