import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Breadcrumbs,
    Link,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';

const ImprovedTeacherAttendance = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    // Get teacher's assigned class and subject
    const getTeacherAssignment = () => {
        let classId, subjectId, className, subjectName;

        if (currentUser.role === 'Teacher') {
            // For teachers, use their assigned class and subject
            classId = currentUser.teachSclass?._id;
            subjectId = currentUser.teachSubject?._id;
            className = currentUser.teachSclass?.sclassName;
            subjectName = currentUser.teachSubject?.subName;
        }

        // Fallback to hardcoded values if assignments are not available
        if (!classId || !subjectId) {
            console.log('⚠️ Teacher assignments not found, using fallback values');
            classId = '6902126bf91c442b648f6b95'; // AIDS B1
            subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
            className = 'AIDS B1';
            subjectName = 'Data Structures';
        }

        console.log('Teacher assignment:', { classId, subjectId, className, subjectName });
        return { classId, subjectId, className, subjectName };
    };

    const { classId, subjectId, className, subjectName } = getTeacherAssignment();

    // Load sessions
    useEffect(() => {
        const fetchSessions = async () => {
            if (!classId || !subjectId) return;

            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/session-options`, {
                    params: { classId, subjectId },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data.success && response.data.data.length > 0) {
                    setSessions(response.data.data);
                    console.log('✅ Loaded session options:', response.data.data);
                } else {
                    console.log('⚠️ No session configurations found, using fallback');
                    setSessions([
                        { value: 'Lecture 1', label: 'Lecture 1' },
                        { value: 'Lecture 2', label: 'Lecture 2' },
                        { value: 'Lecture 3', label: 'Lecture 3' },
                        { value: 'Lab', label: 'Lab' },
                        { value: 'Tutorial', label: 'Tutorial' }
                    ]);
                }
            } catch (error) {
                console.error('Error loading sessions:', error);
                setSessions([
                    { value: 'Lecture 1', label: 'Lecture 1' },
                    { value: 'Lecture 2', label: 'Lecture 2' },
                    { value: 'Lecture 3', label: 'Lecture 3' },
                    { value: 'Lab', label: 'Lab' },
                    { value: 'Tutorial', label: 'Tutorial' }
                ]);
            }
        };
        
        fetchSessions();
    }, [classId, subjectId]);

    // Load students
    useEffect(() => {
        const fetchStudents = async () => {
            if (!classId || !subjectId) {
                setMessage('Class or subject information not available. Please check your assignments.');
                setMessageType('warning');
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/class/${classId}/students`, {
                    params: { subjectId },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data.success && response.data.data) {
                    const studentList = response.data.data;
                    setStudents(studentList);
                    
                    // Initialize attendance with all students absent
                    const initialAttendance = {};
                    studentList.forEach((student) => {
                        const studentId = student._id || student.id || student.studentId;
                        initialAttendance[studentId] = 'absent';
                    });
                    setAttendance(initialAttendance);
                    
                    setMessage(`✅ Loaded ${studentList.length} students successfully`);
                    setMessageType('success');
                } else {
                    throw new Error(response.data.message || 'No students found');
                }
            } catch (error) {
                console.error('❌ Error loading students:', error);
                let errorMessage = 'Failed to load students';
                if (error.response?.status === 404) {
                    errorMessage = `❌ No students found for this class and subject.`;
                } else if (error.response?.status === 403) {
                    errorMessage = '❌ You do not have permission to access this class.';
                } else if (error.response?.status === 401) {
                    errorMessage = '❌ Your session has expired. Please log in again.';
                } else if (error.response?.data?.message) {
                    errorMessage = `❌ ${error.response.data.message}`;
                } else {
                    errorMessage = `❌ ${error.message}`;
                }
                
                setMessage(errorMessage);
                setMessageType('error');
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [classId, subjectId]);

    const handleAttendanceChange = (studentId, newStatus) => {
        setAttendance(prevAttendance => ({
            ...prevAttendance,
            [studentId]: newStatus
        }));
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        Object.values(attendance).forEach((status) => {
            if (status === 'present') summary.present++;
            else if (status === 'absent') summary.absent++;
        });
        return summary;
    };

    const handleSubmit = async () => {
        if (!selectedSession) {
            setMessage('Please select a session');
            setMessageType('warning');
            return;
        }

        if (students.length === 0) {
            setMessage('No students to mark attendance for');
            setMessageType('warning');
            return;
        }

        setSubmitting(true);
        try {
            // Convert object to array format expected by backend
            const studentAttendance = [];
            Object.entries(attendance).forEach(([studentId, status]) => {
                studentAttendance.push({
                    studentId: studentId,
                    status
                });
            });

            const attendanceData = {
                classId,
                subjectId,
                date: selectedDate,
                session: selectedSession,
                studentAttendance,
                userRole: 'Teacher'
            };

            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/attendance/mark`, attendanceData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                const summary = getAttendanceSummary();
                setMessage(`✅ Attendance marked successfully! Present: ${summary.present}, Absent: ${summary.absent}`);
                setMessageType('success');
                
                setTimeout(() => {
                    navigate(-1);
                }, 3000);
            } else {
                throw new Error(response.data.message || 'Failed to mark attendance');
            }
        } catch (error) {
            console.error('❌ Error marking attendance:', error);
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
            setMessageType('error');
        } finally {
            setSubmitting(false);
        }
    };



    const summary = getAttendanceSummary();

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
                
                {/* Teacher Info */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                        label={`Teacher: ${currentUser.name}`} 
                        color="primary" 
                        variant="outlined" 
                        size="small" 
                    />
                    <Chip 
                        label={`Role: ${currentUser.role}`} 
                        color="secondary" 
                        variant="outlined" 
                        size="small" 
                    />
                </Box>
            </Box>

            {/* Message Alert */}
            {message && (
                <Alert severity={messageType} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            {/* Session Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Session Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                        disabled={submitting}
                    />
                    
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Session</InputLabel>
                        <Select
                            value={selectedSession}
                            label="Session"
                            onChange={(e) => setSelectedSession(e.target.value)}
                            disabled={submitting}
                        >
                            {sessions.map((session) => (
                                <MenuItem key={session.value} value={session.value}>
                                    {session.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Summary and Bulk Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ 
                        display: 'flex',
                        gap: 3
                    }}>
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                            <CheckCircle sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Present: {summary.present}
                        </span>
                        <span style={{ color: '#F44336', fontWeight: 'bold' }}>
                            <Cancel sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Absent: {summary.absent}
                        </span>
                        <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                            Total: {students.length}
                        </span>
                    </Typography>
                    

                </Box>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading students...</Typography>
                </Box>
            )}

            {/* Students Table with Individual Controls */}
            {!loading && students.length > 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Attendance</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student, index) => {
                                const studentId = student._id || student.id || student.studentId || `student-${index}`;
                                const currentStatus = attendance[studentId] || 'absent';
                                
                                return (
                                    <TableRow key={studentId} sx={{ 
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                        backgroundColor: currentStatus === 'present' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
                                    }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" component="span">
                                                {student.rollNum}
                                            </Typography>
                                            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                                - {student.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={currentStatus === 'present'}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.checked ? 'present' : 'absent';
                                                            handleAttendanceChange(studentId, newStatus);
                                                        }}
                                                        disabled={submitting}
                                                        sx={{
                                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                                color: '#4CAF50',
                                                            },
                                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                backgroundColor: '#4CAF50',
                                                            },
                                                        }}
                                                    />
                                                }
                                                label={currentStatus === 'present' ? 'Present' : 'Absent'}
                                                labelPlacement="start"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={currentStatus.toUpperCase()}
                                                color={currentStatus === 'present' ? 'success' : 'error'}
                                                size="small"
                                                variant="filled"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Submit Button */}
            {!loading && students.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedSession}
                        sx={{ 
                            px: 4, 
                            py: 1.5, 
                            fontSize: '1.1rem',
                            backgroundColor: '#4CAF50',
                            '&:hover': { backgroundColor: '#45a049' }
                        }}
                    >
                        {submitting ? 'Submitting...' : `Mark Attendance (${summary.present} Present, ${summary.absent} Absent)`}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ImprovedTeacherAttendance;