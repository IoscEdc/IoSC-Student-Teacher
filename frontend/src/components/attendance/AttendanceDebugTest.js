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
    Checkbox,
    styled
} from '@mui/material';

// Styled components for better visual feedback
const StyledCheckbox = styled(Checkbox)(({ theme, attendanceType }) => ({
    '&.Mui-checked': {
        color: attendanceType === 'present' ? '#4CAF50' : '#F44336',
    },
    '&:hover': {
        backgroundColor: attendanceType === 'present' ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)',
    }
}));

const AttendanceDebugTest = () => {
    // Test data
    const testStudents = [
        { _id: '1', rollNum: '21AI001', name: 'John Doe' },
        { _id: '2', rollNum: '21AI002', name: 'Jane Smith' },
        { _id: '3', rollNum: '21AI003', name: 'Bob Johnson' }
    ];

    const [attendance, setAttendance] = useState({
        '1': 'present',
        '2': 'present', 
        '3': 'present'
    });

    const handleAttendanceChange = (studentId, status) => {
        console.log(`DEBUG: Changing student ${studentId} to ${status}`);
        setAttendance(prev => {
            const newState = {
                ...prev,
                [studentId]: status
            };
            console.log('DEBUG: New attendance state:', newState);
            return newState;
        });
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
                Attendance Debug Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Summary: Present: {summary.present}, Absent: {summary.absent}
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell align="center">Present</TableCell>
                            <TableCell align="center">Absent</TableCell>
                            <TableCell>Current Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {testStudents.map((student) => (
                            <TableRow key={student._id}>
                                <TableCell>
                                    <Typography variant="body1" fontWeight="bold" component="span">
                                        {student.rollNum}
                                    </Typography>
                                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                                        - {student.name}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <StyledCheckbox
                                        attendanceType="present"
                                        checked={attendance[student._id] === 'present'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleAttendanceChange(student._id, 'present');
                                            }
                                        }}
                                        size="large"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <StyledCheckbox
                                        attendanceType="absent"
                                        checked={attendance[student._id] === 'absent'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleAttendanceChange(student._id, 'absent');
                                            }
                                        }}
                                        size="large"
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

            <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Debug Info:</Typography>
                <pre>{JSON.stringify(attendance, null, 2)}</pre>
            </Box>
        </Box>
    );
};

export default AttendanceDebugTest;