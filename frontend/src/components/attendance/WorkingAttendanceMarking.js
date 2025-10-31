import React, { useState, useEffect, useCallback } from 'react';
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
    Checkbox,
    Alert,
    CircularProgress,
    Breadcrumbs,
    Link
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

// Individual student row component to isolate state
const StudentAttendanceRow = ({ student, attendance, onAttendanceChange, disabled }) => {
    const studentId = student._id;
    const currentStatus = attendance[studentId] || 'present';
    
    const handlePresentChange = useCallback((e) => {
        console.log(`🟢 Present checkbox for ${student.name} (${studentId}), checked: ${e.target.checked}`);
        if (e.target.checked) {
            onAttendanceChange(studentId, 'present');
        }
    }, [studentId, onAttendanceChange, student.name]);
    
    const handleAbsentChange = useCallback((e) => {
        console.log(`🔴 Absent checkbox for ${student.name} (${studentId}), checked: ${e.target.checked}`);
        if (e.target.checked) {
            onAttendanceChange(studentId, 'absent');
        }
    }, [studentId, onAttendanceChange, student.name]);
    
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
                    ID: {studentId} | Status: {currentStatus}
                </Typography>
            </TableCell>
            <TableCell align="center">
                <Checkbox
                    checked={currentStatus === 'present'}
                    onChange={handlePresentChange}
                    disabled={disabled}
                    sx={{
                        color: '#4CAF50',
                        '&.Mui-checked': { color: '#4CAF50' },
                        '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.04)' }
                    }}
                />
            </TableCell>
            <TableCell align="center">
                <Checkbox
                    checked={currentStatus === 'absent'}
                    onChange={handleAbsentChange}
                    disabled={disabled}
                    sx={{
                        color: '#F44336',
                        '&.Mui-checked': { color: '#F44336' },
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.04)' }
                    }}
                />
            </TableCell>
        </TableRow>
    );
};

const WorkingAttendanceMarking = ({ situation = "Subject" }) => {
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
    const getClassAndSubjectIds = () => {
        let classId, subjectId, className, subjectName;

        // Use hardcoded values for testing
        classId = '6902126bf91c442b648f6b95'; // AIDS B1
        subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
        className = 'AIDS B1';
        subjectName = 'Data Structures';

        return { classId, subjectId, className, subjectName };
    };

    const { classId, subjectId, className, subjectName } = getClassAndSubjectIds();

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
                    
                    // Initialize attendance with alternating states for testing
                    const initialAttendance = {};
                    studentList.forEach((student, index) => {
                        initialAttendance[student._id] = index % 2 === 0 ? 'present' : 'absent';
                    });
                    console.log('🚀 Initial attendance state:', initialAttendance);
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

    // Attendance change handler with useCallback to prevent closure issues
    const handleAttendanceChange = useCallback((studentId, status) => {
        console.log(`🔄 Changing attendance for student ${studentId} to ${status}`);
        setAttendance(prev => {
            const newAttendance = {
                ...prev,
                [studentId]: status
            };
            console.log('📊 Updated attendance state:', newAttendance);
            return newAttendance;
        });
    }, []);

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
            if (summary.hasOwnProperty(status)) {
                summary[status]++;
            }
        });
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
                    Working Attendance Marking
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
                </Typography>

                {/* Debug buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                            if (students.length > 0) {
                                console.log('🧪 Test: Setting first student to absent');
                                handleAttendanceChange(students[0]._id, 'absent');
                            }
                        }}
                    >
                        Test: First Student Absent
                    </Button>
                    <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                            if (students.length > 0) {
                                console.log('🧪 Test: Setting first student to present');
                                handleAttendanceChange(students[0]._id, 'present');
                            }
                        }}
                    >
                        Test: First Student Present
                    </Button>
                </Box>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading students...</Typography>
                </Box>
            )}

            {/* Students Table */}
            {!loading && students.length > 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Student Details</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Present</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#F44336' }}>Absent</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student) => (
                                <StudentAttendanceRow
                                    key={student._id}
                                    student={student}
                                    attendance={attendance}
                                    onAttendanceChange={handleAttendanceChange}
                                    disabled={submitting}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Debug Info */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="div">
                    Debug - Current Attendance State:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ fontSize: '10px' }}>
                    {JSON.stringify(attendance, null, 2)}
                </Typography>
            </Box>

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

export default WorkingAttendanceMarking;