import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import {
    Assignment,
    BugReport,
    Speed,
    CheckCircle,
    Analytics
} from '@mui/icons-material';

const AttendanceNavigation = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    const attendanceOptions = [
        {
            title: currentUser.role === 'Admin' ? 'Admin Attendance Marking' : 'Fixed Attendance Marking',
            description: currentUser.role === 'Admin' ? 'Complete admin interface with class/subject selection and individual attendance marking' : 'New improved attendance marking interface with better error handling',
            icon: <CheckCircle color="success" />,
            path: currentUser.role === 'Admin' ? '/Admin/attendance/mark' : '/Teacher/attendance/mark',
            recommended: true
        },
        {
            title: 'Simple Attendance Marking',
            description: 'Basic attendance marking with hardcoded values for testing',
            icon: <Speed color="primary" />,
            path: currentUser.role === 'Admin' ? '/Admin/attendance/simple' : '/Teacher/attendance/simple'
        },
        {
            title: 'Original Attendance Interface',
            description: 'Original attendance marking interface (may have issues)',
            icon: <Assignment color="warning" />,
            path: currentUser.role === 'Admin' ? '/Admin/attendance/original' : '/Teacher/attendance/original'
        },
        {
            title: 'Debug Information',
            description: 'View current user data and test API connections',
            icon: <BugReport color="info" />,
            path: currentUser.role === 'Admin' ? '/Admin/attendance/debug' : '/Teacher/attendance/debug'
        },
        {
            title: 'Connection Test',
            description: 'Test API connectivity and authentication',
            icon: <BugReport color="warning" />,
            path: currentUser.role === 'Admin' ? '/Admin/attendance/connection' : '/Teacher/attendance/connection'
        }
    ];

    if (currentUser.role === 'Admin') {
        attendanceOptions.push({
            title: 'Analytics Dashboard',
            description: 'View comprehensive attendance analytics and reports',
            icon: <Analytics color="secondary" />,
            path: '/Admin/attendance/analytics'
        });
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Attendance System
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                Choose an attendance marking option
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Current User Information:
                </Typography>
                <Typography>Role: {currentUser.role}</Typography>
                <Typography>Name: {currentUser.name}</Typography>
                {currentUser.role === 'Teacher' && (
                    <>
                        <Typography>
                            Assigned Class: {currentUser.teachSclass?.sclassName || 'Not assigned'}
                        </Typography>
                        <Typography>
                            Assigned Subject: {currentUser.teachSubject?.subName || 'Not assigned'}
                        </Typography>
                    </>
                )}
            </Paper>

            <Grid container spacing={3}>
                {attendanceOptions.map((option, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                border: option.recommended ? '2px solid #4caf50' : 'none',
                                position: 'relative'
                            }}
                        >
                            {option.recommended && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: '#4caf50',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    RECOMMENDED
                                </Box>
                            )}
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {option.icon}
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        {option.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {option.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant={option.recommended ? 'contained' : 'outlined'}
                                    onClick={() => navigate(option.path)}
                                    fullWidth
                                >
                                    Open
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Quick Test URLs:
                </Typography>
                <Typography variant="body2" component="div">
                    <ul>
                        <li>Fixed Attendance: {window.location.origin}{currentUser.role === 'Admin' ? '/Admin/attendance/mark' : '/Teacher/attendance/mark'}</li>
                        <li>Simple Test: {window.location.origin}{currentUser.role === 'Admin' ? '/Admin/attendance/simple' : '/Teacher/attendance/simple'}</li>
                        <li>Debug Info: {window.location.origin}{currentUser.role === 'Admin' ? '/Admin/attendance/debug' : '/Teacher/attendance/debug'}</li>
                    </ul>
                </Typography>
            </Paper>
        </Box>
    );
};

export default AttendanceNavigation;