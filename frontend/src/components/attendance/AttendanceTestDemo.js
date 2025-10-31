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
 * Demo component to test individual attendance marking functionality
 * This demonstrates that the issue with individual attendance has been fixed
 */
const AttendanceTestDemo = () => {
    const [attendance, setAttendance] = useState({});
    const [logs, setLogs] = useState([]);

    // Mock students for testing
    const mockStudents = [
        { _id: '1', name: 'Alice Johnson', rollNum: '001' },
        { _id: '2', name: 'Bob Smith', rollNum: '002' },
        { _id: '3', name: 'Charlie Brown', rollNum: '003' }
    ];

    // Initialize attendance as all present
    React.useEffect(() => {
        const initialAttendance = {};
        mockStudents.forEach(student => {
            initialAttendance[student._id] = 'present';
        });
        setAttendance(initialAttendance);
        addLog('Initialized all students as Present');
    }, []);

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
        
        const student = mockStudents.find(s => s._id === studentId);
        addLog(`${student.rollNum} - ${student.name} marked as ${status.toUpperCase()}`);
    };

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { message, timestamp }]);
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        Object.values(attendance).forEach(status => {
            summary[status] = (summary[status] || 0) + 1;
        });
        return summary;
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const resetAttendance = () => {
        const resetAttendance = {};
        mockStudents.forEach(student => {
            resetAttendance[student._id] = 'present';
        });
        setAttendance(resetAttendance);
        addLog('Reset all students to Present');
    };

    const summary = getAttendanceSummary();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Individual Attendance Marking Test
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
                Test the individual attendance marking functionality. Click on Present/Absent checkboxes 
                for different students to verify they work independently.
            </Typography>

            {/* Controls */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={resetAttendance}
                    sx={{ backgroundColor: '#2196F3' }}
                >
                    Reset All to Present
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={clearLogs}
                >
                    Clear Logs
                </Button>
            </Box>

            {/* Attendance Summary */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Current Summary:</Typography>
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
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Current Status
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
                                        onChange={() => {
                                            // Always set to present when clicked
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
                                        onChange={() => {
                                            // Always set to absent when clicked
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
                                <TableCell align="center">
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: 'bold',
                                            color: attendance[student._id] === 'present' ? '#4CAF50' : '#F44336',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {attendance[student._id]}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Activity Log */}
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>Activity Log:</Typography>
                {logs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No activity yet. Click on checkboxes to test individual attendance marking.
                    </Typography>
                ) : (
                    logs.slice(-10).reverse().map((log, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            <strong>[{log.timestamp}]</strong> {log.message}
                        </Typography>
                    ))
                )}
            </Paper>

            {/* Test Instructions */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#e8f5e8' }}>
                <Typography variant="h6" gutterBottom>✅ Test Instructions:</Typography>
                <Typography variant="body2" component="div">
                    <ol>
                        <li><strong>Individual Control Test:</strong> Click Present checkbox for Alice, then Absent for Bob. Verify Charlie remains unchanged.</li>
                        <li><strong>Mutual Exclusivity Test:</strong> Click Present for Alice, then click Absent for Alice. Only Absent should be checked.</li>
                        <li><strong>Independence Test:</strong> Change Bob's status multiple times. Verify Alice and Charlie are not affected.</li>
                        <li><strong>Summary Update Test:</strong> Watch the summary counts update in real-time as you change attendance.</li>
                        <li><strong>Visual Feedback Test:</strong> Observe green checkboxes for Present and red checkboxes for Absent.</li>
                    </ol>
                </Typography>
                
                <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Expected Behavior:</strong> Each student's attendance can be marked independently. 
                        Clicking one student's checkbox should NOT affect other students. Only one status 
                        (Present or Absent) can be selected per student at a time.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};

export default AttendanceTestDemo;