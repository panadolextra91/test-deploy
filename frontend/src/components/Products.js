import React, { useEffect, useState } from "react";
import ImportProductListForm from "./ImportProductListForm";
import MakePurchaseOrder from "./MakePurchaseOrder";
import {
  FileAddOutlined,
  UserOutlined,
  FilterOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  message,
  Table,
  Tag,
  DatePicker,
  Select,
  Input
} from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import './Suppliers.css'; // reuse styles

const { MonthPicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const Products = () => {
  const [purchaseOrderModalVisible, setPurchaseOrderModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
    return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
  });

  const userRole = sessionStorage.getItem('userRole');

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchUserProfile(); // Always fetch avatar on mount
  }, []);

  const fetchUserProfile = async () => {
    const token = sessionStorage.getItem('token');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.avatarUrl) {
        sessionStorage.setItem('userAvatarUrl', res.data.avatarUrl);
        setAvatarUrl(res.data.avatarUrl);
      }
    } catch {
      setAvatarUrl(null);
      sessionStorage.removeItem('userAvatarUrl');
    }
  };

  const fetchSuppliers = async () => {
    const token = sessionStorage.getItem('token');
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (err) {
      message.error("Failed to fetch suppliers");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
  
    try {
      let endpoint;
      let params = {};
      
      // Determine which endpoint to use based on the search/filter criteria
      if (searchQuery) {
        // Search by product name
        endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/products/search`;
        params = { q: searchQuery };
      } else if (selectedSupplier || selectedMonth) {
        // Filter by supplier ID and/or month
        endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/products/filter`;
        if (selectedSupplier) params.supplierId = selectedSupplier;
        if (selectedMonth) params.month = dayjs(selectedMonth).format('YYYY-MM');
      } else {
        // No filters, get all products
        endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/products`;
      }
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
  
      // Log the structure of the first product to see what's available
      if (res.data && res.data.length > 0) {
        console.log('Product data structure:', JSON.stringify(res.data[0], null, 2));
      }
      
      // When using the filter endpoint, we need to fetch additional sales rep data
      // since that endpoint doesn't include it
      if ((selectedSupplier || selectedMonth) && !searchQuery) {
        // Get the product IDs from the filtered results
        const productIds = res.data.map(prod => prod.id);
        
        // If we have products, fetch the complete data for each one
        if (productIds.length > 0) {
          try {
            // Fetch complete product data including sales rep info
            const detailedRes = await Promise.all(
              productIds.map(id => 
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              )
            );
            
            // Map the detailed data
            const data = detailedRes.map(response => {
              const prod = response.data;
              return {
                key: prod.id,
                name: prod.name,
                brand: prod.brand,
                price: prod.price,
                expiry_date: prod.expiry_date,
                supplier: prod.supplier?.name,
                supplier_id: prod.supplier_id,
                sales_rep: prod.salesRep?.name || 'N/A',
                sales_rep_email: prod.salesRep?.email,
                created_at: prod.createdAt || prod.created_at
              };
            });
            
            setProducts(data);
            return; // Exit early since we've set the products
          } catch (error) {
            console.error('Error fetching detailed product data:', error);
            // Continue with original data if detailed fetch fails
          }
        }
      }
      
      // Standard data mapping for non-filtered results or if detailed fetch failed
      const data = res.data.map(prod => {
        return {
          key: prod.id,
          name: prod.name,
          brand: prod.brand,
          price: prod.price,
          expiry_date: prod.expiry_date,
          supplier: prod.supplier?.name,
          supplier_id: prod.supplier_id,
          sales_rep: prod.salesRep?.name || 'N/A',
          sales_rep_email: prod.salesRep?.email,
          created_at: prod.createdAt || prod.created_at
        };
      });
  
      setProducts(data);
    } catch (err) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };
  

  const handleImportClick = () => {
    setImportModalVisible(true);
  };

  const handleImportSuccess = () => {
    setImportModalVisible(false);
    fetchProducts();
  };

  const handleImportCancel = () => {
    setImportModalVisible(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', align: 'center' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand', align: 'center' },
    { title: 'Price ($)', dataIndex: 'price', key: 'price', align: 'center', render: price => parseFloat(price).toFixed(2) },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      align: 'center',
      render: date => <Tag color="blue">{dayjs(date).format('YYYY-MM-DD')}</Tag>
    },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', align: 'center' },
    { 
      title: 'Sales Rep', 
      dataIndex: 'sales_rep', 
      key: 'sales_rep', 
      align: 'center',
      render: rep => rep || 'N/A'
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center',
      render: date => <Tag color="blue">{dayjs(date).format('YYYY-MM-DD')}</Tag>
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    }
  };

  const handleMakePurchaseOrder = () => {
    setPurchaseOrderModalVisible(true);
  };

  // Function removed to fix lint warning

  return (
    <div className="suppliers-container">
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
          onCancel={() => setPurchaseOrderModalVisible(false)}
        />
        <header className="header">
          <div className="header-left">
            <h1>Products</h1>
            <p>Dashboard / Supplies / Product List</p>
          </div>
          <div className="header-right">
            <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <Avatar
                size={50}
                icon={!avatarUrl && <UserOutlined />}
                src={avatarUrl}
                onError={() => {
                  setAvatarUrl(null);
                  sessionStorage.removeItem('userAvatarUrl');
                }}
              />
            </div>
          </div>
        </header>

        <div className="suppliers-table">
          <div className="table-header" style={{ margin: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Search
                placeholder="Search product name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onSearch={fetchProducts}
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
                placeholder="Filter by month"
                onChange={val => setSelectedMonth(val)}
                value={selectedMonth}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  className="add-button"
                  type="primary" 
                  onClick={fetchProducts} 
                  icon={<FilterOutlined />}
                >
                  Filter
                </Button>
                <Button
                  className="add-button"
                  icon={<FileAddOutlined />}
                  type="primary"
                  onClick={handleImportClick}
                  >
                  Import Product List
                </Button>
                <Button
                  className="order-button"
                  type="primary"
                  onClick={handleMakePurchaseOrder}
                  disabled={selectedRows.length === 0}
                  icon={<ShoppingCartOutlined />}
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
