import React, { useEffect, useState, useCallback } from "react";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BellOutlined, // Added BellOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  message,
  Table,
  Tag,
  Input,
  Select,
  Popconfirm, // Popconfirm was imported but not used. Removed.
  Form,
  Badge, // Added Badge
  Dropdown, // Added Dropdown
  List, // Added List
  Spin // Added Spin
} from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import { useNavigate } from "react-router-dom";
import './Medicines.css'; // reuse styles
import AddPharmaSalesRepForm from "./AddPharmaSalesRepForm";
import EditPharmaSalesRepForm from "./EditPharmaSalesRepForm";

const { Search } = Input;
const { Option } = Select;

const PharmaSalesReps = () => {
  const [salesReps, setSalesReps] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true); // General loading for initial data
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState(null);
  const [form] = Form.useForm(); // This form instance might be for modals, ensure it's used or remove if not.
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('userRole');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

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
        console.log('PharmaSalesReps: Token or backendUrl missing for profile fetch.');
        return;
    }
    try {
      const res = await axios.get(`${backendUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data;
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
      setUserId(userData.id); // Crucial for notifications
    } catch (error) {
      console.error("PharmaSalesReps: Failed to fetch user profile:", error);
      setAvatarUrl(null); // Fallback
      sessionStorage.removeItem('userAvatarUrl');
    }
  }, [backendUrl]);

  const fetchSuppliers = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token || !backendUrl) return;
    try {
      const res = await axios.get(`${backendUrl}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data || []);
    } catch (err) {
      console.error("PharmaSalesReps: Failed to fetch suppliers:", err);
      message.error("Failed to fetch suppliers");
    }
  }, [backendUrl]);

  const fetchSalesReps = useCallback(async (currentSearchQuery = searchQuery, currentSelectedSupplier = selectedSupplier) => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    if (!token || !backendUrl) {
        message.error("Authentication token or backend URL is missing.");
        setLoading(false);
        return;
    }
  
    try {
      let endpoint = `${backendUrl}/api/pharma-sales-reps`;
      let params = {};
      
      if (currentSelectedSupplier) {
        endpoint = `${backendUrl}/api/pharma-sales-reps/supplier/${currentSelectedSupplier}`;
      } else if (currentSearchQuery && currentSearchQuery.trim() !== '') {
        endpoint = `${backendUrl}/api/pharma-sales-reps/name/${encodeURIComponent(currentSearchQuery.trim())}`;
      }
      // If neither is present, the default endpoint for all reps is used.
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params // params will be empty if not searching by name via query
      });
      
      // The API for /supplier/:id returns { sales_reps: [...] }
      // The API for /name/:name returns a single rep object or 404
      // The API for / (all reps) returns an array of reps
      let repsData = [];
      if (currentSelectedSupplier && res.data && Array.isArray(res.data.sales_reps)) {
        repsData = res.data.sales_reps;
      } else if (currentSearchQuery && res.data && !Array.isArray(res.data)) { // Single result from name search
        repsData = [res.data];
      } else if (Array.isArray(res.data)) {
        repsData = res.data;
      }

      setSalesReps(repsData.map(rep => ({ ...rep, key: rep.id })));
      if (currentSearchQuery && repsData.length === 0) {
        message.info("No sales representatives found matching your search.");
      }

    } catch (err) {
      // If search by name fails (e.g., 404 for no exact match), clear results or show message
      if (currentSearchQuery && err.response && err.response.status === 404) {
        setSalesReps([]);
        message.info("No sales representative found with that exact name.");
      } else {
        message.error("Failed to fetch sales representatives");
        console.error("PharmaSalesReps: Error fetching sales reps:", err);
        setSalesReps([]);
      }
    } finally {
      setLoading(false);
    }
  }, [backendUrl, searchQuery, selectedSupplier]); // searchQuery and selectedSupplier are direct dependencies

  // Initial data fetching
  useEffect(() => {
    fetchUserProfile(); // Fetch profile first for userId
    fetchSuppliers();
  }, [fetchUserProfile, fetchSuppliers]);

  // useEffect to fetch salesReps when filters change or on initial load (after profile)
  useEffect(() => {
    // We fetch salesReps initially after profile (userId might be needed for other things)
    // And also when selectedSupplier or searchQuery changes (handled by fetchSalesReps dependencies)
    if(userId !== null){ // This condition might be optional if salesReps fetch doesn't depend on userId
        fetchSalesReps();
    }
  }, [userId, fetchSalesReps]);


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
        console.error("PharmaSalesReps: Failed to fetch notifications:", error);
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
        console.error("PharmaSalesReps: Failed to fetch notification count:", error);
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
        console.error("PharmaSalesReps: Failed to mark notification as read:", error);
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
        console.error("PharmaSalesReps: Failed to mark all notifications as read:", error);
        message.error("Unable to mark all notifications as read.");
    }
  };

  const handleSearch = () => { // Triggered by Search component's onSearch
    fetchSalesReps(searchQuery, selectedSupplier);
  };
  
  const handleSupplierChange = (value) => {
    setSelectedSupplier(value);
    setSearchQuery(''); // Clear search when changing supplier filter
    fetchSalesReps(searchQuery, value); // Fetch immediately
  };
  
  const handleClearFilters = () => { // Not directly used by a button, but good for programmatic reset
    setSelectedSupplier(null);
    setSearchQuery('');
    fetchSalesReps("", null); // Pass empty search and null supplier
  };

  const showAddModal = () => {
    form.resetFields(); // Assuming 'form' is for the Add/Edit Modals
    setIsAddModalVisible(true);
  };

  const showEditModal = (salesRep) => {
    setEditingSalesRep(salesRep);
    // Form instance for EditPharmaSalesRepForm should be managed within that component or passed to it
    // If 'form' here is for a different purpose, this might need adjustment
    // For now, assuming EditPharmaSalesRepForm handles its own form state based on 'salesRep' prop
    setIsEditModalVisible(true);
  };

  const handleAddSalesRepSuccess = () => {
    message.success("Sales representative added successfully");
    setIsAddModalVisible(false);
    fetchSalesReps(); // Refresh list
  };

  const handleEditSalesRepSuccess = () => {
    message.success("Sales representative updated successfully");
    setIsEditModalVisible(false);
    setEditingSalesRep(null);
    fetchSalesReps(); // Refresh list
  };

  const handleDeleteSalesRep = async (id) => {
    const token = sessionStorage.getItem('token');
    if (!token || !backendUrl) {
        message.error("Authentication token or backend URL is missing.");
        return;
    }
    try {
      await axios.delete(
        `${backendUrl}/api/pharma-sales-reps/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Sales representative deleted successfully");
      fetchSalesReps(); // Refresh list
    } catch (err) {
      console.error("PharmaSalesReps: Failed to delete sales rep:", err);
      message.error(err.response?.data?.error || "Failed to delete sales representative");
    }
  };

  const handleCancel = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setEditingSalesRep(null);
    // form.resetFields(); // Only if 'form' is for these modals
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', align: 'center', render: (text) => text },
    { title: 'Email', dataIndex: 'email', key: 'email', align: 'center', render: (email) => email },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', align: 'center' },
    {
      title: 'Supplier', dataIndex: 'supplier_id', key: 'supplier', align: 'center',
      render: (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier ? <Tag color="blue">{supplier.name}</Tag> : 'N/A';
      }
    },
    {
      title: 'Actions', key: 'actions', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}>Edit</Button>
          <Popconfirm title="Are you sure to delete this sales rep?" onConfirm={() => handleDeleteSalesRep(record.id)} okText="Yes" cancelText="No">
            <Button size="small" icon={<DeleteOutlined />} danger style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}>Delete</Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  const handleAvatarClick = () => navigate("/profile");

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
    <div className="medicines-container"> {/* Reused class, consider specific if needed */}
      {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>Pharmaceutical Sales Representatives</h1>
            <p>Dashboard / Supplies / Pharma Sales Reps</p>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
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

        <div className="medicines-table"> {/* Reused class */}
          <div className="table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Button className="add-button" type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                Add Sales Rep
              </Button>
              <Select
                placeholder="Filter by supplier"
                style={{ width: 200 }}
                allowClear
                onChange={handleSupplierChange}
                onClear={() => handleSupplierChange(null)} // Call with null to clear
                value={selectedSupplier}
              >
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
              <Search
                placeholder="Search by name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onSearch={handleSearch} // Trigger search on enter or click
                allowClear
                style={{ width: 250 }}
              />
              {/* Removed the explicit "Filter" button as Select/Search can trigger fetches directly */}
            </div>
          </div>
          <div className="table-container">
            <Table
              columns={columns}
              dataSource={salesReps}
              loading={loading}
              scroll={{ x: 1000 }} // Adjusted scroll based on columns
              size="small"
              rowKey="id" // Changed from key to id if id is the unique identifier
            />
          </div>
        </div>

        <AddPharmaSalesRepForm
          visible={isAddModalVisible}
          onCreate={handleAddSalesRepSuccess} // Use success handler
          onCancel={handleCancel}
          suppliers={suppliers} // Pass suppliers for the form select
        />

        <EditPharmaSalesRepForm
          visible={isEditModalVisible}
          onEdit={handleEditSalesRepSuccess} // Use success handler
          onCancel={handleCancel}
          salesRep={editingSalesRep}
          suppliers={suppliers} // Pass suppliers for the form select
        />
      </main>
    </div>
  );
};

export default PharmaSalesReps;
