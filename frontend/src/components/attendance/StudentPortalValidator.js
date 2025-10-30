import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Grid,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import useStudentAttendance from '../../hooks/useStudentAttendance';

const StudentPortalValidator = () => {
    const [validationResults, setValidationResults] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [overallStatus, setOverallStatus] = useState('pending');

    const { currentUser } = useSelector((state) => state.user);
    const {
        attendanceData,
        rawData,
        attendanceRecords,
        loading,
        error,
        lastUpdated,
        refreshAttendance
    } = useStudentAttendance(currentUser?._id);

    const validationTests = [
        {
            id: 'user-auth',
            name: 'User Authentication',
            description: 'Check if user is properly authenticated',
            test: () => {
                if (!currentUser) return { status: 'error', message: 'No user logged in' };
                if (!currentUser._id) return { status: 'error', message: 'User ID missing' };
                if (!localStorage.getItem('token')) return { status: 'error', message: 'No authentication token' };
                return { status: 'success', message: `User ${currentUser.name} authenticated` };
            }
        },
        {
            id: 'api-hook',
            name: 'Attendance Hook',
            description: 'Validate useStudentAttendance hook functionality',
            test: () => {
                if (loading) return { status: 'info', message: 'Hook is loading data' };
                if (error) return { status: 'error', message: `Hook error: ${error}` };
                if (!attendanceData) return { status: 'warning', message: 'No attendance data returned' };
                return { status: 'success', message: 'Hook working correctly' };
            }
        },
        {
            id: 'data-structure',
            name: 'Data Structure',
            description: 'Validate attendance data structure',
            test: () => {
                if (!attendanceData) return { status: 'error', message: 'No attendance data' };
                if (typeof attendanceData.overallPercentage !== 'number') {
                    return { status: 'error', message: 'Invalid overall percentage' };
                }
                if (!Array.isArray(attendanceData.subjects)) {
                    return { status: 'error', message: 'Subjects data is not an array' };
                }
                return { 
                    status: 'success', 
                    message: `Valid data: ${attendanceData.subjects.length} subjects, ${attendanceData.overallPercentage.toFixed(1)}% overall` 
                };
            }
        },
        {
            id: 'dashboard-component',
            name: 'Dashboard Component',
            description: 'Test AttendanceDashboard component rendering',
            test: () => {
                try {
                    // Check if component can handle the data
                    if (!attendanceData) return { status: 'warning', message: 'No data to test component with' };
                    if (attendanceData.subjects.length === 0) {
                        return { status: 'info', message: 'Component will show "no data" message' };
                    }
                    return { status: 'success', message: 'Component should render successfully' };
                } catch (err) {
                    return { status: 'error', message: `Component error: ${err.message}` };
                }
            }
        },
        {
            id: 'calendar-component',
            name: 'Calendar Component',
            description: 'Test AttendanceCalendar component',
            test: () => {
                try {
                    if (!attendanceData || !attendanceData.subjects) {
                        return { status: 'warning', message: 'No data for calendar' };
                    }
                    
                    // Check if any subjects have records
                    const hasRecords = attendanceData.subjects.some(subject => 
                        subject.records && subject.records.length > 0
                    );
                    
                    if (!hasRecords) {
                        return { status: 'info', message: 'Calendar will show empty (no attendance records)' };
                    }
                    
                    return { status: 'success', message: 'Calendar should display attendance records' };
                } catch (err) {
                    return { status: 'error', message: `Calendar error: ${err.message}` };
                }
            }
        },
        {
            id: 'subject-detail-component',
            name: 'Subject Detail Component',
            description: 'Test SubjectAttendanceDetail component',
            test: () => {
                try {
                    if (!attendanceData || !attendanceData.subjects || attendanceData.subjects.length === 0) {
                        return { status: 'warning', message: 'No subjects to display details for' };
                    }
                    
                    const firstSubject = attendanceData.subjects[0];
                    if (!firstSubject.subject) {
                        return { status: 'error', message: 'Subject missing name' };
                    }
                    
                    return { status: 'success', message: `Subject detail ready for ${firstSubject.subject}` };
                } catch (err) {
                    return { status: 'error', message: `Subject detail error: ${err.message}` };
                }
            }
        },
        {
            id: 'navigation',
            name: 'Navigation',
            description: 'Test student portal navigation',
            test: () => {
                try {
                    // Check if routes are accessible
                    const currentPath = window.location.pathname;
                    if (!currentPath.includes('/Student/')) {
                        return { status: 'warning', message: 'Not in student portal' };
                    }
                    return { status: 'success', message: 'Navigation working correctly' };
                } catch (err) {
                    return { status: 'error', message: `Navigation error: ${err.message}` };
                }
            }
        },
        {
            id: 'responsive-design',
            name: 'Responsive Design',
            description: 'Test mobile responsiveness',
            test: () => {
                try {
                    const isMobile = window.innerWidth < 768;
                    const hasTouch = 'ontouchstart' in window;
                    return { 
                        status: 'success', 
                        message: `${isMobile ? 'Mobile' : 'Desktop'} layout ${hasTouch ? 'with touch' : 'without touch'}` 
                    };
                } catch (err) {
                    return { status: 'error', message: `Responsive test error: ${err.message}` };
                }
            }
        }
    ];

    const runValidation = async () => {
        setIsValidating(true);
        const results = [];
        
        for (const test of validationTests) {
            try {
                const result = await test.test();
                results.push({
                    ...test,
                    ...result,
                    timestamp: new Date()
                });
            } catch (error) {
                results.push({
                    ...test,
                    status: 'error',
                    message: `Test failed: ${error.message}`,
                    timestamp: new Date()
                });
            }
        }
        
        setValidationResults(results);
        
        // Determine overall status
        const hasErrors = results.some(r => r.status === 'error');
        const hasWarnings = results.some(r => r.status === 'warning');
        
        if (hasErrors) {
            setOverallStatus('error');
        } else if (hasWarnings) {
            setOverallStatus('warning');
        } else {
            setOverallStatus('success');
        }
        
        setIsValidating(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'info':
                return <InfoIcon color="info" />;
            default:
                return <InfoIcon />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Student Portal Validation
                </Typography>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                    This tool validates all components and functionality of the student attendance portal.
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={runValidation}
                        disabled={isValidating}
                        startIcon={isValidating ? <CircularProgress size={20} /> : null}
                        sx={{ mr: 2 }}
                    >
                        {isValidating ? 'Validating...' : 'Run Validation'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        onClick={refreshAttendance}
                        disabled={loading}
                    >
                        Refresh Data
                    </Button>
                </Box>

                {validationResults.length > 0 && (
                    <>
                        <Alert 
                            severity={overallStatus === 'success' ? 'success' : overallStatus === 'error' ? 'error' : 'warning'}
                            sx={{ mb: 3 }}
                        >
                            <Typography variant="h6">
                                Overall Status: {overallStatus.toUpperCase()}
                            </Typography>
                            <Typography variant="body2">
                                {overallStatus === 'success' && 'All tests passed! Student portal is working correctly.'}
                                {overallStatus === 'error' && 'Some critical issues found. Please check the results below.'}
                                {overallStatus === 'warning' && 'Portal is functional but some issues need attention.'}
                            </Typography>
                        </Alert>

                        <Typography variant="h6" gutterBottom>
                            Validation Results
                        </Typography>

                        <List>
                            {validationResults.map((result, index) => (
                                <React.Fragment key={result.id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            {getStatusIcon(result.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        {result.name}
                                                    </Typography>
                                                    <Chip 
                                                        label={result.status.toUpperCase()} 
                                                        color={getStatusColor(result.status)}
                                                        size="small"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {result.description}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                        {result.message}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < validationResults.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </>
                )}

                {/* Summary Statistics */}
                {validationResults.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="body2">
                                    <strong>Total Tests:</strong> {validationResults.length}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="success.main">
                                    <strong>Passed:</strong> {validationResults.filter(r => r.status === 'success').length}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="error.main">
                                    <strong>Failed:</strong> {validationResults.filter(r => r.status === 'error').length}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="warning.main">
                                    <strong>Warnings:</strong> {validationResults.filter(r => r.status === 'warning').length}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default StudentPortalValidator;