import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [salesRepInfo, setSalesRepInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = sessionStorage.getItem('salesRepToken') || localStorage.getItem('salesRepToken');
    const salesRepData = sessionStorage.getItem('salesRepInfo') || localStorage.getItem('salesRepInfo');
    
    if (token && salesRepData) {
      try {
        const parsedSalesRep = JSON.parse(salesRepData);
        setSalesRepInfo(parsedSalesRep);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing sales rep info:', err);
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    sessionStorage.removeItem('salesRepToken');
    sessionStorage.removeItem('salesRepInfo');
    localStorage.removeItem('salesRepToken');
    localStorage.removeItem('salesRepInfo');
    
    // Redirect to login
    navigate('/pharma-sales-login');
  };

  const handleLoginRedirect = () => {
    navigate('/pharma-sales-login');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const validateCSV = (file) => {
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
        const requiredColumns = ['brand', 'name', 'price', 'expiry_date'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        resolve(true);
      };
      reader.onerror = () => reject(new Error('Error reading the file'));
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login first to upload products');
      return;
    }

    try {
      setLoading(true);
      
      // Validate CSV format
      await validateCSV(file);

      const formData = new FormData();
      formData.append('file', file);

      const token = sessionStorage.getItem('salesRepToken') || localStorage.getItem('salesRepToken');

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/products/import-external`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      setSuccess(response.data.message || 'Products imported successfully!');
      
      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      if (errorData?.error) {
        setError(errorData.error);
      } else {
        setError(err.message || 'Failed to import products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="container">
          <div className="paper">
            <h1 className="typography-h4">Import Product List</h1>
            <p className="typography-subtitle1">Please login to upload your product catalog</p>

            <hr className="divider" />

            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Alert className="alert alert-info" style={{ marginBottom: '24px' }}>
                <strong>Authentication Required</strong><br/>
                You need to login as a pharma sales representative to upload product lists.
              </Alert>
              
              <Button
                variant="contained"
                onClick={handleLoginRedirect}
                sx={{ textTransform: 'none', marginRight: '16px' }}
              >
                Login as Sales Rep
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{ textTransform: 'none' }}
              >
                Back to Main Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        <div className="paper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h1 className="typography-h4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CloudUploadIcon style={{ fontSize: '32px', color: 'black' }} />
                Import Product List
              </h1>
              <p className="typography-subtitle1">Upload your product catalog in CSV format</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Logged in as: <strong>{salesRepInfo?.name}</strong><br/>
                Supplier: <strong>{salesRepInfo?.supplier?.name}</strong>
              </p>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                sx={{ textTransform: 'none', marginTop: '8px' }}
              >
                Logout
              </Button>
            </div>
          </div>

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
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {file ? file.name : 'Choose CSV File'}
                <VisuallyHiddenInput 
                  ref={fileInputRef}
                  id="csv-upload"
                  type="file" 
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </Button>
              <p className="typography-caption">
                CSV should include columns: <strong>brand, name, price, expiry_date</strong><br/>
                <em>Note: No need to include your name or supplier name - this is automatically detected from your login.</em>
              </p>
            </div>

            {file && (
              <Alert className="alert alert-info" style={{ marginTop: '16px' }}>
                <strong>Ready to Import:</strong><br/>
                File: <strong>{file.name}</strong><br/>
                Will be imported for: <strong>{salesRepInfo?.name}</strong> ({salesRepInfo?.supplier?.name})
              </Alert>
            )}

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
                  'Import Products'
                )}
              </Button>
            </div>
          </form>

          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            backgroundColor: '#f6f8fa', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>CSV Format Example:</h3>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '12px', 
              borderRadius: '4px', 
              margin: 0,
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`brand,name,price,expiry_date
Panadol,Paracetamol 500mg,5.50,2024-12-31
Aspirin,Aspirin 100mg,3.25,2025-06-15
Vitamin C,Vitamin C 1000mg,12.00,2025-03-20`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProductList;