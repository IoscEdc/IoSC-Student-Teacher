import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Button
} from '@mui/material';

const MinimalAdminAttendance = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [message, setMessage] = useState('Component loaded successfully!');

    const testAPI = async () => {
        setMessage('Testing API...');
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/attendance/session-options?classId=6902126bf91c442b648f6b95&subjectId=6902126bf91c442b648f6b9c`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessage(`✅ API Success: Found ${data.data?.length || 0} session options`);
            } else {
                const errorData = await response.json();
                setMessage(`❌ API Error: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            setMessage(`❌ Network Error: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Minimal Admin Attendance Test
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                {message}
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    User Info:
                </Typography>
                <Typography>Role: {currentUser?.role}</Typography>
                <Typography>Name: {currentUser?.name}</Typography>
            </Paper>

            <Button 
                variant="contained" 
                onClick={testAPI}
                sx={{ mb: 2 }}
            >
                Test API Connection
            </Button>

            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Debug Info:
                </Typography>
                <Typography>Base URL: {process.env.REACT_APP_BASE_URL}</Typography>
                <Typography>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</Typography>
                <Typography>Current Path: {window.location.pathname}</Typography>
            </Paper>
        </Box>
    );
};

export default MinimalAdminAttendance;