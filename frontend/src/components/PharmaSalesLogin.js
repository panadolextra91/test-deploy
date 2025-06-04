import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../imgs/MediMaster.png';
import { Input, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";

const PharmaSalesLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/pharma-sales-reps/login`, {
                email,
                password
            });

            const { token, salesRep } = response.data;

            // Save the token and sales rep info
            if (remember) {
                localStorage.setItem('salesRepToken', token);
                localStorage.setItem('salesRepInfo', JSON.stringify(salesRep));
                console.log('Sales rep token saved in localStorage');
            } else {
                sessionStorage.setItem('salesRepToken', token);
                sessionStorage.setItem('salesRepInfo', JSON.stringify(salesRep));
                console.log('Sales rep token saved in sessionStorage');
            }

            // Debugging logs
            console.log("Sales Rep Token:", token);
            console.log("Sales Rep Info:", salesRep);

            message.success(`Welcome back, ${salesRep.name}!`);
            
            // Navigate to import product list page
            navigate('/import-product-list');
            
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Invalid email or password";
            message.error(errorMessage);
            console.error("Sales rep login error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToMainLogin = () => {
        navigate('/');
    };

    return (
        <div className='login-container'>
            <div className='login-form'>
                <img src={logo} className='logo' alt="MediMaster Logo"/>
                
                <p>Sign in to upload your product catalog.</p>
                
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <Input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                            prefix={<UserOutlined />}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <Input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            prefix={<LockOutlined />}
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button 
                            type="button"
                            onClick={handleBackToMainLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'black',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            disabled={loading}
                        >
                            ← Back to Main Login
                        </button>
                    </div>

                    <div style={{ 
                        marginTop: '24px', 
                        padding: '16px', 
                        backgroundColor: '#f6f8fa', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <strong>New to our platform?</strong><br/>
                        <button 
                            type="button"
                            onClick={() => navigate('/pharma-sales-register')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#1890ff',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: 0,
                                marginTop: '8px'
                            }}
                            disabled={loading}
                        >
                            Create a new sales rep account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PharmaSalesLogin;
