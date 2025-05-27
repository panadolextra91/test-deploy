import React from 'react';
import {
    TruckOutlined,
    HomeOutlined,
    MedicineBoxOutlined,
    AppstoreOutlined,
    TeamOutlined,
    FileTextOutlined,
    LoginOutlined,
    DownOutlined,
    ShopOutlined
} from '@ant-design/icons';
import logo from '../imgs/MediMaster.png'; // Replace with the correct path to your logo file
import './PharmacistSidebar.css';
import {useNavigate} from "react-router-dom"; // Optional: Import CSS for styling if needed
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import CoPresentOutlinedIcon from '@mui/icons-material/CoPresentOutlined';

const PharmacistSidebar = () => {
    const navigate = useNavigate();
    const [supplierOpen, setSupplierOpen] = React.useState(false);
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
            </div>
            <nav>
                <ul>
                    <li>
                        <a href="/dashboard">
                            <HomeOutlined/> Pharmacy
                        </a>
                    </li>
                    <li>
                        <a href="/medicines">
                            <MedicineBoxOutlined/> Medicines
                        </a>
                    </li>
                    <li>
                        <a href="/categories">
                            <AppstoreOutlined/> Categories
                        </a>
                    </li>
                    <li>
                        <div
                            className="submenu-toggle"
                            onClick={() => setSupplierOpen(!supplierOpen)}
                        >
                            <a href="#">
                                <TruckOutlined /> Supplies <DownOutlined style={{marginLeft: "10px", fontSize: "12px"}}/>
                            </a>
                        </div>
                        {supplierOpen && (
                            <ul className="submenu">
                                <li><a href="/suppliers" style={{fontSize: "15px"}}><ContactMailOutlinedIcon style={{marginRight: "10px", fontSize: "15px"}}/>Supplier List</a></li>
                                <li><a href="/products" style={{fontSize: "15px"}}><InventoryOutlinedIcon style={{marginRight: "10px", fontSize: "15px"}}/>Product List</a></li>
                                <li><a href="/pharma-sales-reps" style={{fontSize: "15px"}}><CoPresentOutlinedIcon style={{marginRight: "10px", fontSize: "15px"}}/>Pharma Sales Reps</a></li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <a href="/brands">
                            <ShopOutlined /> Brands
                        </a>
                    </li>
                    <li>
                        <a href="/sales-invoices">
                            <FileTextOutlined/> Sales & Invoices
                        </a>
                    </li>
                    <li>
                        <a href="/customers-manage">
                            <TeamOutlined/> Customers
                        </a>
                    </li>
                    <li>
                        <a onClick={handleLogout} style={{cursor: "pointer"}}>
                            <LoginOutlined/> Logout
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default PharmacistSidebar;
