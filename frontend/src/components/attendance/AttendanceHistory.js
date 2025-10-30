import React, { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    Search as SearchIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { StyledTableCell, StyledTableRow } from '../styles';
import { BlueButton, RedButton, GreenButton } from '../buttonStyles';
import axios from 'axios';

const AttendanceHistory = ({ classId, subjectId, teacherId }) => {
    console.log('🔍 AttendanceHistory component props:', { classId, subjectId, teacherId });

    // State management
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    
    // Filter states
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        session: '',
        studentName: ''
    });
    
    // Edit dialog states
    const [editDialog, setEditDialog] = useState({
        open: false,
        record: null,
        newStatus: '',
        reason: ''
    });
    
    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        record: null
    });
    
    // Audit trail dialog
    const [auditDialog, setAuditDialog] = useState({
        open: false,
        record: null,
        auditLogs: []
    });
    
    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Available status options
    const statusOptions = ['present', 'absent', 'late', 'excused'];
    const sessionOptions = ['Lecture 1', 'Lecture 2', 'Lab 1', 'Tutorial 1'];

    // Fetch attendance records
    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching attendance records with params:', {
                classId,
                subjectId,
                page: page + 1,
                limit: rowsPerPage,
                filters
            });

            const queryParams = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
                classId,
                subjectId,
                ...filters
            });

            console.log('🌐 API URL:', `${process.env.REACT_APP_BASE_URL}/api/attendance/records?${queryParams}`);

            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/records?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            console.log('📡 API Response:', response.data);

            if (response.data.success) {
                const records = response.data.data?.records || [];
                const total = response.data.data?.pagination?.totalRecords || 0;
                
                console.log('✅ Setting records:', { recordsCount: records.length, total });
                
                setAttendanceRecords(records);
                setTotalRecords(total);
            } else {
                throw new Error(response.data.message || 'Failed to fetch records');
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            setNotification({
                open: true,
                message: error.response?.data?.message || 'Failed to load attendance records',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Load records on component mount and when filters change
    useEffect(() => {
        fetchAttendanceRecords();
    }, [page, rowsPerPage, filters, classId, subjectId]);

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0); // Reset to first page when filtering
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            status: '',
            session: '',
            studentName: ''
        });
    };

    // Handle edit record
    const handleEditRecord = (record) => {
        // Check if record can be edited (within time limit)
        const recordDate = new Date(record.date);
        const currentDate = new Date();
        const daysDifference = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 7) {
            setNotification({
                open: true,
                message: 'Records older than 7 days require admin approval to edit.',
                severity: 'warning'
            });
            return;
        }

        setEditDialog({
            open: true,
            record,
            newStatus: record.status,
            reason: ''
        });
    };

    // Submit edit
    const handleSubmitEdit = async () => {
        try {
            const response = await axios.put(
                `/api/attendance/${editDialog.record._id}`,
                {
                    status: editDialog.newStatus,
                    reason: editDialog.reason
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setNotification({
                    open: true,
                    message: 'Attendance record updated successfully',
                    severity: 'success'
                });
                fetchAttendanceRecords(); // Refresh the list
                setEditDialog({ open: false, record: null, newStatus: '', reason: '' });
            } else {
                throw new Error(response.data.message || 'Failed to update record');
            }
        } catch (error) {
            setNotification({
                open: true,
                message: error.response?.data?.message || 'Failed to update record',
                severity: 'error'
            });
        }
    };

    // Handle delete record
    const handleDeleteRecord = async () => {
        try {
            const response = await axios.delete(
                `/api/attendance/${deleteDialog.record._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setNotification({
                    open: true,
                    message: 'Attendance record deleted successfully',
                    severity: 'success'
                });
                fetchAttendanceRecords(); // Refresh the list
                setDeleteDialog({ open: false, record: null });
            } else {
                throw new Error(response.data.message || 'Failed to delete record');
            }
        } catch (error) {
            setNotification({
                open: true,
                message: error.response?.data?.message || 'Failed to delete record',
                severity: 'error'
            });
        }
    };

    // View audit trail
    const handleViewAuditTrail = async (record) => {
        try {
            const response = await axios.get(
                `/api/attendance/audit/${record._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setAuditDialog({
                    open: true,
                    record,
                    auditLogs: response.data.auditLogs
                });
            }
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to load audit trail',
                severity: 'error'
            });
        }
    };

    // Get status chip color
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'late': return 'warning';
            case 'excused': return 'info';
            default: return 'default';
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Box>
            {/* Header */}
            <Typography variant="h5" gutterBottom>
                Attendance History
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filters
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 150 }}
                    />
                    
                    <TextField
                        label="End Date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 150 }}
                    />
                    
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.status}
                            label="Status"
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Session</InputLabel>
                        <Select
                            value={filters.session}
                            label="Session"
                            onChange={(e) => handleFilterChange('session', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {sessionOptions.map(session => (
                                <MenuItem key={session} value={session}>
                                    {session}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField
                        label="Student Name"
                        value={filters.studentName}
                        onChange={(e) => handleFilterChange('studentName', e.target.value)}
                        size="small"
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                    />
                    
                    <Button onClick={clearFilters} variant="outlined" size="small">
                        Clear Filters
                    </Button>
                </Box>
            </Paper>

            {/* Records Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Session</StyledTableCell>
                                <StyledTableCell>Student</StyledTableCell>
                                <StyledTableCell>Roll No.</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                                <StyledTableCell>Marked By</StyledTableCell>
                                <StyledTableCell>Last Modified</StyledTableCell>
                                <StyledTableCell align="center">Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={8} align="center">
                                        <CircularProgress />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ) : attendanceRecords.length === 0 ? (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={8} align="center">
                                        No attendance records found
                                    </StyledTableCell>
                                </StyledTableRow>
                            ) : (
                                attendanceRecords.map((record) => (
                                    <StyledTableRow key={record._id}>
                                        <StyledTableCell>{formatDate(record.date)}</StyledTableCell>
                                        <StyledTableCell>{record.session}</StyledTableCell>
                                        <StyledTableCell>{record.studentId?.name || 'N/A'}</StyledTableCell>
                                        <StyledTableCell>{record.studentId?.rollNum || 'N/A'}</StyledTableCell>
                                        <StyledTableCell>
                                            <Chip
                                                label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                color={getStatusColor(record.status)}
                                                size="small"
                                            />
                                        </StyledTableCell>
                                        <StyledTableCell>{record.markedBy?.name || 'System'}</StyledTableCell>
                                        <StyledTableCell>
                                            {record.lastModifiedAt ? formatDate(record.lastModifiedAt) : 'Never'}
                                        </StyledTableCell>
                                        <StyledTableCell align="center">
                                            <Tooltip title="Edit Record">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditRecord(record)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Audit Trail">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewAuditTrail(record)}
                                                    color="info"
                                                >
                                                    <HistoryIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Record">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setDeleteDialog({ open: true, record })}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
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
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, record: null, newStatus: '', reason: '' })}>
                <DialogTitle>Edit Attendance Record</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Student: {editDialog.record?.studentId?.name} ({editDialog.record?.studentId?.rollNum})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Date: {editDialog.record && formatDate(editDialog.record.date)} - {editDialog.record?.session}
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                            <InputLabel>New Status</InputLabel>
                            <Select
                                value={editDialog.newStatus}
                                label="New Status"
                                onChange={(e) => setEditDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                            >
                                {statusOptions.map(status => (
                                    <MenuItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            label="Reason for Change"
                            multiline
                            rows={3}
                            value={editDialog.reason}
                            onChange={(e) => setEditDialog(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Please provide a reason for this change..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, record: null, newStatus: '', reason: '' })}>
                        Cancel
                    </Button>
                    <GreenButton onClick={handleSubmitEdit} disabled={!editDialog.newStatus || !editDialog.reason}>
                        Update Record
                    </GreenButton>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, record: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this attendance record?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Student: {deleteDialog.record?.studentId?.name} ({deleteDialog.record?.studentId?.rollNum})
                        <br />
                        Date: {deleteDialog.record && formatDate(deleteDialog.record.date)} - {deleteDialog.record?.session}
                        <br />
                        Status: {deleteDialog.record?.status}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, record: null })}>
                        Cancel
                    </Button>
                    <RedButton onClick={handleDeleteRecord}>
                        Delete
                    </RedButton>
                </DialogActions>
            </Dialog>

            {/* Audit Trail Dialog */}
            <Dialog 
                open={auditDialog.open} 
                onClose={() => setAuditDialog({ open: false, record: null, auditLogs: [] })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Audit Trail</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Record: {auditDialog.record?.studentId?.name} - {auditDialog.record && formatDate(auditDialog.record.date)}
                    </Typography>
                    
                    {auditDialog.auditLogs.length === 0 ? (
                        <Typography>No audit logs found for this record.</Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Date</StyledTableCell>
                                    <StyledTableCell>Action</StyledTableCell>
                                    <StyledTableCell>User</StyledTableCell>
                                    <StyledTableCell>Changes</StyledTableCell>
                                    <StyledTableCell>Reason</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {auditDialog.auditLogs.map((log, index) => (
                                    <StyledTableRow key={index}>
                                        <StyledTableCell>{formatDate(log.performedAt)}</StyledTableCell>
                                        <StyledTableCell>{log.action}</StyledTableCell>
                                        <StyledTableCell>{log.performedBy?.name || 'System'}</StyledTableCell>
                                        <StyledTableCell>
                                            {log.oldValues?.status} → {log.newValues?.status}
                                        </StyledTableCell>
                                        <StyledTableCell>{log.reason || 'N/A'}</StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAuditDialog({ open: false, record: null, auditLogs: [] })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setNotification({ ...notification, open: false })} 
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceHistory;