import React, { useEffect, useState, useCallback } from "react";
import ImportProductListForm from "./ImportProductListForm";
import MakePurchaseOrder from "./MakePurchaseOrder";
import {
  FileAddOutlined,
  UserOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  BellOutlined, // Added BellOutlined
  EditOutlined, // Added for consistency if actions are added later
  DeleteOutlined // Added for consistency if actions are added later
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  message,
  Table,
  Tag,
  DatePicker,
  Select,
  Input,
  Tooltip,
  Badge, // Added Badge
  Dropdown, // Added Dropdown
  List, // Added List
  Spin // Added Spin
} from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import './Suppliers.css'; // Assuming this contains relevant styles, consider renaming if too specific

const { MonthPicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const Products = () => {
  const [purchaseOrderModalVisible, setPurchaseOrderModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [loading, setLoading] = useState(true); // General loading for initial data
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
        console.log('Products: Token or backendUrl missing for profile fetch.');
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
      console.error("Products: Failed to fetch user profile:", error);
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
      console.error("Products: Failed to fetch suppliers:", err);
      message.error("Failed to fetch suppliers");
    }
  }, [backendUrl]);

  const fetchProducts = useCallback(async (searchVal = searchQuery, supplierId = selectedSupplier, month = selectedMonth) => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    if (!token || !backendUrl) {
        message.error("Authentication token or backend URL is missing.");
        setLoading(false);
        return;
    }
  
    try {
      let endpoint;
      let params = {};
      
      if (searchVal) {
        endpoint = `${backendUrl}/api/products/search`;
        params = { q: searchVal };
      } else if (supplierId || month) {
        endpoint = `${backendUrl}/api/products/filter`;
        if (supplierId) params.supplierId = supplierId;
        if (month) params.month = dayjs(month).format('YYYY-MM');
      } else {
        endpoint = `${backendUrl}/api/products`;
      }
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      const mapProductData = (prod) => ({
        key: prod.id,
        name: prod.name,
        brand: prod.brand, // This might be just a name string, or an object { id, name }
        price: prod.price,
        expiry_date: prod.expiry_date,
        supplier: prod.supplier?.name, // Access nested property safely
        supplier_id: prod.supplier_id,
        sales_rep: prod.salesRep?.name || 'N/A', // Access nested property safely
        sales_rep_email: prod.salesRep?.email,
        created_at: prod.createdAt || prod.created_at,
        // Ensure all fields needed by columns are mapped
        brand_manufacturer: prod.brand?.manufacturer, // Assuming brand might be an object
        imageUrl: prod.imageUrl, // Assuming product has imageUrl
        quantity: prod.quantity, // Assuming product has quantity for stock status
      });

      // If filtering, the response might be simpler, so fetch details
      if ((supplierId || month) && !searchVal && res.data && res.data.length > 0) {
        const productIds = res.data.map(p => p.id);
        if (productIds.length > 0) {
          try {
            const detailedRes = await Promise.all(
              productIds.map(id => 
                axios.get(`${backendUrl}/api/products/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              )
            );
            setProducts(detailedRes.map(response => mapProductData(response.data)));
          } catch (error) {
            console.error('Products: Error fetching detailed product data after filter:', error);
            setProducts(res.data.map(mapProductData)); // Fallback to initial filtered data
          }
        } else {
            setProducts([]);
        }
      } else {
        setProducts((res.data || []).map(mapProductData));
      }
    } catch (err) {
      console.error("Products: Failed to fetch products:", err);
      message.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, searchQuery, selectedSupplier, selectedMonth]); // Added dependencies

  // Initial data fetching
  useEffect(() => {
    fetchUserProfile(); // Fetch profile first for userId
    fetchSuppliers();
    // fetchProducts will be called by its own useEffect or by filter/search actions
  }, [fetchUserProfile, fetchSuppliers]);

  // useEffect to fetch products when filters change or on initial load (after profile)
  useEffect(() => {
    if(userId !== null){ // Ensure userId is fetched before fetching products if needed by backend, or remove if not
        fetchProducts();
    }
  }, [userId, fetchProducts]); // Re-fetch products if userId changes (if relevant) or when fetchProducts itself changes (due to filter/search changes)


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
        console.error("Products: Failed to fetch notifications:", error);
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
        console.error("Products: Failed to fetch notification count:", error);
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
        console.error("Products: Failed to mark notification as read:", error);
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
        console.error("Products: Failed to mark all notifications as read:", error);
        message.error("Unable to mark all notifications as read.");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) { // If search is cleared, fetch all
        fetchProducts("", selectedSupplier, selectedMonth);
    }
  };
  
  const handleApplyFilters = () => {
    fetchProducts(searchQuery, selectedSupplier, selectedMonth);
  };


  const handleImportClick = () => {
    setImportModalVisible(true);
  };

  const handleImportSuccess = () => {
    setImportModalVisible(false);
    fetchProducts(); // Refresh product list
  };

  const handleImportCancel = () => {
    setImportModalVisible(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', align: 'center', width: 150, render: (text) => (<Tooltip title={text}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{text}</span></Tooltip>), },
    { title: 'Brand', dataIndex: 'brand', key: 'brand', width: 120, align: 'center', render: (brand, record) => (<Tooltip title={record.brand_manufacturer ? `${brand || 'N/A'} (${record.brand_manufacturer})` : (brand || 'N/A')}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{brand || 'N/A'}</span></Tooltip>),},
    { title: 'Price ($)', dataIndex: 'price', key: 'price', align: 'center', width: 80, render: price => parseFloat(price || 0).toFixed(2) },
    { title: 'Expiry Date', dataIndex: 'expiry_date', key: 'expiry_date', align: 'center', width: 100, render: date => date ? <Tag color="blue">{dayjs(date).format('YYYY-MM-DD')}</Tag> : 'N/A' },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', align: 'center', width: 120 },
    { title: 'Sales Rep', dataIndex: 'sales_rep', key: 'sales_rep', align: 'center', width: 120, render: rep => rep || 'N/A' },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', align: 'center', width: 100, render: date => date ? <Tag color="geekblue">{dayjs(date).format('YYYY-MM-DD')}</Tag> : 'N/A'},
    // Add actions column if needed for edit/delete of individual products
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    }
  };

  const handleMakePurchaseOrder = () => {
    if (selectedRows.length === 0) {
        message.warning("Please select products to include in the purchase order.");
        return;
    }
    setPurchaseOrderModalVisible(true);
  };
  
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
    <div className="suppliers-container"> {/* Consider renaming className to "products-container" */}
      {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}

      <main className="main-content">
        <ImportProductListForm
          visible={importModalVisible}
          onSuccess={handleImportSuccess}
          onCancel={handleImportCancel}
        />
        <MakePurchaseOrder
          visible={purchaseOrderModalVisible}
          products={selectedRows}
          onCancel={() => {
            setPurchaseOrderModalVisible(false);
            setSelectedRowKeys([]); // Clear selection after closing PO modal
            setSelectedRows([]);
          }}
          onOrderCreated={() => { // Callback to refresh products after order
            setPurchaseOrderModalVisible(false);
            setSelectedRowKeys([]);
            setSelectedRows([]);
            fetchProducts(); // Refresh product list
          }}
        />
        <header className="header">
          <div className="header-left">
            <h1>Products</h1>
            <p>Dashboard / Supplies / Product List</p>
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

        <div className="suppliers-table"> {/* Consider renaming className */}
          <div className="table-header" style={{ margin: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Search
                placeholder="Search product name"
                value={searchQuery}
                onChange={handleSearchChange} // Use controlled input
                onSearch={() => fetchProducts(searchQuery, selectedSupplier, selectedMonth)} // Trigger fetch on search button
                allowClear
                style={{ width: 250 }}
              />
              <Select
                placeholder="Filter by supplier"
                style={{ width: 180 }}
                allowClear
                onChange={value => setSelectedSupplier(value)}
                value={selectedSupplier}
              >
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
              <MonthPicker
                placeholder="Filter by month created"
                onChange={val => setSelectedMonth(val)}
                value={selectedMonth}
                style={{ width: 180 }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  type="primary" 
                  style={{ borderRadius: 50, minHeight: '40px' }}
                  onClick={handleApplyFilters} // Use specific handler for filter button
                  icon={<FilterOutlined />}
                >
                  Apply Filters
                </Button>
                <Button
                  icon={<FileAddOutlined />}
                  type="primary"
                  onClick={handleImportClick}
                  style={{ borderRadius: 50, minHeight: '40px' }}
                  >
                  Import Product List
                </Button>
                <Button
                  type="primary"
                  onClick={handleMakePurchaseOrder}
                  disabled={selectedRows.length === 0}
                  icon={<ShoppingCartOutlined />}
                  style={{ borderRadius: 50, minHeight: '40px' }}
                >
                  Bulk Order
                </Button>
              </div>
            </div>
          </div>
          <div className="table-container">
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={products}
              loading={loading}
              scroll={{ x: 1200 }}
              size="small"
              rowKey="key"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products;
