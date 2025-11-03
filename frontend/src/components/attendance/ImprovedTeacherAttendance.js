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
    Chip,
    Card,
    CardContent,
    Grid,
    useMediaQuery,
    useTheme,
    Stack
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Person } from '@mui/icons-material';
import axios from 'axios';

const ImprovedTeacherAttendance = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
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
            classId = currentUser.teachSclass?._id;
            subjectId = currentUser.teachSubject?._id;
            className = currentUser.teachSclass?.sclassName;
            subjectName = currentUser.teachSubject?.subName;
        }

        if (!classId || !subjectId) {
            console.log('⚠️ Teacher assignments not found, using fallback values');
            classId = '6902126bf91c442b648f6b95';
            subjectId = '6902126bf91c442b648f6b9c';
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

            console.log('Submitting attendance data:', attendanceData);

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

    // Mobile Card View for Students
    const MobileStudentCard = ({ student, index }) => {
        const studentId = student._id || student.id || student.studentId || `student-${index}`;
        const currentStatus = attendance[studentId] || 'absent';
        
        return (
            <Card 
                sx={{ 
                    mb: 2,
                    backgroundColor: currentStatus === 'present' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)',
                    border: `2px solid ${currentStatus === 'present' ? '#4CAF50' : '#F44336'}`,
                }}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                Roll No: {student.rollNum}
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mt: 0.5 }}>
                                {student.name}
                            </Typography>
                        </Box>
                        <Chip
                            label={currentStatus.toUpperCase()}
                            color={currentStatus === 'present' ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
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
                            label={
                                <Typography variant="body2" fontWeight="bold">
                                    {currentStatus === 'present' ? 'Present' : 'Absent'}
                                </Typography>
                            }
                            labelPlacement="start"
                        />
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1400px', mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    <Link 
                        color="inherit" 
                        href="#" 
                        onClick={() => navigate(-1)}
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <ArrowBack sx={{ mr: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        Back
                    </Link>
                    <Typography color="text.primary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Mark Attendance
                    </Typography>
                </Breadcrumbs>

                <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
                    Mark Attendance
                </Typography>
                <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
                    {className} - {subjectName}
                </Typography>
                
                {/* Teacher Info */}
                <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mt: 2 }}>
                    <Chip 
                        icon={<Person />}
                        label={`${currentUser.name}`} 
                        color="primary" 
                        variant="outlined" 
                        size={isMobile ? "small" : "medium"}
                    />
                    <Chip 
                        label={`${currentUser.role}`} 
                        color="secondary" 
                        variant="outlined" 
                        size={isMobile ? "small" : "medium"}
                    />
                </Stack>
            </Box>

            {/* Message Alert */}
            {message && (
                <Alert severity={messageType} sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {message}
                </Alert>
            )}

            {/* Session Selection */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom fontWeight="bold">
                    Session Details
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={submitting}
                            size={isMobile ? "small" : "medium"}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
                    </Grid>
                </Grid>

                {/* Summary */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 2, 
                        backgroundColor: 'rgba(33, 150, 243, 0.08)',
                        border: '1px solid rgba(33, 150, 243, 0.3)'
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <CheckCircle sx={{ color: '#4CAF50', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="#4CAF50">
                                    {summary.present}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Present
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Cancel sx={{ color: '#F44336', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="#F44336">
                                    {summary.absent}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Absent
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Person sx={{ color: '#2196F3', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="#2196F3">
                                    {students.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading students...</Typography>
                </Box>
            )}

            {/* Students List - Responsive View */}
            {!loading && students.length > 0 && (
                <>
                    {/* Mobile/Tablet Card View */}
                    {isTablet ? (
                        <Box>
                            {students.map((student, index) => (
                                <MobileStudentCard key={student._id || index} student={student} index={index} />
                            ))}
                        </Box>
                    ) : (
                        /* Desktop Table View */
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
                </>
            )}

            {/* Submit Button - Fixed at bottom on mobile */}
            {!loading && students.length > 0 && (
                <Box 
                    sx={{ 
                        mt: 3, 
                        display: 'flex', 
                        justifyContent: 'center',
                        position: { xs: 'sticky', sm: 'static' },
                        bottom: { xs: 0, sm: 'auto' },
                        left: 0,
                        right: 0,
                        p: { xs: 2, sm: 0 },
                        backgroundColor: { xs: 'background.paper', sm: 'transparent' },
                        boxShadow: { xs: '0 -2px 10px rgba(0,0,0,0.1)', sm: 'none' },
                        zIndex: { xs: 1000, sm: 'auto' }
                    }}
                >
                    <Button
                        variant="contained"
                        size={isMobile ? "medium" : "large"}
                        onClick={handleSubmit}
                        disabled={submitting || !selectedSession}
                        fullWidth={isMobile}
                        sx={{ 
                            px: { xs: 3, sm: 4 }, 
                            py: { xs: 1.5, sm: 1.5 }, 
                            fontSize: { xs: '0.95rem', sm: '1.1rem' },
                            backgroundColor: '#4CAF50',
                            '&:hover': { backgroundColor: '#45a049' },
                            fontWeight: 'bold'
                        }}
                    >
                        {submitting ? 'Submitting...' : isMobile ? 
                            `Submit (${summary.present}P / ${summary.absent}A)` : 
                            `Mark Attendance (${summary.present} Present, ${summary.absent} Absent)`
                        }
                    </Button>
                </Box>
            )}

            {/* Add bottom padding on mobile to prevent content being hidden by sticky button */}
            {isMobile && !loading && students.length > 0 && (
                <Box sx={{ height: '80px' }} />
            )}
        </Box>
    );
};

export default ImprovedTeacherAttendance;