import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, InputLabel,
    MenuItem, Select,
    Typography, Stack,
    TextField, CircularProgress, FormControl,
    Alert, Paper, Snackbar
} from '@mui/material';
import { PurpleButton } from '../../../components/buttonStyles';

const StudentAttendanceNew = ({ situation }) => {
    const { currentUser } = useSelector((state) => state.user);
    const params = useParams();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [status, setStatus] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [session, setSession] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Get class and subject info based on user role with fallbacks
    const getClassAndSubjectInfo = () => {
        if (currentUser.role === 'Admin') {
            return {
                classId: params.classId || '6902126bf91c442b648f6b95',
                subjectId: params.subjectId || '6902126bf91c442b648f6b9c',
                className: 'AIDS B1',
                defaultSubjectName: 'Data Structures'
            };
        } else {
            return {
                classId: currentUser.teachSclass?._id || '6902126bf91c442b648f6b95',
                subjectId: currentUser.teachSubject?._id || '6902126bf91c442b648f6b9c',
                className: currentUser.teachSclass?.sclassName || 'AIDS B1',
                defaultSubjectName: currentUser.teachSubject?.subName || 'Data Structures'
            };
        }
    };
    
    const { classId, subjectId, className, defaultSubjectName } = getClassAndSubjectInfo();

    // Available sessions - matching the session configuration system
    const availableSessions = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lab', 'Tutorial'];

    // Load students and subjects
    useEffect(() => {
        const fetchData = async () => {
            if (!classId) {
                setError('Class information not found. Please check your assignment.');
                return;
            }

            try {
                setLoading(true);
                
                // Fetch students for the class
                const studentsResponse = await axios.get(
                    `${process.env.REACT_APP_BASE_URL}/attendance/class/${classId}/students`,
                    {
                        params: { subjectId: subjectId || 'all' },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (studentsResponse.data.success) {
                    setStudents(studentsResponse.data.data || []);
                }                // If admin, also fetch subjects for the class
                if (currentUser.role === 'Admin') {
                    const subjectsResponse = await axios.get(
                        `${process.env.REACT_APP_BASE_URL}/Admin/Subject/${classId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    
                    if (subjectsResponse.data) {
                        setSubjects(Array.isArray(subjectsResponse.data) ? subjectsResponse.data : []);
                    }
                } else {
                    // For teachers, use their assigned subject
                    setSubjectName(defaultSubjectName);
                }

                // Auto-select student if coming from student page
                if (situation === "Student" && params.id) {
                    setSelectedStudent(params.id);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, subjectId, currentUser.role, situation, params.id]);

    const handleSubjectChange = (event) => {
        const selectedSubject = subjects.find(
            (subject) => subject.subName === event.target.value
        );
        
        if (selectedSubject) {
            setSubjectName(selectedSubject.subName);
        }
    };

    const submitHandler = async (event) => {
        event.preventDefault();

        // Validation
        if (!selectedStudent || !status || !date || !session) {
            setError('Please fill all required fields');
            return;
        }

        if (currentUser.role === 'Admin' && !subjectName) {
            setError('Please select a subject');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // Get the correct subject ID
            let finalSubjectId = subjectId;
            if (currentUser.role === 'Admin' && subjectName) {
                const selectedSubject = subjects.find(s => s.subName === subjectName);
                finalSubjectId = selectedSubject?._id;
            }

            // Prepare attendance data for the new API
            const attendanceData = {
                classId,
                subjectId: finalSubjectId,
                date,
                session,
                studentAttendance: [{
                    studentId: selectedStudent,
                    status: status.toLowerCase() // Convert to lowercase for backend compatibility
                }],
                userRole: currentUser.role
            };

            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/attendance/mark`,
                attendanceData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Attendance marked successfully!');
                
                // Reset form
                setSelectedStudent('');
                setStatus('');
                
                // Navigate back after a delay
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to mark attendance');
            }

        } catch (err) {
            console.error('Error marking attendance:', err);
            setError(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseError = () => setError('');
    const handleCloseSuccess = () => setSuccess('');

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom>
                    Mark Student Attendance
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    {className} {defaultSubjectName && `- ${defaultSubjectName}`}
                </Typography>

                <Box component="form" onSubmit={submitHandler} sx={{ mt: 3 }}>
                    <Stack spacing={3}>
                        {/* Student Selection */}
                        <FormControl fullWidth required>
                            <InputLabel>Select Student</InputLabel>
                            <Select
                                value={selectedStudent}
                                label="Select Student"
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                disabled={submitting || situation === "Student"}
                            >
                                {students.length > 0 ? students.map((student) => (
                                    <MenuItem key={student._id} value={student._id}>
                                        {student.name} ({student.rollNum})
                                    </MenuItem>
                                )) : (
                                    <MenuItem value="">No students found</MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        {/* Subject Selection (Admin only) */}
                        {currentUser.role === 'Admin' && (
                            <FormControl fullWidth required>
                                <InputLabel>Select Subject</InputLabel>
                                <Select
                                    value={subjectName}
                                    label="Select Subject"
                                    onChange={handleSubjectChange}
                                    disabled={submitting}
                                >
                                    {subjects.length > 0 ? subjects.map((subject, index) => (
                                        <MenuItem key={index} value={subject.subName}>
                                            {subject.subName}
                                        </MenuItem>
                                    )) : (
                                        <MenuItem value="">No subjects found</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        )}

                        {/* Session Selection */}
                        <FormControl fullWidth required>
                            <InputLabel>Select Session</InputLabel>
                            <Select
                                value={session}
                                label="Select Session"
                                onChange={(e) => setSession(e.target.value)}
                                disabled={submitting}
                            >
                                {availableSessions.map((sessionOption) => (
                                    <MenuItem key={sessionOption} value={sessionOption}>
                                        {sessionOption}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Date Selection */}
                        <TextField
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            disabled={submitting}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />

                        {/* Attendance Status */}
                        <FormControl fullWidth required>
                            <InputLabel>Attendance Status</InputLabel>
                            <Select
                                value={status}
                                label="Attendance Status"
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={submitting}
                            >
                                <MenuItem value="present">Present</MenuItem>
                                <MenuItem value="absent">Absent</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Submit Button */}
                        <PurpleButton
                            fullWidth
                            size="large"
                            type="submit"
                            disabled={submitting}
                            sx={{ mt: 2 }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Mark Attendance"}
                        </PurpleButton>
                    </Stack>
                </Box>
            </Paper>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={4000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StudentAttendanceNew;
