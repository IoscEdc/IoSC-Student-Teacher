import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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
    Checkbox,
    Alert,
    CircularProgress,
    Breadcrumbs,
    Link,
    styled
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

// Styled components for better visual feedback
const StyledCheckbox = styled(Checkbox)(({ theme, attendanceType }) => ({
    '&.Mui-checked': {
        color: attendanceType === 'present' ? '#4CAF50' : 
              attendanceType === 'absent' ? '#F44336' : 
              attendanceType === 'late' ? '#FF9800' : '#2196F3',
    },
    '&:hover': {
        backgroundColor: attendanceType === 'present' ? 'rgba(76, 175, 80, 0.04)' : 
                        attendanceType === 'absent' ? 'rgba(244, 67, 54, 0.04)' : 
                        attendanceType === 'late' ? 'rgba(255, 152, 0, 0.04)' : 'rgba(33, 150, 243, 0.04)',
    }
}));

const StudentRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1.5),
    }
}));

const ImprovedAttendanceMarking = ({ situation = "Subject" }) => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    // Smart class and subject ID detection
    // const getClassAndSubjectIds = () => {
    //     let classId, subjectId, className, subjectName;

    //     // Use hardcoded values for testing
    //     classId = '6902126bf91c442b648f6b95'; // AIDS B1
    //     subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
    //     className = 'AIDS B1';
    //     subjectName = 'Data Structures';

    //     return { classId, subjectId, className, subjectName };
    // };

    const location = useLocation();

    const { classId, subjectId, className, subjectName } = location.state || {};
  // Load sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/session-options`, {
                    params: { classId, subjectId },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data.success && response.data.data.length > 0) {
                    setSessions(response.data.data);
                } else {
                    // Use fallback sessions
                    setSessions([
                        { value: 'Lecture 1', label: 'Lecture 1' },
                        { value: 'Lecture 2', label: 'Lecture 2' },
                        { value: 'Lecture 3', label: 'Lecture 3' },
                        { value: 'Lecture 4', label: 'Lecture 4' },
                        { value: 'Lab', label: 'Lab' }
                    ]);
                }
            } catch (error) {
                console.error('Error loading sessions:', error);
                // Use fallback sessions
                setSessions([
                    { value: 'Lecture 1', label: 'Lecture 1' },
                    { value: 'Lecture 2', label: 'Lecture 2' },
                    { value: 'Lecture 3', label: 'Lecture 3' },
                    { value: 'Lecture 4', label: 'Lecture 4' },
                    { value: 'Lab', label: 'Lab' }
                ]);
            }
        };
        
        if (classId && subjectId) {
            fetchSessions();
        }
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
                    
                    // Initialize attendance as all present
                    const initialAttendance = {};
                    studentList.forEach(student => {
                        initialAttendance[student._id] = 'present';
                    });
                    console.log('Initial attendance state:', initialAttendance);
                    setAttendance(initialAttendance);
                    
                    setMessage(`✅ Loaded ${studentList.length} students successfully`);
                    setMessageType('success');
                } else {
                    throw new Error(response.data.message || 'No students found');
                }
            } catch (error) {
                console.error('Error loading students:', error);
                
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
  // Individual student attendance change handler with mutual exclusivity
    const handleAttendanceChange = (studentId, status) => {
        console.log(`Changing attendance for student ${studentId} to ${status}`);
        setAttendance(prev => {
            const newAttendance = {
                ...prev,
                [studentId]: status
            };
            console.log('New attendance state:', newAttendance);
            return newAttendance;
        });
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
            const studentAttendance = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            }));

            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/attendance/mark`, {
                classId,
                subjectId,
                date: selectedDate,
                session: selectedSession,
                studentAttendance
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                const summary = getAttendanceSummary();
                setMessage(`✅ Attendance marked successfully! Present: ${summary.present}, Absent: ${summary.absent}`);
                setMessageType('success');
                
                // Navigate back after a delay
                setTimeout(() => {
                    navigate(-1);
                }, 3000);
            } else {
                throw new Error(response.data.message || 'Failed to mark attendance');
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
            setMessageType('error');
        } finally {
            setSubmitting(false);
        }
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        Object.values(attendance).forEach(status => {
            summary[status] = (summary[status] || 0) + 1;
        });
        console.log('Attendance summary calculation:', { attendance, summary });
        return summary;
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

                <Typography variant="body1" sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)', 
                    borderRadius: 1,
                    display: 'flex',
                    gap: 3
                }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Present: {summary.present}</span>
                    <span style={{ color: '#F44336', fontWeight: 'bold' }}>Absent: {summary.absent}</span>
                </Typography>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading students...</Typography>
                </Box>
            )}  
          {/* Students Table with Improved UI */}
            {!loading && students.length > 0 && (
                <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Student</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#4CAF50' }}>Present</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#F44336' }}>Absent</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student) => (
                                <StudentRow key={student._id}>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold" component="span" sx={{ fontSize: '1.1rem' }}>
                                            {student.rollNum}
                                        </Typography>
                                        <Typography variant="body1" component="span" sx={{ ml: 1, fontSize: '1rem' }}>
                                            - {student.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <StyledCheckbox
                                            attendanceType="present"
                                            checked={attendance[student._id] === 'present'}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleAttendanceChange(student._id, 'present');
                                                }
                                            }}
                                            disabled={submitting}
                                            size="large"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <StyledCheckbox
                                            attendanceType="absent"
                                            checked={attendance[student._id] === 'absent'}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleAttendanceChange(student._id, 'absent');
                                                }
                                            }}
                                            disabled={submitting}
                                            size="large"
                                        />
                                    </TableCell>
                                </StudentRow>
                            ))}
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
                            '&:hover': {
                                backgroundColor: '#45a049'
                            }
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Mark Attendance'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ImprovedAttendanceMarking;