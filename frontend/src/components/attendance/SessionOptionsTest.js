import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const SessionOptionsTest = () => {
    const [sessionOptions, setSessionOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    // Test data
    const classId = '6902126bf91c442b648f6b95';
    const subjectId = '6902126bf91c442b648f6b9c';

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'No token found');
    }, []);

    const testSessionOptions = async () => {
        setLoading(true);
        setError('');
        setSessionOptions([]);

        try {
            console.log('Testing session options API...');
            console.log('Class ID:', classId);
            console.log('Subject ID:', subjectId);
            console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

            const response = await axios.get('/api/attendance/session-options', {
                params: { classId, subjectId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('API Response:', response.data);

            if (response.data.success) {
                setSessionOptions(response.data.data);
            } else {
                setError('API returned success: false');
            }
        } catch (err) {
            console.error('API Error:', err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Session Options API Test
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Class ID: {classId}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Subject ID: {subjectId}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                    Token: {token ? 'Present' : 'Missing'}
                </Typography>

                <Button 
                    variant="contained" 
                    onClick={testSessionOptions}
                    disabled={loading}
                    sx={{ mb: 3 }}
                >
                    {loading ? <CircularProgress size={20} /> : 'Test Session Options API'}
                </Button>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        Error: {error}
                    </Typography>
                )}

                {sessionOptions.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Session Options ({sessionOptions.length}):
                        </Typography>
                        {sessionOptions.map((option, index) => (
                            <Typography key={index} variant="body2">
                                • {option.label} (value: {option.value})
                            </Typography>
                        ))}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default SessionOptionsTest;