// src/config.js
const config = {
    API_BASE_URL: process.env.REACT_APP_BACKEND_URL || "http://localhost:3000/api" || "https://medimaster-be.vercel.app/api"
};

export default config;
