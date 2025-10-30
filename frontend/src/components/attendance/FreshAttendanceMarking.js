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
    FormControlLabel
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

const FreshAttendanceMarking = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        // Ensure we always use today's date in the correct timezone
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    // Use hardcoded values for testing
    const classId = '6902126bf91c442b648f6b95'; // AIDS B1
    const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
    const className = 'AIDS B1';
    const subjectName = 'Data Structures';

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
                setSessions([
                    { value: 'Lecture 1', label: 'Lecture 1' },
                    { value: 'Lecture 2', label: 'Lecture 2' },
                    { value: 'Lecture 3', label: 'Lecture 3' },
                    { value: 'Lecture 4', label: 'Lecture 4' },
                    { value: 'Lab', label: 'Lab' }
                ]);
            }
        };
        
        fetchSessions();
    }, []);

    // Load students
    useEffect(() => {
        const fetchStudents = async () => {
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
                    
                    // Debug: Log the actual student structure
                    console.log('🔍 Student data structure:', studentList[0]);
                    console.log('🔍 Available student fields:', Object.keys(studentList[0] || {}));
                    
                    // Initialize attendance using Map for better performance
                    const initialAttendance = new Map();
                    studentList.forEach((student, index) => {
                        // Try different possible ID fields
                        const studentId = student._id || student.id || student.studentId || `student-${index}`;
                        console.log(`🔍 Student ${index}: ID=${studentId}, Name=${student.name}`);
                        
                        // Default everyone to absent
                        initialAttendance.set(studentId, 'absent');
                    });
                    setAttendance(initialAttendance);
                    
                    setMessage(`✅ Loaded ${studentList.length} students successfully`);
                    setMessageType('success');
                    console.log('🚀 Students loaded:', studentList.length);
                    console.log('🚀 Initial attendance Map:', initialAttendance);
                } else {
                    throw new Error(response.data.message || 'No students found');
                }
            } catch (error) {
                console.error('❌ Error loading students:', error);
                setMessage(`❌ Failed to load students: ${error.response?.data?.message || error.message}`);
                setMessageType('error');
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Handle individual student attendance change
    const handleAttendanceChange = (studentId, newStatus) => {
        console.log(`🔄 Changing student ${studentId} from ${attendance.get(studentId)} to ${newStatus}`);
        
        setAttendance(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(studentId, newStatus);
            console.log(`📊 Updated Map for ${studentId}:`, newMap.get(studentId));
            return newMap;
        });
    };

    // Calculate summary from Map
    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        attendance.forEach((status) => {
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
            // Convert Map to array format expected by backend
            const studentAttendance = [];
            attendance.forEach((status, studentId) => {
                // If we used a fallback ID, we need to map it back to the real student
                let realStudentId = studentId;
                if (studentId.startsWith('student-')) {
                    const index = parseInt(studentId.split('-')[1]);
                    const student = students[index];
                    realStudentId = student._id || student.id || student.studentId || studentId;
                }
                
                studentAttendance.push({
                    studentId: realStudentId,
                    status
                });
            });
            
            console.log('🔍 Final studentAttendance array:', studentAttendance);

            console.log('📤 Submitting attendance data:', {
                classId,
                subjectId,
                date: selectedDate,
                session: selectedSession,
                studentAttendance
            });

            const attendanceData = {
                classId,
                subjectId,
                date: selectedDate,
                session: selectedSession,
                studentAttendance
            };

            let response;
            try {
                // Try the main attendance API first
                response = await axios.post(`${process.env.REACT_APP_BASE_URL}/attendance/mark`, attendanceData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (err) {
                console.log('Main attendance API failed, trying fallback...');
                // Fallback to simpler endpoint
                response = await axios.post(`${process.env.REACT_APP_BASE_URL}/attendance-fallback/mark`, attendanceData);
            }

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
                    Fresh Attendance Marking
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

                <Typography variant="h6" sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)', 
                    borderRadius: 1,
                    display: 'flex',
                    gap: 3
                }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Present: {summary.present}</span>
                    <span style={{ color: '#F44336', fontWeight: 'bold' }}>Absent: {summary.absent}</span>
                    <span style={{ color: '#2196F3', fontWeight: 'bold' }}>Total: {students.length}</span>
                </Typography>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading students...</Typography>
                </Box>
            )}

            {/* Students Table with Switches */}
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
                                // Use the same ID logic as initialization
                                const studentId = student._id || student.id || student.studentId || `student-${index}`;
                                const currentStatus = attendance.get(studentId) || 'absent';
                                
                                return (
                                    <TableRow key={studentId}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" component="span">
                                                {student.rollNum}
                                            </Typography>
                                            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                                - {student.name}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                ID: {studentId} | Raw ID: {student._id || 'undefined'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={currentStatus === 'present'}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.checked ? 'present' : 'absent';
                                                            console.log(`🎯 Switch toggled for ${student.name} (ID: ${studentId}): ${newStatus}`);
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
                                            <Typography 
                                                sx={{ 
                                                    color: currentStatus === 'present' ? '#4CAF50' : '#F44336',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {currentStatus}
                                            </Typography>
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
                        {submitting ? 'Submitting...' : 'Mark Attendance'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default FreshAttendanceMarking;