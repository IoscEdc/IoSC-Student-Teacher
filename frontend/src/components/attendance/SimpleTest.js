import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Alert
} from '@mui/material';

const SimpleTest = () => {
    const { currentUser } = useSelector((state) => state.user);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Simple Component Test
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
                ✅ This component is loading correctly!
            </Alert>

            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Current User Info:
                </Typography>
                <Typography>Name: {currentUser?.name || 'Not available'}</Typography>
                <Typography>Role: {currentUser?.role || 'Not available'}</Typography>
                <Typography>ID: {currentUser?._id || 'Not available'}</Typography>
            </Paper>

            <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Environment Check:
                </Typography>
                <Typography>Base URL: {process.env.REACT_APP_BASE_URL}</Typography>
                <Typography>Token Present: {localStorage.getItem('token') ? 'Yes' : 'No'}</Typography>
            </Paper>

            <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Navigation Test:
                </Typography>
                <Typography>
                    If you can see this page, React routing is working correctly.
                </Typography>
                <Typography>
                    Try navigating to:
                </Typography>
                <ul>
                    <li>/Admin/attendance/mark (AdminAttendanceMarking)</li>
                    <li>/Teacher/attendance/mark (ImprovedTeacherAttendance)</li>
                </ul>
            </Paper>
        </Box>
    );
};

export default SimpleTest;