import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token to every request
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        console.log('🔍 AXIOS INTERCEPTOR - Request:', config.method?.toUpperCase(), config.url);
        console.log('🔑 AXIOS INTERCEPTOR - Token found:', token ? 'Yes' : 'No');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ AXIOS INTERCEPTOR - Token added to request');
        } else {
            console.log('⚠️ AXIOS INTERCEPTOR - No token in localStorage');
        }
        
        return config;
    },
    (error) => {
        console.error('❌ AXIOS INTERCEPTOR - Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => {
        console.log('✅ AXIOS INTERCEPTOR - Response received:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ AXIOS INTERCEPTOR - Response error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });
        
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
            console.log('🚨 AXIOS INTERCEPTOR - Unauthorized! Redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // window.location.href = '/';
        }
        
        return Promise.reject(error);
    }
);

export default api;