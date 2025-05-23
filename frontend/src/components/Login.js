import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../imgs/MediMaster.png';
import { Input, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/login`, {
                username,
                password
            });

            const { token } = response.data;

            // Save the token
            if (remember) {
                localStorage.setItem('token', token);
                console.log('Token saved in local:', localStorage.setItem('token'));
            } else {
                sessionStorage.setItem('token', token);
                console.log('Token saved in sessionStorage:', sessionStorage.getItem('token'));
            }

            // Fetch user profile to check role
            const profileResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const role = profileResponse.data.role;

            // Save the role
            if (remember) {
                localStorage.setItem('userRole', role);
                console.log('Role saved in localStorage:', localStorage.getItem('userRole'));
            } else {
                sessionStorage.setItem('userRole', role);
                console.log('Role saved in sessionStorage:', sessionStorage.getItem('userRole'));
            }

            // Debugging logs
            console.log("Token:", token);
            console.log("Role:", role);

            // Navigate based on role
            if (role === 'pharmacist') {
                navigate('/dashboard');
            } else if (role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                message.error("Unauthorized role");
            }
        } catch (error) {
            message.error("Invalid username or password");
            console.error("Login error:", error);
        }
    };


    return (
        <div className='login-container'>
            <div className='login-form'>
                <img src={logo} className='logo' alt="MediMaster Logo"/>
                <p>Sign in to access your dashboard.</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <Input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            prefix={<UserOutlined />}
                        />
                    </div>
                    <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
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
                        />
                    </div>

                    <button type="submit" className="login-button">Sign In</button>
                    <a href="/import-product-list" className="sale-products-link">
                        Want to introduce your company's products? Click here!
                    </a>
                </form>
            </div>
        </div>
    );
};

export default Login;
