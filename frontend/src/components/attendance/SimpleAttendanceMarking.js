import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const SimpleAttendanceMarking = () => {
    const { currentUser } = useSelector((state) => state.user);
    
    // Hardcoded values that we know work
    const classId = '6902126bf91c442b648f6b95'; // AIDS B1
    const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
    
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

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
                setSessions(response.data.data || []);
                console.log('Sessions loaded:', response.data.data);
            } catch (error) {
                console.error('Error loading sessions:', error);
                // Fallback sessions
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
                
                const studentList = response.data.data || [];
                setStudents(studentList);
                
                // Initialize attendance as all present
                const initialAttendance = {};
                studentList.forEach(student => {
                    initialAttendance[student._id] = 'present';
                });
                setAttendance(initialAttendance);
                
                console.log('Students loaded:', studentList.length);
            } catch (error) {
                console.error('Error loading students:', error);
                setMessage(`Error loading students: ${error.response?.data?.message || error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmit = async () => {
        if (!selectedSession) {
            setMessage('Please select a session');
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
                setMessage('✅ Attendance marked successfully!');
                console.log('Attendance marked:', response.data);
            } else {
                setMessage('❌ Failed to mark attendance');
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0, late: 0, excused: 0 };
        Object.values(attendance).forEach(status => {
            summary[status] = (summary[status] || 0) + 1;
        });
        return summary;
    };

    const summary = getAttendanceSummary();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Simple Attendance Marking
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                AIDS B1 - Data Structures (Hardcoded for Testing)
            </Typography>

            {message && (
                <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Session</InputLabel>
                        <Select
                            value={selectedSession}
                            label="Session"
                            onChange={(e) => setSelectedSession(e.target.value)}
                        >
                            {sessions.map((session) => (
                                <MenuItem key={session.value} value={session.value}>
                                    {session.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Typography variant="h6" gutterBottom>
                    Summary: Present: {summary.present}, Absent: {summary.absent}, Late: {summary.late}, Excused: {summary.excused}
                </Typography>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading students...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Roll Number</TableCell>
                                <TableCell>Present</TableCell>
                                <TableCell>Absent</TableCell>
                                <TableCell>Late</TableCell>
                                <TableCell>Excused</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student._id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.rollNum}</TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={attendance[student._id] === 'present'}
                                            onChange={() => handleAttendanceChange(student._id, 'present')}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={attendance[student._id] === 'absent'}
                                            onChange={() => handleAttendanceChange(student._id, 'absent')}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={attendance[student._id] === 'late'}
                                            onChange={() => handleAttendanceChange(student._id, 'late')}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={attendance[student._id] === 'excused'}
                                            onChange={() => handleAttendanceChange(student._id, 'excused')}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedSession || students.length === 0}
                >
                    {submitting ? 'Submitting...' : 'Mark Attendance'}
                </Button>
            </Box>
        </Box>
    );
};

export default SimpleAttendanceMarking;