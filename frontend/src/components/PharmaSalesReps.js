import React, { useEffect, useState, useCallback } from "react";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  message,
  Table,
  Tag,
  Input,
  Select,
  Popconfirm,
  Form
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
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const savedAvatarUrl = sessionStorage.getItem('userAvatarUrl');
    return savedAvatarUrl ? `${process.env.REACT_APP_BACKEND_URL}${savedAvatarUrl}` : null;
  });

  const userRole = sessionStorage.getItem('userRole');

  const fetchSalesReps = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
  
    try {
      let endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps`;
      
      // If supplier filter is applied
      if (selectedSupplier) {
        endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/supplier/${selectedSupplier}`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSalesReps(res.data.sales_reps.map(rep => ({
          ...rep,
          key: rep.id
        })));
      } 
      // If search query is applied
      else if (searchQuery && searchQuery.trim() !== '') {
        endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/name/${searchQuery}`;
        try {
          const res = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // If searching by exact name returns a single result
          setSalesReps([{
            ...res.data,
            key: res.data.id
          }]);
        } catch (error) {
          // If exact name search fails, get all and filter client-side
          const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const filteredReps = res.data.filter(rep => 
            rep.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          setSalesReps(filteredReps.map(rep => ({
            ...rep,
            key: rep.id
          })));
          
          if (filteredReps.length === 0) {
            message.info("No sales representatives found matching your search.");
          }
        }
      } 
      // No filters, get all
      else {
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSalesReps(res.data.map(rep => ({
          ...rep,
          key: rep.id
        })));
      }
    } catch (err) {
      message.error("Failed to fetch sales representatives");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSupplier]);

  useEffect(() => {
    fetchSuppliers();
    fetchSalesReps();
    fetchUserProfile();
  }, [fetchSalesReps]);

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



  const handleSearch = () => {
    fetchSalesReps();
  };
  
  const handleSupplierChange = (value) => {
    setSelectedSupplier(value);
    setSearchQuery(''); // Clear search when changing supplier filter
  };
  
  const handleClearFilters = () => {
    setSelectedSupplier(null);
    setSearchQuery('');
    fetchSalesReps();
  };

  const showAddModal = () => {
    form.resetFields();
    setIsAddModalVisible(true);
  };

  const showEditModal = (salesRep) => {
    setEditingSalesRep(salesRep);
    form.setFieldsValue({
      name: salesRep.name,
      email: salesRep.email,
      phone: salesRep.phone,
      supplier_id: salesRep.supplier_id
    });
    setIsEditModalVisible(true);
  };

  const handleAddSalesRep = async (values) => {
    try {
      const token = sessionStorage.getItem('token');
      
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      message.success("Sales representative added successfully");
      setIsAddModalVisible(false);
      fetchSalesReps();
    } catch (err) {
      message.error("Failed to add sales representative");
    }
  };

  const handleEditSalesRep = async (values) => {
    try {
      const token = sessionStorage.getItem('token');
      
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/${editingSalesRep.id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      message.success("Sales representative updated successfully");
      setIsEditModalVisible(false);
      fetchSalesReps();
    } catch (err) {
      message.error("Failed to update sales representative");
    }
  };

  const handleDeleteSalesRep = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      message.success("Sales representative deleted successfully");
      fetchSalesReps();
    } catch (err) {
      message.error("Failed to delete sales representative");
    }
  };

  const handleCancel = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text) => text
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      render: (email) => email
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      align: 'center'
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      align: 'center',
      render: (_, record) => {
        const supplier = suppliers.find(s => s.id === record.supplier_id);
        return supplier ? (
          <Tag color="blue">{supplier.name}</Tag>
        ) : 'N/A';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
          >
            Edit
          </Button> 
            
            <Button 
              size="small" 
              icon={<DeleteOutlined />} 
              danger 
              style={{ minWidth: '80px', minHeight: '32px', borderRadius: '50px' }}
              onClick={() => handleDeleteSalesRep(record.id)}
            >
              Delete
            </Button>
    
        </div>
      )
    }
  ];

  return (
    <div className="medicines-container">
      {userRole === 'admin' ? <AdminSidebar /> : <PharmacistSidebar />}

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>Pharmaceutical Sales Representatives</h1>
            <p>Dashboard / Supplies / Pharma Sales Reps</p>
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

        <div className="medicines-table">
          <div className="table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                className="add-button"
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
              >
                Add Sales Rep
              </Button>
              <Select
                className="brand-filter"
                placeholder="Filter by supplier"
                allowClear
                onChange={handleSupplierChange}
                onClear={() => handleSupplierChange(null)}
                value={selectedSupplier}
              >
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
              <Search
                className="search-bar"
                placeholder="Search by name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                allowClear
                onClear={() => setSearchQuery('')}
              />
            </div>
          </div>
          <div className="table-container">
            <Table
              columns={columns}
              dataSource={salesReps}
              loading={loading}
              scroll={{ x: 1200 }}
              size="small"
              rowKey="id"
            />
          </div>
        </div>

        <AddPharmaSalesRepForm
          visible={isAddModalVisible}
          onCreate={handleAddSalesRep}
          onCancel={handleCancel}
        />

        <EditPharmaSalesRepForm
          visible={isEditModalVisible}
          onEdit={handleEditSalesRep}
          onCancel={handleCancel}
          salesRep={editingSalesRep}
        />
      </main>
    </div>
  );
};

export default PharmaSalesReps;