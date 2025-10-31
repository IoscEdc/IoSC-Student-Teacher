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
    ToggleButton,
    ToggleButtonGroup,
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
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ShowChart as LineChartIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import AttendanceChart from './AttendanceChart';
import useStudentAttendance from '../../hooks/useStudentAttendance';
import { testAuthAndAPI, testAttendanceAPI } from '../../utils/testAuth';

const AttendanceDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [chartType, setChartType] = useState('bar');
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

    const handleTestAuth = async () => {
        console.log('🧪 Running authentication and API tests...');
        const authResult = await testAuthAndAPI();
        if (authResult) {
            const apiResult = await testAttendanceAPI(currentUser?._id);
            if (apiResult) {
                console.log('🎉 All tests passed! API should be working.');
            }
        }
    };

    const handleChartTypeChange = (event, newChartType) => {
        if (newChartType !== null) {
            setChartType(newChartType);
        }
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
            <Box sx={{ m: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading attendance data: {error}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleManualRefresh}
                        startIcon={<RefreshIcon />}
                    >
                        Retry Loading Data
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleTestAuth}
                        color="secondary"
                    >
                        Test Auth & API
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!subjects.length) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    No attendance data available yet.
                </Alert>
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
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background decoration */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: `${overallStatus.color}10`,
                        zIndex: 0
                    }}
                />
                
                <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {overallStatus.icon}
                                Overall Attendance
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    color: overallStatus.color,
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '2.5rem' : '3.5rem',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                                    fontSize: '1rem',
                                    mt: 1
                                }}
                            />
                            <Typography
                                variant="subtitle1"
                                sx={{ color: overallStatus.color, fontWeight: 'medium', mt: 1 }}
                            >
                                {overallStatus.status}
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom color="text.primary">
                                Progress to Goal
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={Math.min(overallPercentage, 100)}
                                    size={120}
                                    thickness={6}
                                    sx={{
                                        color: overallStatus.color,
                                        '& .MuiCircularProgress-circle': {
                                            strokeLinecap: 'round',
                                        }
                                    }}
                                />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Typography variant="h6" component="div" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                        {overallPercentage.toFixed(0)}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        of 75% goal
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min((overallPercentage / 75) * 100, 100)}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: overallStatus.color,
                                        borderRadius: 4
                                    }
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {overallPercentage >= 75 ? '✅ Goal Achieved!' : `${(75 - overallPercentage).toFixed(1)}% to reach goal`}
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Typography variant="h6" gutterBottom color="text.primary">
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
                                <Grid item xs={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.light' }}>
                                        <Typography variant="h4" sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                            {subjects.length}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'primary.contrastText' }}>
                                            Subjects
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.light' }}>
                                        <Typography variant="h4" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            {attendanceData?.totalSessions || 0}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
                                            Total Classes
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
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: `linear-gradient(135deg, ${status.color}08, ${status.color}04)`,
                                    border: `1px solid ${status.color}30`,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                {/* Grade badge */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        backgroundColor: status.color,
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        zIndex: 2
                                    }}
                                >
                                    {grade}
                                </Box>

                                <CardContent sx={{ pb: 2 }}>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{
                                            fontSize: isMobile ? '1rem' : '1.25rem',
                                            fontWeight: 'bold',
                                            color: 'text.primary',
                                            pr: 6 // Make room for grade badge
                                        }}
                                    >
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

                                    {/* Circular progress for percentage */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                                            <CircularProgress
                                                variant="determinate"
                                                value={Math.min(subject.percentage, 100)}
                                                size={60}
                                                thickness={6}
                                                sx={{
                                                    color: status.color,
                                                    '& .MuiCircularProgress-circle': {
                                                        strokeLinecap: 'round',
                                                    }
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    top: 0,
                                                    left: 0,
                                                    bottom: 0,
                                                    right: 0,
                                                    position: 'absolute',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Typography variant="caption" component="div" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                                    {subject.percentage.toFixed(0)}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    color: status.color,
                                                    fontWeight: 'bold',
                                                    fontSize: isMobile ? '1.25rem' : '1.5rem'
                                                }}
                                            >
                                                {subject.percentage.toFixed(1)}%
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {status.icon}
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: status.color, fontWeight: 'medium' }}
                                                >
                                                    {status.status}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Progress bar */}
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(subject.percentage, 100)}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: 'grey.200',
                                            mb: 2,
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: status.color,
                                                borderRadius: 3
                                            }
                                        }}
                                    />

                                    {/* Statistics */}
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Paper elevation={0} sx={{ p: 1, textAlign: 'center', backgroundColor: 'success.light', borderRadius: 1 }}>
                                                <Typography variant="h6" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                                    {subject.present}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'success.contrastText' }}>
                                                    Present
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper elevation={0} sx={{ p: 1, textAlign: 'center', backgroundColor: 'error.light', borderRadius: 1 }}>
                                                <Typography variant="h6" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                                                    {subject.absent}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'error.contrastText' }}>
                                                    Absent
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Classes: <strong>{subject.total}</strong>
                                        </Typography>
                                        {subject.percentage < 75 && (
                                            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                                                ⚠️ Need {Math.ceil((75 * subject.total - 100 * subject.present) / 25)} more classes
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Attendance Chart */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Attendance Visualization
                    </Typography>
                    
                    <ToggleButtonGroup
                        value={chartType}
                        exclusive
                        onChange={handleChartTypeChange}
                        size="small"
                        sx={{ display: isMobile ? 'none' : 'flex' }}
                    >
                        <ToggleButton value="bar" aria-label="bar chart">
                            <Tooltip title="Bar Chart">
                                <BarChartIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="pie" aria-label="pie chart">
                            <Tooltip title="Pie Chart">
                                <PieChartIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="line" aria-label="line chart">
                            <Tooltip title="Line Chart">
                                <LineChartIcon />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Mobile chart type selector */}
                {isMobile && (
                    <Box sx={{ mb: 2 }}>
                        <ToggleButtonGroup
                            value={chartType}
                            exclusive
                            onChange={handleChartTypeChange}
                            size="small"
                            fullWidth
                        >
                            <ToggleButton value="bar">Bar</ToggleButton>
                            <ToggleButton value="pie">Pie</ToggleButton>
                            <ToggleButton value="line">Line</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}

                <AttendanceChart data={subjects} type={chartType} />
                
                {/* Chart insights */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        📊 Insights:
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Best Subject: <strong>{subjects.length > 0 ? subjects.reduce((prev, current) => (prev.percentage > current.percentage) ? prev : current).subject : 'N/A'}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Needs Attention: <strong>{subjects.filter(s => s.percentage < 75).length} subjects</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Average: <strong>{subjects.length > 0 ? (subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length).toFixed(1) : 0}%</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Goal Achievement: <strong>{subjects.filter(s => s.percentage >= 75).length}/{subjects.length} subjects</strong>
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
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
                                <Box
                                    sx={{
                                        p: 3,
                                        background: `linear-gradient(135deg, ${getAttendanceStatus(selectedSubject.percentage).color}20, ${getAttendanceStatus(selectedSubject.percentage).color}10)`,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
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
                                        <Grid item xs={6} sm={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                                <Typography variant="h6" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.present}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'success.contrastText' }}>
                                                    Present
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                                                <Typography variant="h6" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.absent}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'error.contrastText' }}>
                                                    Absent
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                                                <Typography variant="h6" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                                    {selectedSubject.total}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
                                                    Total Classes
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
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

export default AttendanceDashboard;