import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../imgs/MediMaster.png';
import { Input, AutoComplete, message } from "antd";
import { LockOutlined, UserOutlined, MailOutlined, PhoneOutlined, ShopOutlined } from "@ant-design/icons";
import axios from "axios";

const PharmaSalesRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        supplier_name: '',
        supplier_contact: '',
        supplier_address: ''
    });
    const [suppliers, setSuppliers] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const navigate = useNavigate();

    // Fetch suppliers on component mount
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            // Use public endpoint for suppliers
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/suppliers/public`);
            setSuppliers(response.data);
            // Convert to autocomplete options
            const options = response.data.map(supplier => ({
                value: supplier.name,
                label: supplier.name,
                supplier: supplier
            }));
            setSupplierOptions(options);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            // If suppliers can't be fetched, show a message but don't block registration
            message.warning('Unable to load existing suppliers. You can still enter a new supplier name.');
            setSuppliers([]);
            setSupplierOptions([]);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSupplierSearch = (searchText) => {
        handleInputChange('supplier_name', searchText);
        
        if (!searchText) {
            setSupplierOptions(suppliers.map(supplier => ({
                value: supplier.name,
                label: supplier.name,
                supplier: supplier
            })));
            return;
        }

        // Filter suppliers based on search text
        const filteredOptions = suppliers
            .filter(supplier => 
                supplier.name.toLowerCase().includes(searchText.toLowerCase())
            )
            .map(supplier => ({
                value: supplier.name,
                label: supplier.name,
                supplier: supplier
            }));

        // Add option to create new supplier if no exact match
        const exactMatch = suppliers.find(s => 
            s.name.toLowerCase() === searchText.toLowerCase()
        );
        
        if (!exactMatch && searchText.trim()) {
            filteredOptions.push({
                value: searchText,
                label: `Create new supplier: "${searchText}"`,
                isNew: true
            });
        }

        setSupplierOptions(filteredOptions);
    };

    const handleSupplierSelect = (value, option) => {
        handleInputChange('supplier_name', value);
        
        if (option.supplier) {
            // Existing supplier selected, populate additional fields
            handleInputChange('supplier_contact', option.supplier.contact_info || '');
            handleInputChange('supplier_address', option.supplier.address || '');
        } else {
            // New supplier, clear additional fields
            handleInputChange('supplier_contact', '');
            handleInputChange('supplier_address', '');
        }
    };

    const validateForm = () => {
        const { name, email, password, confirmPassword, supplier_name } = formData;

        if (!name.trim()) {
            message.error('Name is required');
            return false;
        }

        if (!email.trim()) {
            message.error('Email is required');
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            message.error('Please enter a valid email address');
            return false;
        }

        if (!password) {
            message.error('Password is required');
            return false;
        }

        if (password !== confirmPassword) {
            message.error('Passwords do not match');
            return false;
        }

        if (!supplier_name.trim()) {
            message.error('Supplier name is required');
            return false;
        }

        return true;
    };

    const findOrCreateSupplier = async (supplierData) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/suppliers/find-or-create`,
                supplierData
            );
            return response.data.supplier;
        } catch (error) {
            console.error('Error finding or creating supplier:', error);
            throw new Error('Failed to process supplier information');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // First, find or create the supplier
            const supplierData = {
                name: formData.supplier_name.trim(),
                contact_info: formData.supplier_contact.trim() || null,
                address: formData.supplier_address.trim() || null
            };

            const supplier = await findOrCreateSupplier(supplierData);

            // Then register the sales rep with the supplier ID
            const registrationData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                supplier_id: supplier.id
            };
            
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/register`,
                registrationData
            );

            message.success('Registration successful! You can now login with your credentials.');
            
            // Navigate to login page
            navigate('/pharma-sales-login');
            
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || "Registration failed. Please try again.";
            message.error(errorMessage);
            console.error("Registration error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/pharma-sales-login');
    };

    const handleBackToMainLogin = () => {
        navigate('/');
    };

    return (
        <div className='login-container' style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '10px 0'
        }}>
            <div className='login-form' style={{ 
                maxWidth: '800px', 
                width: '90%',
                maxHeight: '95vh',
                overflowY: 'auto',
                padding: '30px',
                boxSizing: 'border-box'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <img src={logo} className='logo' alt="MediMaster Logo" style={{ 
                        maxHeight: '100px',
                        width: 'auto'
                    }}/>
                    <p style={{ margin: '10px 0', fontSize: '14px' }}>
                        Create your sales representative account to upload product catalogs.
                    </p>
                </div>
                
                <form onSubmit={handleRegister}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="name" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Full Name</label>
                            <Input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter your full name"
                                required
                                prefix={<UserOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="email" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Email Address</label>
                            <Input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter your email address"
                                required
                                prefix={<MailOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="phone" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Phone Number (Optional)</label>
                            <Input
                                type="tel"
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Enter your phone number"
                                prefix={<PhoneOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="password" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Password</label>
                            <Input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="Enter your password"
                                required
                                prefix={<LockOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="confirmPassword" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Confirm Password</label>
                            <Input
                                type="password"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                placeholder="Confirm your password"
                                required
                                prefix={<LockOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '0' }}>
                            <label htmlFor="supplier_contact" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Supplier Contact (Optional)</label>
                            <Input
                                type="text"
                                id="supplier_contact"
                                value={formData.supplier_contact}
                                onChange={(e) => handleInputChange('supplier_contact', e.target.value)}
                                placeholder="Enter supplier contact information"
                                prefix={<MailOutlined />}
                                disabled={loading}
                                size="middle"
                            />
                        </div>
                    </div>

                    {/* Full width fields */}
                    <div className="input-group" style={{ marginBottom: '12px' }}>
                        <label htmlFor="supplier" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Supplier Company Name</label>
                        <AutoComplete
                            id="supplier"
                            value={formData.supplier_name}
                            options={supplierOptions}
                            onSearch={handleSupplierSearch}
                            onSelect={handleSupplierSelect}
                            placeholder="Enter or select supplier company name"
                            style={{ width: '100%' }}
                            disabled={loading}
                            filterOption={false}
                            size="middle"
                        />
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '2px', marginBottom: '0' }}>
                            Start typing to search existing suppliers or enter a new company name
                        </p>
                    </div>

                    <div className="input-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="supplier_address" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Supplier Address (Optional)</label>
                        <Input
                            type="text"
                            id="supplier_address"
                            value={formData.supplier_address}
                            onChange={(e) => handleInputChange('supplier_address', e.target.value)}
                            placeholder="Enter supplier address"
                            disabled={loading}
                            size="middle"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                        style={{ marginBottom: '12px' }}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                        <button 
                            type="button"
                            onClick={handleBackToLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'black',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '13px',
                                marginRight: '16px'
                            }}
                            disabled={loading}
                        >
                            Already have an account? Sign In
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleBackToMainLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'black',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                            disabled={loading}
                        >
                            ← Back to Main Login
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default PharmaSalesRegister;
