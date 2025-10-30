import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Alert
} from '@mui/material';

const ConnectionTest = () => {
    const { currentUser } = useSelector((state) => state.user);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Connection Test - Route Working!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
                ✅ This route is working! You can see this page, which means the routing is set up correctly.
            </Alert>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Current User Data:
                </Typography>
                <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
                    {JSON.stringify(currentUser, null, 2)}
                </pre>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Extracted Values:
                </Typography>
                <Typography>Class ID: {currentUser.teachSclass?._id || 'NOT FOUND'}</Typography>
                <Typography>Subject ID: {currentUser.teachSubject?._id || 'NOT FOUND'}</Typography>
                <Typography>Class Name: {currentUser.teachSclass?.sclassName || 'NOT FOUND'}</Typography>
                <Typography>Subject Name: {currentUser.teachSubject?.subName || 'NOT FOUND'}</Typography>
            </Paper>
        </Box>
    );
};

export default ConnectionTest;