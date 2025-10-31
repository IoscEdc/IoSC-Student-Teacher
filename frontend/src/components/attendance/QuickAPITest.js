import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert
} from '@mui/material';
import axios from 'axios';

const QuickAPITest = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        setResult('Testing...');
        
        try {
            // Use the exact same values that work in backend testing
            const classId = '6902126bf91c442b648f6b95'; // AIDS B1
            const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
            
            console.log('Testing API with:', { classId, subjectId });
            console.log('Current user:', currentUser);
            console.log('Token:', localStorage.getItem('token')?.substring(0, 20) + '...');
            
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/class/${classId}/students`, {
                params: { subjectId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            console.log('API Response:', response.data);
            
            if (response.data.success) {
                setResult(`✅ SUCCESS! Found ${response.data.data.length} students. First student: ${response.data.data[0]?.name}`);
            } else {
                setResult(`❌ API returned success=false: ${response.data.message}`);
            }
            
        } catch (error) {
            console.error('API Error:', error);
            setResult(`❌ ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Quick API Test
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Current User Info:
                </Typography>
                <Typography>Role: {currentUser.role}</Typography>
                <Typography>Name: {currentUser.name}</Typography>
                <Typography>Email: {currentUser.email}</Typography>
                <Typography>Class: {currentUser.teachSclass?.sclassName || 'Not assigned'}</Typography>
                <Typography>Subject: {currentUser.teachSubject?.subName || 'Not assigned'}</Typography>
            </Paper>
            
            <Button 
                variant="contained" 
                onClick={testAPI} 
                disabled={loading}
                sx={{ mb: 3 }}
            >
                {loading ? 'Testing...' : 'Test Students API'}
            </Button>
            
            {result && (
                <Alert severity={result.includes('✅') ? 'success' : 'error'}>
                    {result}
                </Alert>
            )}
        </Box>
    );
};

export default QuickAPITest;