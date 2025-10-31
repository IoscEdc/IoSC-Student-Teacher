import React, { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    FormControlLabel,
    Radio,
    RadioGroup,
    Typography,
    Box,
    Button,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import { StyledTableCell, StyledTableRow } from '../styles';
import { BlueButton, GreenButton, PurpleButton } from '../buttonStyles';

const AttendanceMarkingGrid = ({ 
    students = [], 
    onAttendanceChange, 
    onSubmit, 
    loading = false,
    disabled = false,
    initialAttendance = {}
}) => {
    const [attendance, setAttendance] = useState({});

    // Initialize attendance state
    useEffect(() => {
        if (students.length > 0) {
            const initialState = {};
            students.forEach(student => {
                const studentId = student.studentId || student._id;
                initialState[studentId] = initialAttendance[studentId] || 'present';
            });
            setAttendance(initialState);
        }
    }, [students, initialAttendance]);

    // Notify parent component of attendance changes
    useEffect(() => {
        if (onAttendanceChange) {
            onAttendanceChange(attendance);
        }
    }, [attendance, onAttendanceChange]);

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };



    const getAttendanceSummary = () => {
        const summary = {
            present: 0,
            absent: 0
        };

        Object.values(attendance).forEach(status => {
            if (summary.hasOwnProperty(status)) {
                summary[status]++;
            }
        });

        return summary;
    };

    const summary = getAttendanceSummary();
    const totalStudents = students.length;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading students...</Typography>
            </Box>
        );
    }

    if (students.length === 0) {
        return (
            <Alert severity="info">
                No students found for this class. Please ensure students are enrolled.
            </Alert>
        );
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {/* Bulk Actions */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom>
                    Mark Attendance ({totalStudents} students)
                </Typography>
                


                {/* Summary */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                        label={`Present: ${summary.present}`} 
                        color="success" 
                        size="small" 
                    />
                    <Chip 
                        label={`Absent: ${summary.absent}`} 
                        color="error" 
                        size="small" 
                    />
                </Box>
            </Box>

            {/* Students Table */}
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>Student</StyledTableCell>
                            <StyledTableCell>University ID</StyledTableCell>
                            <StyledTableCell align="center">Attendance Status</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => {
                            const studentId = student.studentId || student._id;
                            return (
                            <StyledTableRow key={studentId}>
                                <StyledTableCell>
                                    <Typography variant="body2" fontWeight="bold" component="span">
                                        {student.rollNum}
                                    </Typography>
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                        - {student.name}
                                    </Typography>
                                </StyledTableCell>
                                <StyledTableCell>
                                    {student.universityId || 'N/A'}
                                </StyledTableCell>
                                <StyledTableCell align="center">
                                    <RadioGroup
                                        row
                                        value={attendance[studentId] || 'present'}
                                        onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                                    >
                                        <FormControlLabel
                                            value="present"
                                            control={
                                                <Radio 
                                                    size="small" 
                                                    sx={{
                                                        color: '#4CAF50',
                                                        '&.Mui-checked': {
                                                            color: '#4CAF50',
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                                        }
                                                    }}
                                                />
                                            }
                                            label="Present"
                                            disabled={disabled}
                                            sx={{
                                                '& .MuiFormControlLabel-label': {
                                                    color: attendance[studentId] === 'present' ? '#4CAF50' : 'inherit',
                                                    fontWeight: attendance[studentId] === 'present' ? 'bold' : 'normal'
                                                }
                                            }}
                                        />
                                        <FormControlLabel
                                            value="absent"
                                            control={
                                                <Radio 
                                                    size="small" 
                                                    sx={{
                                                        color: '#F44336',
                                                        '&.Mui-checked': {
                                                            color: '#F44336',
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                                        }
                                                    }}
                                                />
                                            }
                                            label="Absent"
                                            disabled={disabled}
                                            sx={{
                                                '& .MuiFormControlLabel-label': {
                                                    color: attendance[studentId] === 'absent' ? '#F44336' : 'inherit',
                                                    fontWeight: attendance[studentId] === 'absent' ? 'bold' : 'normal'
                                                }
                                            }}
                                        />
                                    </RadioGroup>
                                </StyledTableCell>
                            </StyledTableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Submit Button */}
            {onSubmit && (
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
                    <GreenButton
                        variant="contained"
                        onClick={() => onSubmit(attendance, summary)}
                        disabled={disabled || loading}
                        size="large"
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Attendance'}
                    </GreenButton>
                </Box>
            )}
        </Paper>
    );
};

export default AttendanceMarkingGrid;