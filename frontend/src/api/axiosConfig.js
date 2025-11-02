// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL || 'http://localhost:5000'
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage (or wherever you store it)
        const userState = localStorage.getItem('user');
        let token = null;
        
        if (userState) {
            try {
                const parsed = JSON.parse(userState);
                token = parsed.token;
            } catch (e) {
                console.error('Error parsing user state:', e);
            }
        }
        
        // If token not in user state, try direct token storage
        if (!token) {
            token = localStorage.getItem('token');
        }
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Request with token to:', config.url);
        } else {
            console.warn('⚠️ No token found for request to:', config.url);
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('❌ 401 Unauthorized - Token may be invalid or expired');
            // Optionally redirect to login
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;