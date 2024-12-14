import React from 'react';
import {
    HomeOutlined,
    MedicineBoxOutlined,
    AppstoreOutlined,
    TeamOutlined,
    FileTextOutlined,
    UserOutlined,
    LoginOutlined,
    TruckOutlined,
} from '@ant-design/icons';
import logo from '../imgs/trace.svg'; // Replace with the correct path to your logo file
import './AdminSidebar.css';
import {useNavigate} from "react-router-dom"; // Optional: Import CSS for styling if needed

const AdminSidebar = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        document.cookie.split(";").forEach((cookie) => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        });
        navigate('/');
    }
    return (
        <aside className="sidebar">
            <div className="border">
                <img src={logo} alt="MediMaster" className="logo-image" />
                <h2>
                    Medi
                    <br />
                    Master
                </h2>
            </div>
            <nav>
                <ul>
                    <li>
                        <a href="/admin-dashboard">
                            <HomeOutlined /> Admin
                        </a>
                    </li>
                    <li>
                        <a href="/medicines">
                            <MedicineBoxOutlined /> Medicines
                        </a>
                    </li>
                    <li>
                        <a href="/categories">
                            <AppstoreOutlined /> Categories
                        </a>
                    </li>
                    <li>
                        <a href="/suppliers">
                            <TruckOutlined /> Suppliers
                        </a>
                    </li>
                    <li>
                        <a href="/sales-invoices">
                            <FileTextOutlined /> Sales & Invoices
                        </a>
                    </li>
                    <li>
                        <a href="/users-manage">
                            <UserOutlined /> Users
                        </a>
                    </li>
                    <li>
                        <a href='/customers-manage'>
                            <TeamOutlined/> Customers
                        </a>
                    </li>
                    <li>
                        <a onClick={handleLogout} style={{cursor: "pointer"}}>
                            <LoginOutlined /> Logout
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
