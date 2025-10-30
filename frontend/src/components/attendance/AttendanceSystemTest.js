import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const AttendanceSystemTest = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        const results = [];

        try {
            // Test 1: Check current user
            results.push({
                test: 'Current User Check',
                status: 'success',
                data: {
                    role: currentUser.role,
                    name: currentUser.name,
                    id: currentUser._id
                }
            });

            // Test 2: Check session options endpoint
            try {
                const sessionResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/session-options`, {
                    params: { 
                        classId: '6902126bf91c442b648f6b95', 
                        subjectId: '6902126bf91c442b648f6b9c' 
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                results.push({
                    test: 'Session Options API',
                    status: 'success',
                    data: sessionResponse.data
                });
            } catch (error) {
                results.push({
                    test: 'Session Options API',
                    status: 'error',
                    data: error.response?.data || error.message
                });
            }

            // Test 3: Check students endpoint
            try {
                const studentsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/class/6902126bf91c442b648f6b95/students`, {
                    params: { subjectId: '6902126bf91c442b648f6b9c' },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                results.push({
                    test: 'Students API',
                    status: 'success',
                    data: {
                        success: studentsResponse.data.success,
                        studentCount: studentsResponse.data.data?.length || 0,
                        firstStudent: studentsResponse.data.data?.[0]
                    }
                });
            } catch (error) {
                results.push({
                    test: 'Students API',
                    status: 'error',
                    data: error.response?.data || error.message
                });
            }

            // Test 4: Check if admin can access classes
            if (currentUser.role === 'Admin') {
                try {
                    const classesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/Admin/Sclass`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    results.push({
                        test: 'Admin Classes API',
                        status: 'success',
                        data: {
                            classCount: classesResponse.data?.length || 0,
                            firstClass: classesResponse.data?.[0]
                        }
                    });
                } catch (error) {
                    results.push({
                        test: 'Admin Classes API',
                        status: 'error',
                        data: error.response?.data || error.message
                    });
                }
            }

        } catch (error) {
            results.push({
                test: 'General Error',
                status: 'error',
                data: error.message
            });
        }

        setTestResults(results);
        setLoading(false);
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Attendance System Test
            </Typography>
            
            <Button 
                variant="contained" 
                onClick={runTests} 
                disabled={loading}
                sx={{ mb: 3 }}
            >
                {loading ? 'Running Tests...' : 'Run Tests Again'}
            </Button>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {testResults.map((result, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {result.test}
                    </Typography>
                    
                    <Alert severity={result.status === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
                        Status: {result.status}
                    </Alert>
                    
                    <Typography variant="body2" component="pre" sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.05)', 
                        p: 1, 
                        borderRadius: 1,
                        fontSize: '12px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(result.data, null, 2)}
                    </Typography>
                </Paper>
            ))}

            <Paper sx={{ p: 2, mt: 3, backgroundColor: 'rgba(0,0,255,0.05)' }}>
                <Typography variant="h6" gutterBottom>
                    Quick Links for Testing:
                </Typography>
                <Typography variant="body2">
                    • Admin Attendance: <code>/Admin/attendance/mark</code><br/>
                    • Teacher Attendance: <code>/Teacher/attendance/mark</code><br/>
                    • Attendance Navigation: <code>/Admin/attendance</code> or <code>/Teacher/attendance</code>
                </Typography>
            </Paper>
        </Box>
    );
};

export default AttendanceSystemTest;