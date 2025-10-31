import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box, Typography, Button, Paper, Alert, 
    CircularProgress, Snackbar, Stack
} from '@mui/material';

const AttendanceTest = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const testCases = [
        {
            name: 'Test Admin Login',
            test: async () => {
                const response = await axios.post('/api/AdminLogin', {
                    email: 'admin@school.com',
                    password: 'admin123'
                });
                return {
                    success: !!response.data.token,
                    message: response.data.token ? 'Token received' : 'No token',
                    data: response.data
                };
            }
        },
        {
            name: 'Test Fallback Health Check',
            test: async () => {
                const response = await axios.get('/api/attendance-fallback/health');
                return {
                    success: response.data.status === 'ok',
                    message: response.data.message,
                    data: response.data
                };
            }
        },
        {
            name: 'Test Get Students (Fallback)',
            test: async () => {
                const classId = '68ff8d3cb3e76597e43d133d'; // Class 10A
                const response = await axios.get(
                    `/api/attendance-fallback/class/${classId}/students?fallback=true`
                );
                return {
                    success: response.data.success,
                    message: `Found ${response.data.data?.length || 0} students`,
                    data: response.data
                };
            }
        },
        {
            name: 'Test Mark Attendance (Fallback)',
            test: async () => {
                const attendanceData = {
                    classId: '68ff8d3cb3e76597e43d133d',
                    subjectId: '68ff8dcbb3e76597e43d1344',
                    date: new Date().toISOString().split('T')[0],
                    session: 'Lecture 1',
                    studentAttendance: [{
                        studentId: '68ff86acb3e76597e43d1283',
                        status: 'Present'
                    }]
                };
                
                const response = await axios.post('/api/attendance-fallback/mark', attendanceData);
                return {
                    success: response.data.success,
                    message: response.data.message,
                    data: response.data
                };
            }
        }
    ];

    const runTests = async () => {
        setTesting(true);
        setResults([]);
        setError('');

        const testResults = [];

        for (const testCase of testCases) {
            try {
                console.log(`Running: ${testCase.name}`);
                const result = await testCase.test();
                testResults.push({
                    name: testCase.name,
                    success: result.success,
                    message: result.message,
                    data: result.data
                });
            } catch (err) {
                testResults.push({
                    name: testCase.name,
                    success: false,
                    message: err.response?.data?.message || err.message,
                    error: err
                });
            }
        }

        setResults(testResults);
        setTesting(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                🧪 Attendance System Tests
            </Typography>
            
            {currentUser && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Current User: {currentUser.name} ({currentUser.role})
                </Alert>
            )}

            <Button 
                variant="contained" 
                onClick={runTests} 
                disabled={testing}
                sx={{ mb: 3 }}
            >
                {testing ? <CircularProgress size={20} /> : 'Run Tests'}
            </Button>

            <Stack spacing={2}>
                {results.map((result, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ 
                            color: result.success ? 'success.main' : 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            {result.success ? '✅' : '❌'} {result.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {result.message}
                        </Typography>
                        {result.data && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="caption" component="pre">
                                    {JSON.stringify(result.data, null, 2)}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                ))}
            </Stack>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceTest;
