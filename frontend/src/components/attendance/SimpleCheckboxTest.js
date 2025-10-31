import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox
} from '@mui/material';

const SimpleCheckboxTest = () => {
    // Test with 3 students
    const testStudents = [
        { _id: 'student1', rollNum: '21AI001', name: 'John Doe' },
        { _id: 'student2', rollNum: '21AI002', name: 'Jane Smith' },
        { _id: 'student3', rollNum: '21AI003', name: 'Bob Johnson' }
    ];

    // Initialize all as present
    const [attendance, setAttendance] = useState({
        'student1': 'present',
        'student2': 'present',
        'student3': 'present'
    });

    const handleAttendanceChange = (studentId, status) => {
        console.log(`🔄 Changing student ${studentId} to ${status}`);
        setAttendance(prev => {
            const newState = { ...prev, [studentId]: status };
            console.log('📊 New attendance state:', newState);
            return newState;
        });
    };

    // Calculate summary
    const summary = { present: 0, absent: 0 };
    Object.values(attendance).forEach(status => {
        summary[status]++;
    });

    console.log('🧮 Current summary:', summary);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Simple Checkbox Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Present: {summary.present} | Absent: {summary.absent}
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell align="center">Present</TableCell>
                            <TableCell align="center">Absent</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {testStudents.map((student) => (
                            <TableRow key={student._id}>
                                <TableCell>
                                    <strong>{student.rollNum}</strong> - {student.name}
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={attendance[student._id] === 'present'}
                                        onChange={(e) => {
                                            console.log(`✅ Present checkbox clicked for ${student._id}, checked: ${e.target.checked}`);
                                            if (e.target.checked) {
                                                handleAttendanceChange(student._id, 'present');
                                            }
                                        }}
                                        sx={{
                                            color: '#4CAF50',
                                            '&.Mui-checked': { color: '#4CAF50' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={attendance[student._id] === 'absent'}
                                        onChange={(e) => {
                                            console.log(`❌ Absent checkbox clicked for ${student._id}, checked: ${e.target.checked}`);
                                            if (e.target.checked) {
                                                handleAttendanceChange(student._id, 'absent');
                                            }
                                        }}
                                        sx={{
                                            color: '#F44336',
                                            '&.Mui-checked': { color: '#F44336' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography 
                                        sx={{ 
                                            color: attendance[student._id] === 'present' ? '#4CAF50' : '#F44336',
                                            fontWeight: 'bold'
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

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">Debug Info:</Typography>
                <pre style={{ fontSize: '12px' }}>
                    {JSON.stringify(attendance, null, 2)}
                </pre>
            </Box>
        </Box>
    );
};

export default SimpleCheckboxTest;