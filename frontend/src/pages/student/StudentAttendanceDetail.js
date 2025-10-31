import React, { useEffect, useState } from 'react';
import {
    Box,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    useTheme,
    CircularProgress,
    Alert,
    Fab,
    Zoom,
    Typography
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    CalendarMonth as CalendarIcon,
    Subject as SubjectIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import useStudentAttendance from '../../hooks/useStudentAttendance';
import AttendanceDashboard from '../../components/attendance/AttendanceDashboard';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import SubjectAttendanceDetail from '../../components/attendance/SubjectAttendanceDetail';

const StudentAttendanceDetail = () => {
    const theme = useTheme();

    const { currentUser } = useSelector((state) => state.user);
    const [selectedView, setSelectedView] = useState('dashboard');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Use the new attendance API hook
    const {
        attendanceData,
        loading,
        error,
        refreshAttendance
    } = useStudentAttendance(currentUser?._id);

    const subjects = attendanceData?.subjects || [];

    useEffect(() => {
        // Set first subject as default if none selected
        if (!selectedSubject && subjects.length > 0) {
            setSelectedSubject(subjects[0]);
        }
    }, [subjects, selectedSubject]);

    // Handle scroll to top functionality
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleViewChange = (_, newView) => {
        if (newView !== null) {
            setSelectedView(newView);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const renderContent = () => {
        switch (selectedView) {
            case 'dashboard':
                return (
                    <AttendanceDashboard 
                        attendanceData={attendanceData}
                        subjects={subjects}
                        onRefresh={refreshAttendance}
                    />
                );

            case 'calendar':
                return (
                    <AttendanceCalendar
                        attendanceData={attendanceData?.subjects || []}
                        subjects={subjects}
                    />
                );

            case 'subject':
                return (
                    <Box>
                        {/* Subject Selection */}
                        {subjects.length > 1 && (
                            <Box sx={{ p: 2, mb: 2 }}>
                                <Paper elevation={2} sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Select Subject
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {subjects.map((subject) => (
                                            <Paper
                                                key={subject.subjectId}
                                                elevation={selectedSubject?.subjectId === subject.subjectId ? 3 : 1}
                                                sx={{
                                                    p: 1.5,
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedSubject?.subjectId === subject.subjectId
                                                        ? 'primary.light'
                                                        : 'background.paper',
                                                    color: selectedSubject?.subjectId === subject.subjectId
                                                        ? 'primary.contrastText'
                                                        : 'text.primary',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: 2
                                                    }
                                                }}
                                                onClick={() => setSelectedSubject(subject)}
                                            >
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        {subject.subject}
                                                    </Box>
                                                    <Box sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                        {(subject.percentage || 0).toFixed(1)}%
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Paper>
                            </Box>
                        )}

                        {/* Subject Detail */}
                        {selectedSubject ? (
                            <SubjectAttendanceDetail
                                subjectData={selectedSubject}
                                attendanceRecords={selectedSubject.records || []}
                            />
                        ) : subjects.length === 1 ? (
                            <SubjectAttendanceDetail
                                subjectData={subjects[0]}
                                attendanceRecords={subjects[0].records || []}
                            />
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    Please select a subject to view detailed attendance
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );

            default:
                return (
                    <AttendanceDashboard 
                        attendanceData={attendanceData}
                        subjects={subjects}
                        onRefresh={refreshAttendance}
                    />
                );
        }
    };

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

    if (!attendanceData?.subjects || attendanceData.subjects.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    <Typography variant="h6" gutterBottom>
                        No attendance data available yet
                    </Typography>
                    <Typography variant="body2">
                        Your attendance records will appear here once your teachers start marking attendance for your classes.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            {renderContent()}

            {/* Bottom Navigation */}
            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000
                }}
                elevation={3}
            >
                <BottomNavigation
                    value={selectedView}
                    onChange={handleViewChange}
                    showLabels
                >
                    <BottomNavigationAction
                        label="Dashboard"
                        value="dashboard"
                        icon={<DashboardIcon />}
                    />
                    <BottomNavigationAction
                        label="Calendar"
                        value="calendar"
                        icon={<CalendarIcon />}
                    />
                    <BottomNavigationAction
                        label="Subjects"
                        value="subject"
                        icon={<SubjectIcon />}
                    />
                </BottomNavigation>
            </Paper>

            {/* Scroll to Top FAB */}
            <Zoom in={showScrollTop}>
                <Fab
                    color="primary"
                    size="small"
                    onClick={scrollToTop}
                    sx={{
                        position: 'fixed',
                        bottom: 80,
                        right: 16,
                        zIndex: 1000
                    }}
                >
                    <KeyboardArrowUpIcon />
                </Fab>
            </Zoom>
        </Box>
    );
};

export default StudentAttendanceDetail;