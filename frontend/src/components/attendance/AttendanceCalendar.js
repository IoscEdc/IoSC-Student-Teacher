import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Grid,
    Chip,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Today as TodayIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

const AttendanceCalendar = ({ attendanceData, subjects }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSubject, setSelectedSubject] = useState('all');
    
    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Process attendance data for calendar display
    const calendarData = useMemo(() => {
        if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) return {};
        
        const data = {};
        
        attendanceData.forEach(subject => {
            if (!subject) return;
            if (selectedSubject !== 'all' && subject.subjectId !== selectedSubject) return;
            
            if (subject.records && subject.records.length > 0) {
                subject.records.forEach(record => {
                    const date = new Date(record.date);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    
                    if (!data[dateKey]) {
                        data[dateKey] = [];
                    }
                    
                    data[dateKey].push({
                        subject: subject.subject,
                        subjectId: subject.subjectId,
                        status: record.status,
                        session: record.session
                    });
                });
            }
        });
        
        return data;
    }, [attendanceData, selectedSubject]);
    
    // Get days in month
    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };
    
    // Navigate months
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };
    
    // Go to today
    const goToToday = () => {
        setCurrentDate(new Date());
    };
    
    // Get attendance status for a specific date
    const getDateAttendance = (day) => {
        const dateKey = `${currentYear}-${currentMonth}-${day}`;
        return calendarData[dateKey] || [];
    };
    
    // Get status color
    const getStatusColor = (status) => {
        const isPresent = status === 'present' || status === 'Present';
        return isPresent ? 'success' : 'error';
    };
    
    // Get status icon
    const getStatusIcon = (status) => {
        const isPresent = status === 'present' || status === 'Present';
        return isPresent ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />;
    };
    
    // Render calendar days
    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <Grid item xs key={`empty-${i}`}>
                    <Box sx={{ height: isMobile ? 60 : 80 }} />
                </Grid>
            );
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const attendance = getDateAttendance(day);
            const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
            
            days.push(
                <Grid item xs key={day}>
                    <Card
                        sx={{
                            height: isMobile ? 60 : 80,
                            border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                            backgroundColor: isToday ? 'primary.light' : 'background.paper',
                            cursor: attendance.length > 0 ? 'pointer' : 'default',
                            '&:hover': attendance.length > 0 ? {
                                boxShadow: 2,
                                transform: 'translateY(-1px)'
                            } : {}
                        }}
                    >
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: isToday ? 'bold' : 'normal',
                                        color: isToday ? 'primary.contrastText' : 'text.primary',
                                        mb: 0.5
                                    }}
                                >
                                    {day}
                                </Typography>
                                
                                {attendance.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                        {attendance.slice(0, isMobile ? 2 : 3).map((record, index) => (
                                            <Tooltip
                                                key={index}
                                                title={`${record.subject} - ${record.session}: ${record.status}`}
                                                arrow
                                            >
                                                <Chip
                                                    size="small"
                                                    icon={getStatusIcon(record.status)}
                                                    label={isMobile ? '' : record.subject.substring(0, 3)}
                                                    color={getStatusColor(record.status)}
                                                    sx={{
                                                        height: 16,
                                                        fontSize: '0.6rem',
                                                        '& .MuiChip-label': {
                                                            px: 0.5
                                                        }
                                                    }}
                                                />
                                            </Tooltip>
                                        ))}
                                        {attendance.length > (isMobile ? 2 : 3) && (
                                            <Chip
                                                size="small"
                                                label={`+${attendance.length - (isMobile ? 2 : 3)}`}
                                                sx={{
                                                    height: 16,
                                                    fontSize: '0.6rem'
                                                }}
                                            />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            );
        }
        
        return days;
    };
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                        Attendance Calendar
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={goToToday} color="primary">
                            <TodayIcon />
                        </IconButton>
                    </Box>
                </Box>
                
                {/* Subject Filter */}
                <Box sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Subject</InputLabel>
                        <Select
                            value={selectedSubject}
                            label="Filter by Subject"
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <MenuItem value="all">All Subjects</MenuItem>
                            {subjects.map((subject) => (
                                <MenuItem key={subject.subjectId} value={subject.subjectId}>
                                    {subject.subject}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>
            
            {/* Calendar Navigation */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IconButton onClick={() => navigateMonth(-1)}>
                        <ChevronLeftIcon />
                    </IconButton>
                    
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {monthNames[currentMonth]} {currentYear}
                    </Typography>
                    
                    <IconButton onClick={() => navigateMonth(1)}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            </Paper>
            
            {/* Calendar Grid */}
            <Paper elevation={2} sx={{ p: 2 }}>
                {/* Day Headers */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                    {dayNames.map((day) => (
                        <Grid item xs key={day}>
                            <Typography
                                variant="subtitle2"
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'text.secondary',
                                    py: 1
                                }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                
                {/* Calendar Days */}
                <Grid container spacing={1}>
                    {renderCalendarDays()}
                </Grid>
            </Paper>
            
            {/* Legend */}
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Legend:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="caption">Present</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CancelIcon color="error" fontSize="small" />
                        <Typography variant="caption">Absent</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ 
                            width: 16, 
                            height: 16, 
                            border: `2px solid ${theme.palette.primary.main}`,
                            borderRadius: 1
                        }} />
                        <Typography variant="caption">Today</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default AttendanceCalendar;