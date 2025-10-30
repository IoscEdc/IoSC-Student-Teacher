import React, { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Box,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    TextField
} from '@mui/material';
import { StyledTableCell, StyledTableRow } from '../styles';
import axios from 'axios';

const SimpleAttendanceHistory = ({ classId, subjectId, teacherId }) => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);
    const [dateFilter, setDateFilter] = useState('');



    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            setError('');

            if (!classId || !subjectId) {
                setError('Missing class ID or subject ID');
                return;
            }

            const params = {
                page: page + 1,
                limit: rowsPerPage,
                classId,
                subjectId,
                sortBy: 'date',
                sortOrder: 'desc'
            };

            if (dateFilter) {
                params.startDate = dateFilter;
                params.endDate = dateFilter;
            }

            const queryString = new URLSearchParams(params).toString();
            const url = `${process.env.REACT_APP_BASE_URL}/attendance-fallback/test-records?${queryString}`;
            
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                const records = response.data.data?.records || [];
                const total = response.data.data?.pagination?.totalRecords || 0;
                
                setAttendanceRecords(records);
                setTotalRecords(total);
            } else {
                setError(response.data.message || 'Failed to fetch records');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceRecords();
    }, [page, rowsPerPage, classId, subjectId, dateFilter]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'late': return 'warning';
            case 'excused': return 'info';
            default: return 'default';
        }
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading attendance records... (classId: {classId}, subjectId: {subjectId})</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <br />
                <Typography variant="caption">
                    Debug: classId={classId}, subjectId={subjectId}
                </Typography>
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Attendance History
            </Typography>

            {/* Date Filter */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    label="Filter by Date"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ mr: 2 }}
                />
                {dateFilter && (
                    <Typography variant="caption" color="text.secondary">
                        Showing records for {formatDate(dateFilter)}
                    </Typography>
                )}
            </Box>

            {/* Summary */}
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Records: {totalRecords} | Showing: {attendanceRecords.length}
            </Typography>

            {/* Records Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Roll No.</StyledTableCell>
                                <StyledTableCell>Student Name</StyledTableCell>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Session</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                                <StyledTableCell>Marked By</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendanceRecords.length === 0 ? (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                            No attendance records found
                                            {dateFilter && ` for ${formatDate(dateFilter)}`}
                                        </Typography>
                                    </StyledTableCell>
                                </StyledTableRow>
                            ) : (
                                attendanceRecords.map((record, index) => (
                                    <StyledTableRow key={record._id || index}>
                                        <StyledTableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {record.studentId?.rollNum || 'N/A'}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant="body2">
                                                {record.studentId?.name || 'Unknown Student'}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant="body2">
                                                {formatDate(record.date)}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant="body2">
                                                {record.session || 'N/A'}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Chip
                                                label={record.status?.toUpperCase() || 'UNKNOWN'}
                                                color={getStatusColor(record.status)}
                                                size="small"
                                                variant="filled"
                                            />
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {record.teacherId?.name || record.markedBy?.name || 'System'}
                                            </Typography>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {totalRecords > rowsPerPage && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={totalRecords}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(event, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                    />
                )}
            </Paper>

            {/* Debug Info */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Debug Info: Records loaded: {attendanceRecords.length}, Total: {totalRecords}, 
                    ClassId: {classId}, SubjectId: {subjectId}
                </Typography>
            </Box>
        </Box>
    );
};

export default SimpleAttendanceHistory;