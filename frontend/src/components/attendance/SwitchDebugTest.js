import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    FormControlLabel,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';

/**
 * Debug component to test Switch-based attendance marking
 */
const SwitchDebugTest = () => {
    const [attendance, setAttendance] = useState(new Map());
    const [debugLog, setDebugLog] = useState([]);

    // Mock students for testing
    const mockStudents = [
        { _id: '1', name: 'John Doe', rollNum: '001' },
        { _id: '2', name: 'Jane Smith', rollNum: '002' },
        { _id: '3', name: 'Bob Johnson', rollNum: '003' }
    ];

    // Initialize attendance as all absent
    React.useEffect(() => {
        const initialAttendance = new Map();
        mockStudents.forEach(student => {
            initialAttendance.set(student._id, 'absent');
        });
        setAttendance(initialAttendance);
        addDebugLog('Initialized attendance - all students set to absent');
    }, []);

    const addDebugLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLog(prev => [...prev, { message, timestamp }]);
    };

    const handleAttendanceChange = (studentId, newStatus) => {
        console.log('🔄 Switch changed:', { studentId, newStatus });
        addDebugLog(`Switch changed: Student ${studentId} -> ${newStatus}`);
        
        setAttendance(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(studentId, newStatus);
            console.log('📊 Updated attendance map:', Object.fromEntries(newMap));
            addDebugLog(`Updated map: ${JSON.stringify(Object.fromEntries(newMap))}`);
            return newMap;
        });
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        attendance.forEach((status) => {
            if (status === 'present') summary.present++;
            else if (status === 'absent') summary.absent++;
        });
        return summary;
    };

    const summary = getAttendanceSummary();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Switch-Based Attendance Debug Test
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
                Testing individual switch controls for attendance marking.
            </Typography>

            {/* Attendance Summary */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ display: 'flex', gap: 3 }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Present: {summary.present}</span>
                    <span style={{ color: '#F44336', fontWeight: 'bold' }}>Absent: {summary.absent}</span>
                    <span style={{ color: '#2196F3', fontWeight: 'bold' }}>Total: {mockStudents.length}</span>
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
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Attendance Switch
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Current Status
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockStudents.map((student) => {
                            const currentStatus = attendance.get(student._id) || 'absent';
                            
                            return (
                                <TableRow key={student._id} sx={{ 
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    backgroundColor: currentStatus === 'present' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
                                }}>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold" component="span" sx={{ fontSize: '1.1rem' }}>
                                            {student.rollNum}
                                        </Typography>
                                        <Typography variant="body1" component="span" sx={{ ml: 1, fontSize: '1rem' }}>
                                            - {student.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={currentStatus === 'present'}
                                                    onChange={(e) => {
                                                        console.log('🎯 Switch event:', e.target.checked);
                                                        const newStatus = e.target.checked ? 'present' : 'absent';
                                                        handleAttendanceChange(student._id, newStatus);
                                                    }}
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
                                                textTransform: 'uppercase',
                                                fontSize: '1rem'
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

            {/* Debug Log */}
            {debugLog.length > 0 && (
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>Debug Log:</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {debugLog.slice(-10).map((log, index) => (
                            <Typography key={index} variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
                                [{log.timestamp}] {log.message}
                            </Typography>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Current State Display */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6" gutterBottom>Current Attendance State:</Typography>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(Object.fromEntries(attendance), null, 2)}
                </Typography>
            </Paper>
        </Box>
    );
};

export default SwitchDebugTest;