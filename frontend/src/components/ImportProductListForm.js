import React, { useState } from "react";
import { Modal, Form, Upload, Button, message, Table, Card, Row, Col, Statistic, Divider, Input, Alert } from "antd";
import { UploadOutlined, WarningOutlined } from "@ant-design/icons";
import axios from "axios";

const ImportProductListForm = ({ visible, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [supplierInfoForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [csvPreview, setCsvPreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [showSupplierInfoForm, setShowSupplierInfoForm] = useState(false);
  const [supplierNameFromCsv, setSupplierNameFromCsv] = useState('');
  const [salesRepNameFromCsv, setSalesRepNameFromCsv] = useState('');

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const handleFileSelect = async (file) => {
    setFileList([file]);
    setParsing(true);
    
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const parsed = parseCSV(text);
      if (!parsed || parsed.rows.length === 0) {
        message.error("CSV file is empty or invalid");
        setCsvPreview(null);
        return;
      }

      // Extract information from the first row
      const firstRow = parsed.rows[0];
      const supplierName = firstRow.supplierName || 'Not specified';
      const salesRepName = firstRow.pharmaSalesRepName || 'Not specified';
      const totalProducts = parsed.rows.length;

      // Get first 5 rows for preview
      const previewRows = parsed.rows.slice(0, 5).map((row, index) => ({
        key: index,
        ...row
      }));

      // Create table columns from headers
      const columns = parsed.headers.map(header => ({
        title: header,
        dataIndex: header,
        key: header,
        ellipsis: true,
        width: 150
      }));

      setCsvPreview({
        supplierName,
        salesRepName,
        totalProducts,
        previewRows,
        columns,
        headers: parsed.headers
      });

    } catch (error) {
      console.error('Error parsing CSV:', error);
      message.error("Failed to parse CSV file");
      setCsvPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      const file = fileList[0];
      const realFile = file?.originFileObj || file;
      if (!realFile) return message.error("Please select a CSV file");
      
      // If supplier info form is showing, we need to validate and submit with that info
      if (showSupplierInfoForm) {
        await handleSubmitWithSupplierInfo(realFile);
      } else {
        // Try to submit without supplier info first
        await handleSubmitFile(realFile);
      }
    } catch (err) {
      setUploading(false);
      message.error("Please select a valid CSV file");
    }
  };
  
  const handleSubmitFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/products/import-external`,
        formData
      );
      
      message.success(`Imported ${res.data.imported} products!`);
      setFileList([]);
      setCsvPreview(null);
      form.resetFields();
      setUploading(false);
      setShowSupplierInfoForm(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setUploading(false);
      
      // Check if the error is due to missing supplier info
      if (err.response?.data?.error?.includes('Supplier not found')) {
        // Extract supplier and sales rep names from the response
        const supplierName = err.response.data.supplier_name_from_csv;
        const salesRepName = err.response.data.sales_rep_name_from_csv;
        
        if (supplierName && salesRepName) {
          setSupplierNameFromCsv(supplierName);
          setSalesRepNameFromCsv(salesRepName);
          setShowSupplierInfoForm(true);
          message.warning('Supplier not found. Please provide additional information.');
        } else {
          message.error("Failed to extract supplier information from CSV");
        }
      } else {
        message.error(err.response?.data?.error || "Failed to import product list");
      }
    }
  };
  
  const handleSubmitWithSupplierInfo = async (file) => {
    try {
      await supplierInfoForm.validateFields();
      const supplierValues = supplierInfoForm.getFieldsValue();
      
      const formData = new FormData();
      formData.append("file", file);
      
      // Add supplier and sales rep info to the form data
      formData.append("supplier_name", supplierNameFromCsv);
      formData.append("supplier_contact_info", supplierValues.supplier_contact_info);
      formData.append("supplier_address", supplierValues.supplier_address);
      formData.append("name", supplierValues.name);
      formData.append("email", supplierValues.email);
      formData.append("phone", supplierValues.phone);
      
      setUploading(true);
      
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/products/import-external`,
        formData
      );
      
      message.success(`Imported ${res.data.imported} products!`);
      setFileList([]);
      setCsvPreview(null);
      form.resetFields();
      supplierInfoForm.resetFields();
      setUploading(false);
      setShowSupplierInfoForm(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setUploading(false);
      message.error(err.response?.data?.error || "Failed to import product list");
    }
  };

  const handleCancel = () => {
    setFileList([]);
    setCsvPreview(null);
    form.resetFields();
    supplierInfoForm.resetFields();
    setShowSupplierInfoForm(false);
    setSupplierNameFromCsv('');
    setSalesRepNameFromCsv('');
    onCancel();
  };

  const uploadProps = {
    accept: ".csv",
    beforeUpload: (file) => {
      handleFileSelect(file);
      return false; // prevent auto-upload
    },
    onRemove: () => {
      setFileList([]);
      setCsvPreview(null);
    },
    fileList,
    maxCount: 1,
  };

  const renderSupplierInfoForm = () => {
    return (
      <div style={{ marginTop: '16px' }}>
        <Alert
          message="Supplier Information Required"
          description={`The supplier '${supplierNameFromCsv}' was not found in the database. Please provide the required information to create this supplier and sales representative.`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <Form form={supplierInfoForm} layout="vertical">
          <Card 
            title="Supplier Information" 
            size="small" 
            style={{ marginBottom: '16px' }}
            headStyle={{ background: '#f5f5f5', padding: '8px 12px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Supplier Contact Info"
                  name="supplier_contact_info"
                  rules={[{ required: true, message: 'Contact info is required' }]}
                >
                  <Input placeholder="Supplier email or phone" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Supplier Address"
                  name="supplier_address"
                  rules={[{ required: true, message: 'Address is required' }]}
                >
                  <Input placeholder="Supplier address" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card 
            title="Sales Representative Information" 
            size="small"
            headStyle={{ background: '#f5f5f5', padding: '8px 12px' }}
          >
            <div style={{ marginBottom: '8px', color: '#666' }}>
              For sales representative: {salesRepNameFromCsv}
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Your Full Name"
                  name="name"
                  rules={[{ required: true, message: 'Name is required' }]}
                >
                  <Input placeholder="Your full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Your Email"
                  name="email"
                  rules={[{ required: true, message: 'Email is required' }]}
                >
                  <Input placeholder="Your email address" />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item
                  label="Your Phone"
                  name="phone"
                  rules={[{ required: true, message: 'Phone is required' }]}
                >
                  <Input placeholder="Your phone number" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>
    );
  };

  return (
    <Modal
      title="Import Product List"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={uploading}
      okText="Import"
      destroyOnClose
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ padding: '16px' }}
    >
      {showSupplierInfoForm ? (
        renderSupplierInfoForm()
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item
            label="CSV File"
            name="csv"
            rules={[{ required: true, message: "Please select a CSV file" }]}
            style={{ marginBottom: '12px' }}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={parsing} style={{ borderRadius: '4px' }}>
                {parsing ? "Reading CSV..." : "Select CSV File"}
              </Button>
            </Upload>
          </Form.Item>

          {csvPreview && (
            <>
            <Divider style={{ margin: '12px 0', textAlign: 'center' }}>File Preview</Divider>
            
            {/* Summary Statistics */}
            <Row gutter={12} style={{ marginBottom: 12, textAlign: 'center' }}>
              <Col span={8} style={{ height: '120px' }}>
                <Card 
                  size="small" 
                  bodyStyle={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    height: '80px', 
                    overflow: 'hidden' 
                  }}
                >
                  <Statistic
                    title="Supplier Name"
                    value={csvPreview.supplierName}
                    valueStyle={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  />
                </Card>
              </Col>
              <Col span={8} style={{ height: '120px' }}>
                <Card 
                  size="small" 
                  bodyStyle={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    height: '80px', 
                    overflow: 'hidden' 
                  }}
                >
                  <Statistic
                    title="Sales Rep Name"
                    value={csvPreview.salesRepName}
                    valueStyle={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  />
                </Card>
              </Col>
              <Col span={8} style={{ height: '120px' }}>
                <Card 
                  size="small" 
                  bodyStyle={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    height: '80px', 
                    overflow: 'hidden' 
                  }}
                >
                  <Statistic
                    title="Total Products"
                    value={csvPreview.totalProducts}
                    valueStyle={{ 
                      color: '#3f8600', 
                      fontSize: '14px', 
                      fontWeight: 'bold'
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Data Preview Table */}
            <Card 
              title="First 5 Rows Preview" 
              size="small"
              headStyle={{ padding: '8px 12px', fontSize: '14px', textAlign: 'center' }}
              bodyStyle={{ padding: '8px', overflowX: 'auto' }}
            >
              <Table
                columns={csvPreview.columns.map(col => ({
                  ...col,
                  width: 150,
                  ellipsis: true,
                  align: 'center'
                }))}
                dataSource={csvPreview.previewRows}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                style={{ marginTop: 4 }}
                bordered
              />
              {csvPreview.totalProducts > 5 && (
                <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: '12px' }}>
                  ... and {csvPreview.totalProducts - 5} more rows
                </div>
              )}
            </Card>
            </>
          )}
        </Form>
      )}
    </Modal>
  );
};

export default ImportProductListForm;
