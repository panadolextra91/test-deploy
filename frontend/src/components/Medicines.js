import React, { useState, useEffect, useCallback } from "react";
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    BellOutlined, // Added BellOutlined
} from '@ant-design/icons';
import { Avatar, Button, Table, Tag, Tooltip, message, Input, Select, Badge, Dropdown, List, Spin } from "antd"; // Added Badge, Dropdown, List, Spin
import axios from "axios";
import './Medicines.css';
import AddMedicineForm from "./AddMedicineForm";
import EditMedicineForm from "./EditMedicineForm";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select; // Added Option for Select

const Medicines = () => {
    const LOW_STOCK_THRESHOLD = 20;
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const userRole = sessionStorage.getItem('userRole');

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState(() => sessionStorage.getItem('userAvatarUrl')); // Initialize with full URL

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            console.log('Medicines: Token or backendUrl missing for profile fetch.');
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
            if (userData.avatarUrl) {
                const fullUrl = userData.avatarUrl.startsWith('http')
                    ? userData.avatarUrl
                    : `${backendUrl}${userData.avatarUrl.startsWith('/') ? '' : '/'}${userData.avatarUrl.replace(/\\/g, '/')}`;
                sessionStorage.setItem('userAvatarUrl', fullUrl);
                setAvatarUrl(fullUrl);
            } else {
                sessionStorage.removeItem('userAvatarUrl');
                setAvatarUrl(null);
            }
            setUserId(userData.id); // This is crucial for notifications
        } catch (error) {
            console.error("Medicines: Failed to fetch user profile:", error);
            setAvatarUrl(null); // Fallback
            sessionStorage.removeItem('userAvatarUrl');
        }
    }, [backendUrl]);

    const fetchMedicines = useCallback(async (brandId) => {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            setLoading(false);
            return;
        }
        try {
            const url = new URL(`${backendUrl}/api/medicines`);
            if (brandId) {
                url.searchParams.append('brand_id', brandId);
            }
            
            const response = await axios.get(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMedicines(response.data || []);
        } catch (error) {
            console.error('Medicines: Error fetching medicines:', error);
            message.error('Failed to load medicines');
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);

    const fetchBrands = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) return;
        try {
            const response = await axios.get(`${backendUrl}/api/brands`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands(response.data || []);
        } catch (error) {
            console.error('Medicines: Error fetching brands:', error);
            message.error('Failed to load brands');
        }
    }, [backendUrl]);

    const fetchCategories = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) return;
        try {
            const response = await axios.get(`${backendUrl}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error('Medicines: Error fetching categories:', error);
            message.error("Failed to fetch categories.");
        }
    }, [backendUrl]);

    const fetchSuppliers = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) return;
        try {
            const response = await axios.get(`${backendUrl}/api/suppliers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(response.data || []);
        } catch (error) {
            console.error('Medicines: Error fetching suppliers:', error);
            message.error("Failed to fetch suppliers.");
        }
    }, [backendUrl]);

    const fetchLocations = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !backendUrl) return;
        try {
            const response = await axios.get(`${backendUrl}/api/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(response.data || []);
        } catch (error) {
            console.error('Medicines: Error fetching locations:', error);
            message.error("Failed to fetch locations.");
        }
    }, [backendUrl]);
    
    // Main useEffect for initial data fetching
    useEffect(() => {
        fetchUserProfile(); // Fetch profile first to get userId
        fetchMedicines();
        fetchCategories();
        fetchSuppliers();
        fetchLocations();
        fetchBrands();
    }, [fetchUserProfile, fetchMedicines, fetchCategories, fetchSuppliers, fetchLocations, fetchBrands]);


    const fetchNotifications = useCallback(async (token) => {
        if (!userId || !token || !backendUrl) return;
        setNotificationLoading(true);
        try {
            const response = await axios.get(
                `${backendUrl}/api/notifications/user/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { include_resolved: 'false' }
                }
            );
            setNotifications(response.data || []);
        } catch (error) {
            console.error("Medicines: Failed to fetch notifications:", error);
            // message.error("Unable to load notifications."); // Can be noisy
        } finally {
            setNotificationLoading(false);
        }
    }, [userId, backendUrl]);

    const fetchNotificationCount = useCallback(async (token) => {
        if (!userId || !token || !backendUrl) return;
        try {
            const response = await axios.get(
                `${backendUrl}/api/notifications/user/${userId}/unread/count`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNotificationCount(response.data.count || 0);
        } catch (error) {
            console.error("Medicines: Failed to fetch notification count:", error);
        }
    }, [userId, backendUrl]);

    // Fetch notifications when userId is available
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (userId && token) {
            fetchNotifications(token);
            fetchNotificationCount(token);
        }
    }, [userId, fetchNotifications, fetchNotificationCount]);


    const markNotificationAsRead = async (notificationId) => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId || !backendUrl) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications(token);
            fetchNotificationCount(token);
        } catch (error) {
            console.error("Medicines: Failed to mark notification as read:", error);
            message.error("Unable to mark notification as read.");
        }
    };

    const markAllNotificationsAsRead = async () => {
        const token = sessionStorage.getItem('token');
        if (!token || !userId || !backendUrl) return;
        try {
            await axios.patch(
                `${backendUrl}/api/notifications/user/${userId}/read/all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications(token);
            fetchNotificationCount(token);
            message.success("All notifications marked as read.");
        } catch (error) {
            console.error("Medicines: Failed to mark all notifications as read:", error);
            message.error("Unable to mark all notifications as read.");
        }
    };


    const onSearch = async (value) => {
        const token = sessionStorage.getItem('token');
        if (!value) {
            fetchMedicines();
            return;
        }
        if (!token || !backendUrl) {
            message.error("Authentication token or backend URL is missing.");
            return;
        }
        setLoading(true);
        try {
            const searchResponse = await axios.get(`${backendUrl}/api/medicines/name/${value}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!searchResponse.data || searchResponse.data.length === 0) {
                message.info(`No medicines found for "${value}".`);
                setMedicines([]);
                setLoading(false);
                return;
            }

            const detailedMedicines = await Promise.all(
                searchResponse.data.map(async (medicine) => {
                    try {
                        const response = await axios.get(`${backendUrl}/api/medicines/${medicine.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        return response.data;
                    } catch (error) {
                        console.error(`Medicines: Error fetching details for medicine ${medicine.id}:`, error);
                        return medicine; 
                    }
                })
            );
            setMedicines(detailedMedicines);
            message.success(`Found ${detailedMedicines.length} result(s) for "${value}".`);
        } catch (error) {
            console.error('Medicines: Error searching medicines:', error);
            message.error(error.response?.data?.message || `Error searching for "${value}". Please try again.`);
            setMedicines([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    const showAddMedicineModal = () => {
        setIsAddModalVisible(true);
    };

    const showEditMedicineModal = (medicine) => {
        setEditingMedicine(medicine);
        setIsEditModalVisible(true);
    };

    const handleAddMedicineSuccess = () => { // Renamed from handleAddMedicine to avoid conflict if used elsewhere
        fetchMedicines(selectedBrand); // Re-fetch medicines, considering the current brand filter
        setIsAddModalVisible(false);
    };

    const handleEditMedicineSuccess = () => { // Renamed from handleEditMedicine
        fetchMedicines(selectedBrand); // Re-fetch medicines
        setIsEditModalVisible(false);
        setEditingMedicine(null);
    };

    const handleCancel = () => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
        setEditingMedicine(null);
    };

    const deleteMedicine = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token || !backendUrl) {
                message.error("Authentication token or backend URL is missing.");
                return;
            }
            await axios.delete(`${backendUrl}/api/medicines/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedicines(prevMedicines => prevMedicines.filter(medicine => medicine.id !== id));
            message.success("Medicine deleted successfully.");
        } catch (error) {
            console.error("Medicines: Failed to delete medicine:", error);
            message.error(error.response?.data?.error || "Failed to delete medicine.");
        }
    };

    const columns = [
        {
            title: 'Image', key: 'image', align: 'center', width: 90, fixed: 'left',
            render: (record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {record.imageUrl ? (
                        <img src={record.imageUrl} alt={record.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                    )}
                </div>
            )
        },
        { title: 'Name', dataIndex: 'name', key: 'name', align: 'center', width: 150, render: (text) => (<Tooltip title={text}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{text}</span></Tooltip>) },
        { title: 'Brand', dataIndex: 'brand', key: 'brand', width: 120, align: 'center', render: (brand, record) => (<Tooltip title={record.brand_manufacturer ? `${brand?.name || 'N/A'} (${record.brand_manufacturer})` : brand?.name || 'N/A'}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{brand?.name || 'N/A'}</span></Tooltip>) },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 70, align: 'center', render: (price) => (<div style={{ textAlign: 'center', paddingRight: '12px' }}>${parseFloat(price || 0).toFixed(2)}</div>) },
        { title: 'Stock', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center', render: (quantity) => (<div style={{ textAlign: 'center' }}>{quantity || 0}</div>) },
        { title: 'Status', key: 'stockStatus', width: 100, align: 'center', render: (text, record) => (<Tag color={record.quantity <= 0 ? 'gray' : record.quantity < LOW_STOCK_THRESHOLD ? 'red' : 'green'}>{record.quantity <= 0 ? 'Out of Stock' : record.quantity < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}</Tag>) },
        { title: 'Expiry', dataIndex: 'expiry_date', key: 'expiry_date', width: 100, align: 'center', render: (date) => { const d = new Date(date); return isNaN(d.getTime()) ? 'Invalid Date' : <Tag color="blue">{d.toLocaleDateString()}</Tag>; }},
        { title: 'Supplier', dataIndex: ['supplier', 'name'], key: 'supplier', width: 120, align: 'center', render: (supplierName) => (<Tooltip title={supplierName}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{supplierName || 'N/A'}</div></Tooltip>) },
        { title: 'Location', dataIndex: ['location', 'name'], key: 'location', width: 90, align: 'center', render: (locationName) => (<div style={{ textAlign: 'center' }}>{locationName || 'N/A'}</div>) },
        { title: 'Category', dataIndex: ['category', 'name'], key: 'category', width: 120, align: 'center', render: (categoryName) => (<Tooltip title={categoryName}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{categoryName || 'N/A'}</div></Tooltip>) },
        {
            title: 'Actions', key: 'actions', fixed: 'right', width: 150, align: 'center',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => showEditMedicineModal(record)} style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}>Edit</Button>
                    <Button size="small" icon={<DeleteOutlined />} danger onClick={() => deleteMedicine(record.id)} style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}>Delete</Button>
                </div>
            )
        }
    ];
    
    const notificationDropdownItems = [
        {
            key: 'notifications',
            label: (
                <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Notifications ({notificationCount})</span>
                        {notificationCount > 0 && (
                            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }} style={{ padding: 0, fontSize: '12px' }}>
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    {notificationLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="small" /></div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>No new notifications</div>
                    ) : (
                        <List
                            size="small"
                            dataSource={notifications}
                            renderItem={(notification) => (
                                <List.Item
                                    style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: notification.is_read ? '#fff' : '#f6ffed', borderBottom: '1px solid #f0f0f0' }}
                                    onClick={(e) => { e.stopPropagation(); if (!notification.is_read) markNotificationAsRead(notification.id); }}
                                >
                                    <List.Item.Meta
                                        title={<div style={{ fontSize: '13px', fontWeight: notification.is_read ? 'normal' : 'bold', marginBottom: '4px' }}>{notification.title}</div>}
                                        description={
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{notification.message}</div>
                                                <div style={{ fontSize: '11px', color: '#999' }}>{new Date(notification.created_at).toLocaleString()}</div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="medicines-container">
            { userRole === 'admin' ? <AdminSidebar/> : <PharmacistSidebar/> }
            <main className="main-content">
                <header className="header">
                    <div className='header-left'>
                        <h1>Medicines</h1>
                        <p>Dashboard / Medicines</p>
                    </div>
                    <div className='header-right' style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Dropdown
                            menu={{ items: notificationDropdownItems }}
                            trigger={['click']}
                            open={notificationDropdownOpen}
                            onOpenChange={setNotificationDropdownOpen}
                            placement="bottomRight"
                        >
                            <Badge count={notificationCount} size="small">
                                <Button type="text" icon={<BellOutlined />} size="large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }} />
                            </Badge>
                        </Dropdown>
                        <div onClick={handleAvatarClick} style={{cursor: 'pointer'}}>
                            <Avatar 
                                size={50} 
                                icon={!avatarUrl && <UserOutlined />}
                                src={avatarUrl} // Directly use state which should be full URL
                                onError={() => {
                                    setAvatarUrl(null); // Fallback if src fails
                                    sessionStorage.removeItem('userAvatarUrl'); 
                                }}
                            />
                        </div>
                    </div>
                </header>

                <div className="medicines-table">
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Button className="add-button" type="primary" icon={<PlusOutlined />} onClick={showAddMedicineModal}>Add Medicine</Button>
                            <Select
                                className="brand-filter"
                                showSearch
                                placeholder="Filter by brand"
                                optionFilterProp="children"
                                onChange={(value) => { setSelectedBrand(value); fetchMedicines(value); }}
                                onClear={() => { setSelectedBrand(undefined); fetchMedicines(); }}
                                allowClear
                                value={selectedBrand}
                                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                style={{ width: 200 }} // Added style for width
                            >
                                {brands.map(brand => (<Option key={brand.id} value={brand.id}>{brand.name}</Option>))}
                            </Select>
                            <Search className="search-bar" placeholder="Search medicines by name..." allowClear onSearch={onSearch} />
                        </div>
                    </div>
                    <div className="table-container">
                        <Table columns={columns} dataSource={medicines} loading={loading} scroll={{ x: 1500 }} size="small" rowKey="id" />
                    </div>
                </div>
                <AddMedicineForm 
                    visible={isAddModalVisible} 
                    onCreate={handleAddMedicineSuccess} // Changed to handleAddMedicineSuccess
                    onCancel={handleCancel}
                    categories={categories} 
                    suppliers={suppliers} 
                    locations={locations} 
                    brands={brands}
                />
                <EditMedicineForm 
                    visible={isEditModalVisible} 
                    onEdit={handleEditMedicineSuccess} // Changed to handleEditMedicineSuccess
                    onCancel={handleCancel}
                    medicine={editingMedicine} 
                    suppliers={suppliers} 
                    locations={locations} 
                    categories={categories} 
                    brands={brands}
                />
            </main>
        </div>
    );
};

export default Medicines;
