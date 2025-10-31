import axios from 'axios';

// Create axios instance with base URL
const config = {
    baseURL: 'http://localhost:5000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

if (process.env.NODE_ENV === 'development') {
    console.log('Using baseURL:', config.baseURL);
}

const api = axios.create(config);

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        console.error('🚨 AXIOS ERROR - Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if user was logged in (has token)
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            // Check if this is NOT a login endpoint
            const isLoginEndpoint = error.config?.url?.includes('Login');
            
            if (token && !isLoginEndpoint) {
                // Token expired for logged-in user - redirect to home
                console.log('🔒 Token expired - logging out');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            } else {
                // Login failed - let the component handle the error
                console.log('❌ Login failed - staying on page');
            }
        }
        return Promise.reject(error);
    }
);

export default api;