import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Alert, Collapse } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import './ImportProductList.css';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImportProductList = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_contact_info: '',
    supplier_address: '',
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [csvData, setCsvData] = useState({ pharmaSalesRepName: '', supplierName: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        if (lines.length < 2) {
          reject(new Error('CSV file is empty or contains only headers'));
          return;
        }

        const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
        const requiredColumns = ['pharmasalesrepname', 'suppliername'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        const firstDataRow = lines[1].split(',').map(cell => cell.trim());
        const pharmaSalesRepNameIndex = headers.indexOf('pharmasalesrepname');
        const supplierNameIndex = headers.indexOf('suppliername');
        resolve({
          pharmaSalesRepName: firstDataRow[pharmaSalesRepNameIndex] || '',
          supplierName: firstDataRow[supplierNameIndex] || ''
        });
      };
      reader.onerror = () => reject(new Error('Error reading the file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      setCsvLoading(true);
      setError('');
      setSuccess('');
      
      // Parse CSV to get pharmaSalesRepName and supplierName
      const { pharmaSalesRepName, supplierName } = await parseCSV(selectedFile);
      
      // Set CSV data
      setCsvData({ pharmaSalesRepName, supplierName });
      
      // Pre-populate form fields with CSV data
      setFormData(prev => ({
        ...prev,
        supplier_name: supplierName,
        name: pharmaSalesRepName
      }));
      
      setFile(selectedFile);
      
      // Try to import immediately to check if supplier/rep exist
      await attemptImport(selectedFile);
      
    } catch (err) {
      setError(err.message || 'Error processing CSV file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setCsvLoading(false);
    }
  };

  const attemptImport = async (file) => {
    try {
      // Attempt to import without additional fields
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/products/import-external`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Success - supplier and sales rep already exist
      setSuccess(response.data.message || 'Products imported successfully!');
      setShowAdditionalFields(false);
      
      // Reset form
      setFile(null);
      setFormData({
        supplier_name: '',
        supplier_contact_info: '',
        supplier_address: '',
        name: '',
        email: '',
        phone: ''
      });
      setCsvData({ pharmaSalesRepName: '', supplierName: '' });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.required_fields) {
        // Backend is asking for additional information
        setShowAdditionalFields(true);
        
        // Pre-populate with CSV data from backend response if available
        if (errorData.supplier_name_from_csv) {
          setFormData(prev => ({
            ...prev,
            supplier_name: errorData.supplier_name_from_csv
          }));
        }
        if (errorData.sales_rep_name_from_csv) {
          setFormData(prev => ({
            ...prev,
            name: errorData.sales_rep_name_from_csv
          }));
        }
        
        // Don't show error message here, just show the form
        setError('');
      } else {
        // Other errors
        setError(errorData?.error || 'Failed to import products');
        setShowAdditionalFields(false);
        
        // Reset file on error
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Only validate if additional fields are shown
    if (!showAdditionalFields) {
      return true;
    }
    
    const requiredFields = ['supplier_name', 'supplier_contact_info', 'supplier_address', 'name', 'email', 'phone'];
    
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        errors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate that supplier_name matches CSV data
    if (formData.supplier_name.trim() && csvData.supplierName && 
        formData.supplier_name.trim() !== csvData.supplierName) {
      errors.supplier_name = `Must match CSV: "${csvData.supplierName}"`;
    }

    // Validate that name matches CSV data
    if (formData.name.trim() && csvData.pharmaSalesRepName && 
        formData.name.trim() !== csvData.pharmaSalesRepName) {
      errors.name = `Must match CSV: "${csvData.pharmaSalesRepName}"`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    
    // Append all additional fields
    Object.keys(formData).forEach(key => {
      if (formData[key].trim()) {
        formDataToSend.append(key, formData[key].trim());
      }
    });

    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/products/import-external`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message || 'Products imported successfully!');
      setShowAdditionalFields(false);
      
      // Reset form
      setFile(null);
      setFormData({
        supplier_name: '',
        supplier_contact_info: '',
        supplier_address: '',
        name: '',
        email: '',
        phone: ''
      });
      setCsvData({ pharmaSalesRepName: '', supplierName: '' });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.error) {
        setError(errorData.error);
      } else {
        setError('Failed to import products. Please try again.');
      }
      
      // Handle validation errors from server
      if (errorData?.required_fields) {
        const serverErrors = {};
        Object.keys(errorData.required_fields).forEach(field => {
          serverErrors[field] = `Please provide ${errorData.required_fields[field]}`;
        });
        setValidationErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="paper">
          <h1 className="typography-h4">Import Product List</h1>
          <p className="typography-subtitle1">Upload your product list in CSV format to market your products</p>

          <hr className="divider" />

          {error && (
            <Alert className="alert alert-error">{error}</Alert>
          )}
          {success && (
            <Alert className="alert alert-success">{success}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <h2 className="typography-h6">Upload CSV File</h2>
            <div>
              <Button
                className="upload-button"
                component="label"
                startIcon={csvLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={csvLoading}
                sx={{ textTransform: 'none' }}
              >
                {file ? file.name : 'Choose CSV File'}
                <VisuallyHiddenInput 
                  ref={fileInputRef}
                  id="csv-upload"
                  type="file" 
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                  disabled={csvLoading}
                />
              </Button>
              <p className="typography-caption">CSV should include columns: pharmaSalesRepName, supplierName, brand, name, price, expiry_date</p>
            </div>

            {csvData.supplierName && csvData.pharmaSalesRepName && (
              <Alert className="alert alert-info" style={{ marginTop: '16px' }}>
                <strong>CSV Data Detected:</strong><br/>
                Supplier: <strong>{csvData.supplierName}</strong><br/>
                Sales Rep: <strong>{csvData.pharmaSalesRepName}</strong>
              </Alert>
            )}

            <Collapse in={showAdditionalFields}>
              <div style={{ marginTop: '24px', padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 className="typography-h6">Additional Information Required</h2>
                <p className="typography-body2">The supplier and/or sales rep were not found in our system. Please provide the following details to create them.</p>
                
                <h3 className="typography-subtitle2">Supplier Information</h3>
                <div className="grid-container grid-item-2">
                  <div className="input-group">
                    <label htmlFor="supplier_name">Supplier Company Name</label>
                    <input
                      required
                      id="supplier_name"
                      name="supplier_name"
                      value={formData.supplier_name}
                      onChange={handleInputChange}
                      placeholder="Supplier Company Name"
                    />
                    {validationErrors.supplier_name && <span className="error-text">{validationErrors.supplier_name}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="supplier_contact_info">Supplier Contact Email</label>
                    <input
                      required
                      id="supplier_contact_info"
                      name="supplier_contact_info"
                      type="email"
                      value={formData.supplier_contact_info}
                      onChange={handleInputChange}
                      placeholder="Supplier Contact Email"
                    />
                    {validationErrors.supplier_contact_info && <span className="error-text">{validationErrors.supplier_contact_info}</span>}
                  </div>
                  <div className="input-group full-width">
                    <label htmlFor="supplier_address">Supplier Address</label>
                    <textarea
                      required
                      id="supplier_address"
                      name="supplier_address"
                      value={formData.supplier_address}
                      onChange={handleInputChange}
                      placeholder="Supplier Address"
                    />
                    {validationErrors.supplier_address && <span className="error-text">{validationErrors.supplier_address}</span>}
                  </div>
                </div>

                <h3 className="typography-subtitle2">Your Information</h3>
                <div className="grid-container grid-item-3">
                  <div className="input-group">
                    <label htmlFor="name">Your Full Name</label>
                    <input
                      required
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Full Name"
                    />
                    {validationErrors.name && <span className="error-text">{validationErrors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Your Email</label>
                    <input
                      required
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your Email"
                    />
                    {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="phone">Your Phone Number</label>
                    <input
                      required
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Your Phone Number"
                    />
                    {validationErrors.phone && <span className="error-text">{validationErrors.phone}</span>}
                  </div>
                </div>
              </div>
            </Collapse>

            {showAdditionalFields && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <Button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !file}
                  sx={{ textTransform: 'none' }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} style={{ marginRight: '8px' }} />
                      Uploading...
                    </>
                  ) : (
                    'Complete Import'
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportProductList;