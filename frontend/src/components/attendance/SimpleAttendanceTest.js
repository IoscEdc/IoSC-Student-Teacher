import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox
} from '@mui/material';

/**
 * Simple test component to validate the simplified attendance interface
 * Only Present and Absent options, no Late or Excused
 */
const SimpleAttendanceTest = () => {
    const [attendance, setAttendance] = useState({});
    const [testResults, setTestResults] = useState([]);

    // Mock students for testing
    const mockStudents = [
        { _id: '1', name: 'John Doe', rollNum: '001' },
        { _id: '2', name: 'Jane Smith', rollNum: '002' },
        { _id: '3', name: 'Bob Johnson', rollNum: '003' }
    ];

    // Initialize attendance as all present
    React.useEffect(() => {
        const initialAttendance = {};
        mockStudents.forEach(student => {
            initialAttendance[student._id] = 'present';
        });
        setAttendance(initialAttendance);
    }, []);

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
        
        addTestResult(`Student ${studentId} marked as ${status}`);
    };

    const addTestResult = (message) => {
        setTestResults(prev => [...prev, { message, timestamp: new Date().toLocaleTimeString() }]);
    };



    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        Object.values(attendance).forEach(status => {
            summary[status] = (summary[status] || 0) + 1;
        });
        return summary;
    };

    const summary = getAttendanceSummary();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Simplified Attendance Interface Test
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
                This interface only supports Present and Absent attendance marking.
            </Typography>



            {/* Attendance Summary */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ display: 'flex', gap: 3 }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Present: {summary.present}</span>
                    <span style={{ color: '#F44336', fontWeight: 'bold' }}>Absent: {summary.absent}</span>
                </Typography>
            </Alert>

            {/* Student Attendance Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Student
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#4CAF50' }}>
                                Present
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#F44336' }}>
                                Absent
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockStudents.map((student) => (
                            <TableRow key={student._id} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                                <TableCell>
                                    <Typography variant="body1" fontWeight="bold" component="span" sx={{ fontSize: '1.1rem' }}>
                                        {student.rollNum}
                                    </Typography>
                                    <Typography variant="body1" component="span" sx={{ ml: 1, fontSize: '1rem' }}>
                                        - {student.name}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={attendance[student._id] === 'present'}
                                        onChange={(e) => {
                                            // Always set to present when clicked, regardless of current state
                                            handleAttendanceChange(student._id, 'present');
                                        }}
                                        sx={{
                                            color: '#4CAF50',
                                            '&.Mui-checked': {
                                                color: '#4CAF50',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                            }
                                        }}
                                        size="large"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={attendance[student._id] === 'absent'}
                                        onChange={(e) => {
                                            // Always set to absent when clicked, regardless of current state
                                            handleAttendanceChange(student._id, 'absent');
                                        }}
                                        sx={{
                                            color: '#F44336',
                                            '&.Mui-checked': {
                                                color: '#F44336',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                            }
                                        }}
                                        size="large"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Test Results */}
            {testResults.length > 0 && (
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>Activity Log:</Typography>
                    {testResults.slice(-5).map((result, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            [{result.timestamp}] {result.message}
                        </Typography>
                    ))}
                </Paper>
            )}

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6" gutterBottom>Test Instructions:</Typography>
                <Typography variant="body2" component="div">
                    <ol>
                        <li>Verify students are displayed as "Roll Number - Student Name"</li>
                        <li>Click Present/Absent checkboxes for individual students</li>
                        <li>Confirm only one status can be selected per student (mutual exclusivity)</li>

                        <li>Observe real-time summary updates</li>
                        <li>Verify visual feedback with green (Present) and red (Absent) colors</li>
                    </ol>
                </Typography>
            </Paper>
        </Box>
    );
};

export default SimpleAttendanceTest;