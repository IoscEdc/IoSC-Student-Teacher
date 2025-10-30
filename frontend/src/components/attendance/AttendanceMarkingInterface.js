import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Snackbar,
    CircularProgress,
    Breadcrumbs,
    Link
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import SessionSelector from './SessionSelector';
import AttendanceMarkingGrid from './AttendanceMarkingGrid';
import { BlueButton } from '../buttonStyles';
import axios from 'axios';

const AttendanceMarkingInterface = ({ situation = "Subject" }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const { currentUser } = useSelector((state) => state.user);

    // State management
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState({});
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // Extract parameters based on situation and user role
    let classId, subjectId, className, subjectName;
    
    if (currentUser.role === 'Admin') {
        // For admin users, use hardcoded test values or get from params/props
        classId = params.classId || '6902126bf91c442b648f6b95'; // AIDS B1 class
        subjectId = params.subjectId || '6902126bf91c442b648f6b9c'; // Data Structures subject
        className = 'AIDS B1';
        subjectName = 'Data Structures';
    } else {
        // For teacher users, use their assigned class/subject
        // Check if we have the data in the expected format
        if (currentUser.teachSclass && currentUser.teachSubject) {
            classId = currentUser.teachSclass._id;
            subjectId = currentUser.teachSubject._id;
            className = currentUser.teachSclass.sclassName;
            subjectName = currentUser.teachSubject.subName;
        } else if (currentUser.assignedSubjects && currentUser.assignedSubjects.length > 0) {
            // Fallback to assignedSubjects array if available
            const assignment = currentUser.assignedSubjects[0];
            classId = assignment.classId;
            subjectId = assignment.subjectId;
            className = 'Assigned Class';
            subjectName = 'Assigned Subject';
        } else {
            // Use hardcoded values as fallback for testing
            classId = '6902126bf91c442b648f6b95';
            subjectId = '6902126bf91c442b648f6b9c';
            className = 'AIDS B1 (Fallback)';
            subjectName = 'Data Structures (Fallback)';
        }
    }
    
    // Debug current user
    console.log('Current user data:', {
        role: currentUser.role,
        teachSclass: currentUser.teachSclass,
        teachSubject: currentUser.teachSubject,
        extractedClassId: classId,
        extractedSubjectId: subjectId,
        situation: situation
    });

    // Sessions are now fetched dynamically by SessionSelector

    // Load students for the class and subject
    useEffect(() => {
        const fetchStudents = async () => {
            if (!classId || !subjectId) {
                console.log('Missing classId or subjectId:', { classId, subjectId });
                setError('Class or subject information not found. Using fallback values for testing.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                console.log('Fetching students for:', { classId, subjectId });
                
                // Using the API endpoint with subjectId parameter
                const response = await axios.get(
                    `/api/attendance/class/${classId}/students`,
                    {
                        params: { subjectId },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                console.log('Students API response:', response.data);

                if (response.data.success && response.data.data) {
                    setStudents(response.data.data);
                    console.log('Students loaded:', response.data.data.length);
                } else {
                    console.log('API returned success=false or no data:', response.data);
                    throw new Error(response.data.message || 'Failed to fetch students');
                }
            } catch (error) {
                console.error('Error fetching students:', error);
                
                // More user-friendly error handling
                if (error.response?.status === 404) {
                    setError('Students not found for this class and subject. Please check your assignments.');
                } else if (error.response?.status === 403) {
                    setError('You do not have permission to access this class. Please contact your administrator.');
                } else if (error.response?.status === 401) {
                    setError('Your session has expired. Please log in again.');
                } else {
                    setError(`Failed to load students: ${error.response?.data?.message || error.message}`);
                }
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [classId, subjectId]);

    // Validate session selection
    const isSessionValid = selectedDate && selectedSession;
    
    // Debug logging
    console.log('AttendanceMarkingInterface state:', {
        classId,
        subjectId,
        selectedDate,
        selectedSession,
        isSessionValid,
        studentsCount: students.length,
        loading,
        error
    });

    const handleAttendanceChange = (newAttendance) => {
        setAttendance(newAttendance);
    };

    const handleSubmitAttendance = async (attendanceData, summary) => {
        if (!isSessionValid) {
            setNotification({
                open: true,
                message: 'Please select both date and session before submitting.',
                severity: 'warning'
            });
            return;
        }

        try {
            setSubmitting(true);

            // Prepare attendance data for backend API
            const studentAttendance = Object.entries(attendanceData).map(([studentId, status]) => ({
                studentId,
                status
            }));

            const response = await axios.post(
                '/api/attendance/mark',
                {
                    classId,
                    subjectId,
                    date: selectedDate,
                    session: selectedSession,
                    studentAttendance
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setNotification({
                    open: true,
                    message: `Attendance marked successfully! ${summary.present} present, ${summary.absent} absent, ${summary.late} late, ${summary.excused} excused.`,
                    severity: 'success'
                });

                // Reset form or navigate back after successful submission
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to submit attendance');
            }
        } catch (error) {
            console.error('Error submitting attendance:', error);
            setNotification({
                open: true,
                message: error.response?.data?.message || 'Failed to submit attendance',
                severity: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link 
                        color="inherit" 
                        href="#" 
                        onClick={() => navigate(-1)}
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowBack sx={{ mr: 0.5 }} fontSize="inherit" />
                        Back
                    </Link>
                    <Typography color="text.primary">Mark Attendance</Typography>
                </Breadcrumbs>

                <Typography variant="h4" gutterBottom>
                    Mark Attendance
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    {className} - {subjectName}
                </Typography>
            </Box>

            {/* Session Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <SessionSelector
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    selectedSession={selectedSession}
                    onSessionChange={setSelectedSession}
                    classId={classId}
                    subjectId={subjectId}
                    disabled={submitting}
                />
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Validation Alert */}
            {!isSessionValid && !error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Please select both date and session to proceed with attendance marking.
                </Alert>
            )}

            {/* Attendance Grid */}
            {isSessionValid && (
                <AttendanceMarkingGrid
                    students={students}
                    onAttendanceChange={handleAttendanceChange}
                    onSubmit={handleSubmitAttendance}
                    loading={loading}
                    disabled={submitting}
                />
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading attendance interface...</Typography>
                </Box>
            )}

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseNotification} 
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceMarkingInterface;