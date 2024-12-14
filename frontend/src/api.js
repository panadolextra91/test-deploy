// src/api.js
import axios from 'axios';
import config from './config';

const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Optional: Set up a request interceptor to add token authorization headers
api.interceptors.request.use((request) => {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

export default api;
