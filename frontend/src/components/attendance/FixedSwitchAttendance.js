import React, { useState, useEffect } from 'react';
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
    TableRow,
    Chip
} from '@mui/material';

/**
 * Fixed Switch-based attendance marking component
 * Addresses potential issues with state management and re-rendering
 */
const FixedSwitchAttendance = () => {
    const [attendance, setAttendance] = useState({});
    const [debugInfo, setDebugInfo] = useState([]);

    // Mock students for testing
    const mockStudents = [
        { _id: '1', name: 'John Doe', rollNum: '001' },
        { _id: '2', name: 'Jane Smith', rollNum: '002' },
        { _id: '3', name: 'Bob Johnson', rollNum: '003' }
    ];

    // Initialize attendance as all absent using object instead of Map
    useEffect(() => {
        const initialAttendance = {};
        mockStudents.forEach(student => {
            initialAttendance[student._id] = 'absent';
        });
        setAttendance(initialAttendance);
        addDebugInfo('Initialized attendance - all students set to absent');
    }, []);

    const addDebugInfo = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugInfo(prev => [...prev, { message, timestamp }].slice(-5));
    };

    // Fixed attendance change handler
    const handleAttendanceChange = (studentId, newStatus) => {
        console.log('🔄 Attendance change:', { studentId, newStatus });
        addDebugInfo(`Student ${studentId}: ${attendance[studentId]} -> ${newStatus}`);
        
        setAttendance(prevAttendance => {
            const updatedAttendance = {
                ...prevAttendance,
                [studentId]: newStatus
            };
            console.log('📊 Updated attendance:', updatedAttendance);
            return updatedAttendance;
        });
    };

    const getAttendanceSummary = () => {
        const summary = { present: 0, absent: 0 };
        Object.values(attendance).forEach(status => {
            if (status === 'present') summary.present++;
            else if (status === 'absent') summary.absent++;
        });
        return summary;
    };

    const summary = getAttendanceSummary();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Fixed Switch-Based Attendance Marking
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
                This version uses object state instead of Map and ensures proper re-rendering.
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Attendance Switch</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockStudents.map((student) => {
                            const currentStatus = attendance[student._id] || 'absent';
                            
                            return (
                                <TableRow 
                                    key={student._id} 
                                    sx={{ 
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                        backgroundColor: currentStatus === 'present' 
                                            ? 'rgba(76, 175, 80, 0.08)' 
                                            : 'rgba(244, 67, 54, 0.08)'
                                    }}
                                >
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
                                                    onChange={(event) => {
                                                        const isChecked = event.target.checked;
                                                        const newStatus = isChecked ? 'present' : 'absent';
                                                        console.log('🎯 Switch toggled:', { 
                                                            studentId: student._id, 
                                                            isChecked, 
                                                            newStatus,
                                                            currentStatus 
                                                        });
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

            {/* Debug Information */}
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>Debug Information:</Typography>
                
                <Typography variant="subtitle2">Current State:</Typography>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', mb: 2 }}>
                    {JSON.stringify(attendance, null, 2)}
                </Typography>
                
                <Typography variant="subtitle2">Recent Changes:</Typography>
                <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                    {debugInfo.map((info, index) => (
                        <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            [{info.timestamp}] {info.message}
                        </Typography>
                    ))}
                </Box>
            </Paper>

            {/* Key Differences */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#e8f5e8' }}>
                <Typography variant="h6" gutterBottom>Key Fixes Applied:</Typography>
                <Typography variant="body2" component="div">
                    <ul>
                        <li><strong>Object State:</strong> Using regular object instead of Map for better React integration</li>
                        <li><strong>Proper Event Handling:</strong> Explicitly accessing event.target.checked</li>
                        <li><strong>Immutable Updates:</strong> Using spread operator for state updates</li>
                        <li><strong>Debug Logging:</strong> Added comprehensive logging to track state changes</li>
                        <li><strong>Key Props:</strong> Ensuring proper key props for React reconciliation</li>
                    </ul>
                </Typography>
            </Paper>
        </Box>
    );
};

export default FixedSwitchAttendance;