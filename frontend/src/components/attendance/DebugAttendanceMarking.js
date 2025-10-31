import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';

const DebugAttendanceMarking = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    const classId = '6902126bf91c442b648f6b95'; // AIDS B1
    const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures

    const loadStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/attendance/class/${classId}/students?subjectId=${subjectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            console.log('Students response:', response.data);
            
            if (response.data.success) {
                setStudents(response.data.data.slice(0, 3)); // Only first 3 for testing
                setMessage(`✅ Loaded ${response.data.data.length} students`);
                setMessageType('success');
            } else {
                setMessage('❌ Failed to load students');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async () => {
        if (students.length === 0) {
            setMessage('❌ No students loaded');
            setMessageType('error');
            return;
        }

        setLoading(true);
        try {
            const attendanceData = {
                classId,
                subjectId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: students.map((student, index) => ({
                    studentId: student.studentId,
                    status: index % 2 === 0 ? 'present' : 'absent'
                }))
            };

            console.log('Marking attendance with data:', attendanceData);

            let response;
            try {
                // Try main API
                response = await axios.post(
                    `${process.env.REACT_APP_BASE_URL}/attendance/mark`,
                    attendanceData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                setMessage('✅ Main API Success!');
            } catch (mainError) {
                console.log('Main API failed, trying fallback...');
                // Try fallback
                response = await axios.post(
                    `${process.env.REACT_APP_BASE_URL}/attendance-fallback/mark`,
                    attendanceData
                );
                setMessage('✅ Fallback API Success!');
            }

            console.log('Attendance response:', response.data);
            setMessageType('success');

        } catch (error) {
            console.error('Error marking attendance:', error);
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Debug Attendance Marking
            </Typography>

            {message && (
                <Alert severity={messageType} sx={{ mb: 2 }}>
                    {message}
                </Alert>
            )}

            <Box sx={{ mb: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={loadStudents} 
                    disabled={loading}
                    sx={{ mr: 2 }}
                >
                    {loading ? <CircularProgress size={20} /> : 'Load Students'}
                </Button>

                <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={markAttendance} 
                    disabled={loading || students.length === 0}
                >
                    {loading ? <CircularProgress size={20} /> : 'Mark Attendance'}
                </Button>
            </Box>

            {students.length > 0 && (
                <Box>
                    <Typography variant="h6">Students ({students.length}):</Typography>
                    {students.map((student, index) => (
                        <Typography key={student.studentId} variant="body2">
                            {student.rollNum} - {student.name} (ID: {student.studentId})
                        </Typography>
                    ))}
                </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">Debug Info:</Typography>
                <Typography variant="body2">
                    Base URL: {process.env.REACT_APP_BASE_URL}
                </Typography>
                <Typography variant="body2">
                    Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}
                </Typography>
                <Typography variant="body2">
                    Class ID: {classId}
                </Typography>
                <Typography variant="body2">
                    Subject ID: {subjectId}
                </Typography>
            </Box>
        </Box>
    );
};

export default DebugAttendanceMarking;