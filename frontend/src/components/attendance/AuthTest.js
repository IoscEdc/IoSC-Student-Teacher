import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert
} from '@mui/material';
import axios from 'axios';

const AuthTest = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [authStatus, setAuthStatus] = useState('checking');
    const [tokenInfo, setTokenInfo] = useState(null);
    const [apiTests, setApiTests] = useState([]);

    const checkAuth = async () => {
        setAuthStatus('checking');
        const token = localStorage.getItem('token');
        
        if (!token) {
            setAuthStatus('no-token');
            return;
        }

        try {
            // Decode token to see its contents (basic decode, not verification)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                setTokenInfo({
                    userId: payload.id,
                    role: payload.role,
                    exp: new Date(payload.exp * 1000).toLocaleString(),
                    iat: new Date(payload.iat * 1000).toLocaleString()
                });
            }

            // Test basic API endpoints
            const tests = [];

            // Test 1: Check if we can access admin profile (basic auth test)
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Admin/${currentUser._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                tests.push({
                    name: 'Admin Profile Access',
                    status: 'success',
                    data: 'Can access admin profile'
                });
            } catch (error) {
                tests.push({
                    name: 'Admin Profile Access',
                    status: 'error',
                    data: error.response?.data?.message || error.message
                });
            }

            // Test 2: Check attendance session options
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/session-options`, {
                    params: {
                        classId: '6902126bf91c442b648f6b95',
                        subjectId: '6902126bf91c442b648f6b9c'
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                tests.push({
                    name: 'Session Options API',
                    status: 'success',
                    data: response.data
                });
            } catch (error) {
                tests.push({
                    name: 'Session Options API',
                    status: 'error',
                    data: error.response?.data || error.message
                });
            }

            // Test 3: Check students API
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/class/6902126bf91c442b648f6b95/students`, {
                    params: {
                        subjectId: '6902126bf91c442b648f6b9c'
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                tests.push({
                    name: 'Students API',
                    status: 'success',
                    data: {
                        success: response.data.success,
                        count: response.data.data?.length || 0
                    }
                });
            } catch (error) {
                tests.push({
                    name: 'Students API',
                    status: 'error',
                    data: error.response?.data || error.message
                });
            }

            setApiTests(tests);
            setAuthStatus('checked');

        } catch (error) {
            setAuthStatus('error');
            console.error('Auth check failed:', error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Authentication Test
            </Typography>

            <Button 
                variant="contained" 
                onClick={checkAuth} 
                sx={{ mb: 3 }}
            >
                Recheck Authentication
            </Button>

            {/* Current User Info */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Current User (Redux State)
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: 'rgba(0,0,0,0.05)', 
                    p: 1, 
                    borderRadius: 1,
                    fontSize: '12px'
                }}>
                    {JSON.stringify(currentUser, null, 2)}
                </Typography>
            </Paper>

            {/* Token Info */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Token Information
                </Typography>
                {tokenInfo ? (
                    <Typography variant="body2" component="pre" sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.05)', 
                        p: 1, 
                        borderRadius: 1,
                        fontSize: '12px'
                    }}>
                        {JSON.stringify(tokenInfo, null, 2)}
                    </Typography>
                ) : (
                    <Alert severity="warning">No token found or invalid token format</Alert>
                )}
            </Paper>

            {/* API Test Results */}
            <Typography variant="h6" gutterBottom>
                API Test Results
            </Typography>
            {apiTests.map((test, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {test.name}
                    </Typography>
                    
                    <Alert severity={test.status === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
                        Status: {test.status}
                    </Alert>
                    
                    <Typography variant="body2" component="pre" sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.05)', 
                        p: 1, 
                        borderRadius: 1,
                        fontSize: '12px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(test.data, null, 2)}
                    </Typography>
                </Paper>
            ))}

            {authStatus === 'checking' && (
                <Alert severity="info">Checking authentication...</Alert>
            )}
        </Box>
    );
};

export default AuthTest;