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
    Step,
    Stepper,
    StepLabel
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

const AdminAttendanceMarking = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    
    // Step management
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Select Class & Subject', 'Mark Attendance'];
    
    // Selection state
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClassName, setSelectedClassName] = useState('');
    const [selectedSubjectName, setSelectedSubjectName] = useState('');
    
    // Attendance marking state
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
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    // Load classes on component mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Admin/Sclass`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    setClasses(response.data);
                } else {
                    console.error('Unexpected classes response format:', response.data);
                    setMessage('Failed to load classes');
                    setMessageType('error');
                }
            } catch (error) {
                console.error('Error loading classes:', error);
                setMessage(`Failed to load classes: ${error.response?.data?.message || error.message}`);
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    // Load subjects when class is selected
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedClass) {
                setSubjects([]);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Admin/Subject/${selectedClass}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    setSubjects(response.data);
                } else {
                    console.error('Unexpected subjects response format:', response.data);
                    setMessage('Failed to load subjects for selected class');
                    setMessageType('error');
                }
            } catch (error) {
                console.error('Error loading subjects:', error);
                setMessage(`Failed to load subjects: ${error.response?.data?.message || error.message}`);
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [selectedClass]);

    // Load sessions when class and subject are selected
    useEffect(() => {
        const fetchSessions = async () => {
            if (!selectedClass || !selectedSubject) {
                setSessions([]);
                return;
            }

            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/session-options`, {
                    params: { classId: selectedClass, subjectId: selectedSubject },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data.success && response.data.data.length > 0) {
                    setSessions(response.data.data);
                } else {
                    // Fallback to default sessions
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
                // Fallback to default sessions
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
    }, [selectedClass, selectedSubject]);

    // Load students when proceeding to step 2
    const loadStudents = async () => {
        if (!selectedClass || !selectedSubject) return;

        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/class/${selectedClass}/students`, {
                params: { subjectId: selectedSubject },
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
            setMessage(`❌ Failed to load students: ${error.response?.data?.message || error.message}`);
            setMessageType('error');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            // Validate selection
            if (!selectedClass || !selectedSubject) {
                setMessage('Please select both class and subject');
                setMessageType('warning');
                return;
            }
            
            // Load students and proceed to next step
            await loadStudents();
            setActiveStep(1);
        }
    };

    const handleBack = () => {
        setActiveStep(0);
        setStudents([]);
        setAttendance({});
    };

    const handleClassChange = (event) => {
        const classId = event.target.value;
        const selectedClassObj = classes.find(c => c._id === classId);
        
        setSelectedClass(classId);
        setSelectedClassName(selectedClassObj?.sclassName || '');
        setSelectedSubject(''); // Reset subject selection
        setSelectedSubjectName('');
    };

    const handleSubjectChange = (event) => {
        const subjectId = event.target.value;
        const selectedSubjectObj = subjects.find(s => s._id === subjectId);
        
        setSelectedSubject(subjectId);
        setSelectedSubjectName(selectedSubjectObj?.subName || '');
    };

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
                classId: selectedClass,
                subjectId: selectedSubject,
                date: selectedDate,
                session: selectedSession,
                studentAttendance,
                userRole: 'Admin'
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
                    <Typography color="text.primary">Admin Attendance Marking</Typography>
                </Breadcrumbs>

                <Typography variant="h4" gutterBottom>
                    Admin Attendance Marking
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Select class and subject, then mark attendance
                </Typography>
            </Box>

            {/* Message Alert */}
            {message && (
                <Alert severity={messageType} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step 1: Class and Subject Selection */}
            {activeStep === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select Class and Subject
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <FormControl sx={{ minWidth: 250 }}>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={selectedClass}
                                label="Class"
                                onChange={handleClassChange}
                                disabled={loading}
                            >
                                {classes.map((classItem) => (
                                    <MenuItem key={classItem._id} value={classItem._id}>
                                        {classItem.sclassName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 250 }}>
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="Subject"
                                onChange={handleSubjectChange}
                                disabled={loading || !selectedClass}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject._id} value={subject._id}>
                                        {subject.subName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {selectedClass && selectedSubject && (
                        <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                            <Typography variant="body1">
                                <strong>Selected:</strong> {selectedClassName} - {selectedSubjectName}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!selectedClass || !selectedSubject || loading}
                        >
                            Next: Load Students
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Step 2: Attendance Marking */}
            {activeStep === 1 && (
                <>
                    {/* Session Selection */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Session Details - {selectedClassName} - {selectedSubjectName}
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

                    {/* Students Table */}
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
                                            <TableRow key={studentId}>
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

                    {/* Action Buttons */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={submitting}
                        >
                            Back to Selection
                        </Button>
                        
                        {!loading && students.length > 0 && (
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
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default AdminAttendanceMarking;