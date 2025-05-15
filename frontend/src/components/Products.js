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
  Space,
  Tag,
  DatePicker,
  Select,
  Input,
  Search
} from "antd";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import PharmacistSidebar from "./PharmacistSidebar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import './Suppliers.css'; // reuse styles

const { MonthPicker } = DatePicker;
const { Option } = Select;

const Products = () => {
  const [purchaseOrderModalVisible, setPurchaseOrderModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
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
    const token = sessionStorage.getItem('token');
  
    const params = {};
    if (selectedSupplier) params.supplierId = selectedSupplier;
    if (selectedMonth) params.month = dayjs(selectedMonth).format('YYYY-MM');
  
    try {
      const endpoint = searchQuery
        ? `${process.env.REACT_APP_BACKEND_URL}/api/products/search`
        : `${process.env.REACT_APP_BACKEND_URL}/api/products/filter`;
  
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: searchQuery ? { q: searchQuery } : params
      });
  
      const data = res.data.map(prod => ({
        key: prod.id,
        name: prod.name,
        brand: prod.brand,
        price: prod.price,
        expiry_date: prod.expiry_date,
        supplier: prod.Supplier?.name,
        created_at: prod.created_at
      }));
  
      setProducts(data);
    } catch (err) {
      message.error("Failed to fetch products");
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
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Price ($)', dataIndex: 'price', key: 'price' },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: date => dayjs(date).format('YYYY-MM-DD')
    },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => <Tag>{dayjs(date).format('YYYY-MM-DD')}</Tag>
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

        <section className="suppliers-table">
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search product name"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onPressEnter={fetchProducts}
              allowClear
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
            <Button type="primary" onClick={fetchProducts} icon={<FilterOutlined />}>Filter</Button>
            
            <Button
              icon={<FileAddOutlined />}
              type="primary"
              style={{ borderRadius: 50 }}
              onClick={handleImportClick}
            >
              Import Product List
            </Button>
            <Button
              type="primary"
              onClick={handleMakePurchaseOrder}
              style={{ borderRadius: 50 }}
              disabled={selectedRows.length === 0}
              icon={<ShoppingCartOutlined />}
            >
              Make Purchase Order
            </Button>
          </Space>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={products}
          />
        </section>
      </main>
    </div>
  );
};

export default Products;
