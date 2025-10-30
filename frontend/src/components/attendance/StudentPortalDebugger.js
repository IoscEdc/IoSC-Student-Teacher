import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    BugReport as BugReportIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import useStudentAttendance from '../../hooks/useStudentAttendance';
import axios from 'axios';

const StudentPortalDebugger = () => {
    const [debugInfo, setDebugInfo] = useState({});
    const [apiTests, setApiTests] = useState({});
    const [loading, setLoading] = useState(false);

    const { currentUser } = useSelector((state) => state.user);
    const {
        attendanceData,
        rawData,
        attendanceRecords,
        loading: hookLoading,
        error: hookError,
        lastUpdated,
        refreshAttendance
    } = useStudentAttendance(currentUser?._id);

    useEffect(() => {
        if (currentUser) {
            setDebugInfo({
                userId: currentUser._id,
                userName: currentUser.name,
                userRole: currentUser.role,
                token: localStorage.getItem('token') ? 'Present' : 'Missing',
                baseUrl: process.env.REACT_APP_BASE_URL
            });
        }
    }, [currentUser]);

    const testAPI = async (endpoint, description) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                description
            };
        } catch (error) {
            return {
                success: false,
                status: error.response?.status || 'Network Error',
                error: error.response?.data || error.message,
                description
            };
        }
    };

    const runAPITests = async () => {
        setLoading(true);
        const tests = {};

        // Test 1: Student Summary
        tests.summary = await testAPI(
            `/attendance/summary/student/${currentUser._id}`,
            'Student Attendance Summary'
        );

        // Test 2: Attendance Records (if we have subjects)
        if (tests.summary.success && tests.summary.data.data && tests.summary.data.data.length > 0) {
            const firstSubject = tests.summary.data.data[0];
            const subjectId = firstSubject.subjectId._id || firstSubject.subjectId;
            
            tests.records = await testAPI(
                `/attendance/records?studentId=${currentUser._id}&subjectId=${subjectId}&limit=5`,
                'Attendance Records'
            );
        }

        // Test 3: Basic auth test
        tests.auth = await testAPI('/auth/verify', 'Authentication Verification');

        setApiTests(tests);
        setLoading(false);
    };

    const renderTestResult = (test) => {
        if (!test) return null;

        return (
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {test.success ? (
                        <CheckCircleIcon color="success" />
                    ) : (
                        <ErrorIcon color="error" />
                    )}
                    <Typography variant="subtitle2">
                        {test.description}
                    </Typography>
                    <Chip 
                        label={test.status} 
                        color={test.success ? 'success' : 'error'} 
                        size="small" 
                    />
                </Box>
                
                {test.success ? (
                    <Box sx={{ pl: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                            Data type: {typeof test.data.data} | 
                            Records: {Array.isArray(test.data.data) ? test.data.data.length : 'N/A'}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ pl: 4 }}>
                        <Typography variant="caption" color="error">
                            Error: {JSON.stringify(test.error)}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <BugReportIcon color="primary" />
                    <Typography variant="h5">
                        Student Portal Debugger
                    </Typography>
                </Box>

                {/* User Info */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">User Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {Object.entries(debugInfo).map(([key, value]) => (
                                <Grid item xs={12} sm={6} key={key}>
                                    <Typography variant="body2">
                                        <strong>{key}:</strong> {value}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Hook Status */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">useStudentAttendance Hook Status</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                <strong>Loading:</strong> {hookLoading ? 'Yes' : 'No'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Error:</strong> {hookError || 'None'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Last Updated:</strong> {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Attendance Data:</strong> {attendanceData ? 'Present' : 'Missing'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Subjects Count:</strong> {attendanceData?.subjects?.length || 0}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Overall Percentage:</strong> {attendanceData?.overallPercentage?.toFixed(1) || 0}%
                            </Typography>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* API Tests */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">API Tests</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                            <Button 
                                variant="contained" 
                                onClick={runAPITests}
                                disabled={loading || !currentUser}
                                startIcon={loading ? <CircularProgress size={20} /> : null}
                            >
                                {loading ? 'Testing...' : 'Run API Tests'}
                            </Button>
                        </Box>

                        {Object.entries(apiTests).map(([key, test]) => (
                            <Box key={key}>
                                {renderTestResult(test)}
                            </Box>
                        ))}
                    </AccordionDetails>
                </Accordion>

                {/* Raw Data */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Raw Data</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Raw API Response:
                            </Typography>
                            <Paper sx={{ p: 2, backgroundColor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify(rawData, null, 2)}
                                </pre>
                            </Paper>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Actions */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={refreshAttendance}
                        disabled={hookLoading}
                    >
                        Refresh Data
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default StudentPortalDebugger;