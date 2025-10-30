import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Paper,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    LinearProgress,
    Chip,
    Modal,
    Backdrop,
    Fade,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Avatar,
    Divider
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import useStudentAttendance from '../../hooks/useStudentAttendance';
import AttendanceChartSimple from './AttendanceChartSimple';
import useStudentAttendanceSimple from '../../hooks/useStudentAttendanceSimple';

const AttendanceDashboardSimple = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const { currentUser } = useSelector((state) => state.user);

    // Use the new attendance API hook
    const {
        attendanceData,
        loading,
        error,
        lastUpdated,
        refreshAttendance
    } = useStudentAttendance(currentUser?._id);

    const handleManualRefresh = () => {
        refreshAttendance();
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedSubject(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'present':
                return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />;
            case 'absent':
                return <CancelIcon sx={{ color: '#f44336', fontSize: '1.2rem' }} />;
            case 'late':
                return <CheckCircleIcon sx={{ color: '#ff9800', fontSize: '1.2rem' }} />;
            case 'excused':
                return <CheckCircleIcon sx={{ color: '#2196f3', fontSize: '1.2rem' }} />;
            default:
                return <CancelIcon sx={{ color: '#9e9e9e', fontSize: '1.2rem' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'present':
                return '#4caf50';
            case 'absent':
                return '#f44336';
            case 'late':
                return '#ff9800';
            case 'excused':
                return '#2196f3';
            default:
                return '#9e9e9e';
        }
    };

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 85) return { color: '#4caf50', status: 'Excellent', icon: <TrendingUpIcon /> };
        if (percentage >= 75) return { color: '#ff9800', status: 'Good', icon: <TrendingUpIcon /> };
        if (percentage >= 65) return { color: '#f44336', status: 'Warning', icon: <TrendingDownIcon /> };
        return { color: '#d32f2f', status: 'Critical', icon: <TrendingDownIcon /> };
    };

    const getAttendanceGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 85) return 'A';
        if (percentage >= 80) return 'B+';
        if (percentage >= 75) return 'B';
        if (percentage >= 70) return 'C+';
        if (percentage >= 65) return 'C';
        return 'F';
    };

    const overallPercentage = attendanceData?.overallPercentage || 0;
    const subjects = attendanceData?.subjects || [];
    const overallStatus = getAttendanceStatus(overallPercentage);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                Error loading attendance data: {error}
            </Alert>
        );
    }

    if (!subjects.length) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    No attendance data available yet.
                </Alert>

                {/* Debug Information */}
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                        Debug Information
                    </Typography>
                    <Typography variant="body2" component="div">
                        <strong>Student ID:</strong> {currentUser?._id || 'Not available'}<br />
                        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}<br />
                        <strong>Error:</strong> {error || 'None'}<br />
                        <strong>Raw Data:</strong> {JSON.stringify(attendanceData, null, 2)}<br />
                        <strong>Last Updated:</strong> {lastUpdated ? lastUpdated.toString() : 'Never'}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleManualRefresh}
                        sx={{ mt: 2 }}
                        startIcon={<RefreshIcon />}
                    >
                        Retry Loading Data
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    sx={{ fontWeight: 'bold' }}
                >
                    Attendance Dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                    </Typography>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={handleManualRefresh} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Overall Attendance Summary */}
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    background: `linear-gradient(135deg, ${overallStatus.color}20, ${overallStatus.color}10)`,
                    border: `2px solid ${overallStatus.color}30`,
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                Overall Attendance
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    color: overallStatus.color,
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '2.5rem' : '3.5rem',
                                }}
                            >
                                {overallPercentage.toFixed(1)}%
                            </Typography>
                            <Chip
                                label={`Grade: ${getAttendanceGrade(overallPercentage)}`}
                                sx={{
                                    backgroundColor: overallStatus.color,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    mt: 1
                                }}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Statistics
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
                                        <Typography variant="h4" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            {attendanceData?.totalPresent || 0}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'success.contrastText' }}>
                                            Present
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: 'error.light' }}>
                                        <Typography variant="h4" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                                            {(attendanceData?.totalSessions || 0) - (attendanceData?.totalPresent || 0)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'error.contrastText' }}>
                                            Absent
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Subject-wise Attendance Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {subjects.map((subject, index) => {
                    const status = getAttendanceStatus(subject.percentage);
                    const grade = getAttendanceGrade(subject.percentage);
                    return (
                        <Grid item xs={12} sm={6} md={4} key={subject.subjectId || index}>
                            <Card
                                elevation={2}
                                onClick={() => handleSubjectClick(subject)}
                                sx={{
                                    height: '100%',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {subject.subject}
                                    </Typography>

                                    {/* Teacher Information */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: status.color }}>
                                            <PersonIcon sx={{ fontSize: '0.8rem' }} />
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            {subject.teacher?.name || 'Teacher Not Assigned'}
                                        </Typography>
                                    </Box>

                                    <Typography variant="h4" sx={{ color: status.color, fontWeight: 'bold', mb: 1 }}>
                                        {subject.percentage.toFixed(1)}%
                                    </Typography>

                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(subject.percentage, 100)}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            mb: 2,
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: status.color,
                                            }
                                        }}
                                    />

                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" align="center">
                                                Present: {subject.present}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" align="center">
                                                Total: {subject.total}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Simple Chart */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Attendance Visualization
                </Typography>
                <AttendanceChartSimple data={subjects} type="bar" />
            </Paper>

            {/* Subject Detail Modal */}
            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={modalOpen}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: isMobile ? '95%' : '80%',
                            maxWidth: '800px',
                            maxHeight: '90vh',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 24,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {selectedSubject && (
                            <>
                                {/* Modal Header */}
                                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                {selectedSubject.subject}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: getAttendanceStatus(selectedSubject.percentage).color }}>
                                                    <PersonIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                                        {selectedSubject.teacher?.name || 'Teacher Not Assigned'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Subject Teacher
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <IconButton onClick={handleCloseModal} sx={{ ml: 2 }}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>

                                    {/* Attendance Summary */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                                <Typography variant="h6" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.present}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'success.contrastText' }}>
                                                    Present
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                                                <Typography variant="h6" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.absent}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'error.contrastText' }}>
                                                    Absent
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                                                <Typography variant="h6" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.total}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
                                                    Total Classes
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    bgcolor: getAttendanceStatus(selectedSubject.percentage).color,
                                                    color: 'white'
                                                }}
                                            >
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {selectedSubject.percentage.toFixed(1)}%
                                                </Typography>
                                                <Typography variant="caption">
                                                    Attendance
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Modal Content - Attendance Records */}
                                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarIcon />
                                        Attendance Records
                                    </Typography>

                                    {selectedSubject.records && selectedSubject.records.length > 0 ? (
                                        <TableContainer component={Paper} elevation={1}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Day</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedSubject.records.map((record, index) => (
                                                        <TableRow
                                                            key={index}
                                                            sx={{
                                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                                '&:hover': { bgcolor: 'action.selected' }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {formatDate(record.date)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={record.session}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {getStatusIcon(record.status)}
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: getStatusColor(record.status),
                                                                            fontWeight: 'medium',
                                                                            textTransform: 'capitalize'
                                                                        }}
                                                                    >
                                                                        {record.status}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                                            <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                No Records Found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                No attendance records available for this subject yet.
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>

                                {/* Modal Footer */}
                                <Divider />
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={handleCloseModal} variant="contained">
                                        Close
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
};

export default AttendanceDashboardSimple;