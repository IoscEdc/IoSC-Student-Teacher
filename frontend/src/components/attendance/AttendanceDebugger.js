import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';

const AttendanceDebugger = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [apiTest, setApiTest] = useState(null);
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        try {
            // Test with hardcoded values that we know work
            const classId = '6902126bf91c442b648f6b95'; // AIDS B1
            const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
            
            console.log('Testing with hardcoded values:', { classId, subjectId });
            
            // Test session options
            const sessionResponse = await axios.get('/api/attendance/session-options', {
                params: { classId, subjectId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Test students
            const studentsResponse = await axios.get(`/api/attendance/class/${classId}/students`, {
                params: { subjectId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            setApiTest({
                success: true,
                sessions: sessionResponse.data.data,
                students: studentsResponse.data.data,
                studentsCount: studentsResponse.data.data.length
            });
            
        } catch (error) {
            console.error('API test failed:', error);
            setApiTest({
                success: false,
                error: error.response?.data || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Attendance System Debugger
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Current User Data:
                </Typography>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(currentUser, null, 2)}
                </pre>
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Extracted Values:
                </Typography>
                <Typography>
                    Class ID: {currentUser.teachSclass?._id || 'NOT FOUND'}
                </Typography>
                <Typography>
                    Subject ID: {currentUser.teachSubject?._id || 'NOT FOUND'}
                </Typography>
                <Typography>
                    Class Name: {currentUser.teachSclass?.sclassName || 'NOT FOUND'}
                </Typography>
                <Typography>
                    Subject Name: {currentUser.teachSubject?.subName || 'NOT FOUND'}
                </Typography>
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    API Test:
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={testAPI} 
                    disabled={loading}
                    sx={{ mb: 2 }}
                >
                    {loading ? 'Testing...' : 'Test APIs with Hardcoded Values'}
                </Button>
                
                {apiTest && (
                    <Box>
                        {apiTest.success ? (
                            <Box>
                                <Typography color="success.main">✅ API Test Successful!</Typography>
                                <Typography>Sessions found: {apiTest.sessions.length}</Typography>
                                <Typography>Students found: {apiTest.studentsCount}</Typography>
                                <Typography>Sessions: {apiTest.sessions.map(s => s.value).join(', ')}</Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Typography color="error.main">❌ API Test Failed</Typography>
                                <pre style={{ fontSize: '12px' }}>
                                    {JSON.stringify(apiTest.error, null, 2)}
                                </pre>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AttendanceDebugger;