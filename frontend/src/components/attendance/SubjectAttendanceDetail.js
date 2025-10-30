import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Divider,
    IconButton,
    Collapse,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    useTheme,
    useMediaQuery,
    Pagination
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';

const SubjectAttendanceDetail = ({ subjectData, attendanceRecords }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [expandedStats, setExpandedStats] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    
    // Process and filter records
    const processedRecords = useMemo(() => {
        if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return [];
        
        let filtered = [...attendanceRecords];
        
        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(record => {
                const isPresent = record.status === 'present' || record.status === 'Present';
                return filterStatus === 'present' ? isPresent : !isPresent;
            });
        }
        
        // Sort records
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'session':
                    aValue = a.session;
                    bValue = b.session;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return filtered;
    }, [attendanceRecords, filterStatus, sortBy, sortOrder]);
    
    // Pagination
    const totalPages = Math.ceil(processedRecords.length / recordsPerPage);
    const paginatedRecords = processedRecords.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );
    
    // Calculate statistics
    const stats = useMemo(() => {
        if (!subjectData) return null;
        
        const presentCount = subjectData.present || 0;
        const totalSessions = subjectData.total || 0;
        const absentCount = subjectData.absent || 0;
        const percentage = subjectData.percentage || 0;
        
        // Calculate trend (this would need historical data in a real app)
        const trend = percentage >= 75 ? 'up' : 'down';
        
        return {
            presentCount,
            totalSessions,
            absentCount,
            percentage,
            trend,
            attendanceGoal: 75, // Minimum required attendance
            sessionsNeeded: Math.max(0, Math.ceil((75 * totalSessions - 100 * presentCount) / 25))
        };
    }, [subjectData]);
    
    const getStatusColor = (status) => {
        const isPresent = status === 'present' || status === 'Present';
        return isPresent ? 'success' : 'error';
    };
    
    const getStatusIcon = (status) => {
        const isPresent = status === 'present' || status === 'Present';
        return isPresent ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />;
    };
    
    if (!subjectData) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary">
                    No subject selected
                </Typography>
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Subject Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                    {subjectData.subject}
                </Typography>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
                    Detailed Attendance Report
                </Typography>
            </Paper>
            
            {/* Statistics Overview */}
            <Paper elevation={2} sx={{ mb: 3 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Attendance Statistics</Typography>
                    <IconButton onClick={() => setExpandedStats(!expandedStats)}>
                        {expandedStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                
                <Collapse in={expandedStats}>
                    <Box sx={{ p: 2, pt: 0 }}>
                        <Grid container spacing={3}>
                            {/* Overall Percentage */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%', background: stats?.percentage >= 75 ? '#e8f5e8' : '#ffeaea' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h3" sx={{ 
                                            color: stats?.percentage >= 75 ? '#4caf50' : '#f44336',
                                            fontWeight: 'bold'
                                        }}>
                                            {stats?.percentage.toFixed(1)}%
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Overall Attendance
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                                            {stats?.trend === 'up' ? 
                                                <TrendingUpIcon color="success" /> : 
                                                <TrendingDownIcon color="error" />
                                            }
                                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                                                {stats?.percentage >= 75 ? 'Good Standing' : 'Needs Improvement'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            {/* Present/Absent Breakdown */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Session Breakdown</Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Present</Typography>
                                                <Typography variant="body2" color="success.main">
                                                    {stats?.presentCount}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Absent</Typography>
                                                <Typography variant="body2" color="error.main">
                                                    {stats?.absentCount}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {stats?.totalSessions}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={stats?.percentage || 0}
                                            sx={{ height: 8, borderRadius: 4 }}
                                            color={stats?.percentage >= 75 ? 'success' : 'error'}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            {/* Goal Progress */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Attendance Goal</Typography>
                                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                            75%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Minimum Required
                                        </Typography>
                                        
                                        {stats?.percentage < 75 && (
                                            <Box sx={{ mt: 2, p: 1, backgroundColor: 'warning.light', borderRadius: 1 }}>
                                                <Typography variant="caption" color="warning.contrastText">
                                                    Need {stats?.sessionsNeeded} more present sessions to reach 75%
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {stats?.percentage >= 75 && (
                                            <Box sx={{ mt: 2, p: 1, backgroundColor: 'success.light', borderRadius: 1 }}>
                                                <Typography variant="caption" color="success.contrastText">
                                                    ✓ Goal Achieved!
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>
            
            {/* Filters and Controls */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter Status</InputLabel>
                            <Select
                                value={filterStatus}
                                label="Filter Status"
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value="all">All Records</MenuItem>
                                <MenuItem value="present">Present Only</MenuItem>
                                <MenuItem value="absent">Absent Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort By"
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="session">Session</MenuItem>
                                <MenuItem value="status">Status</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Order</InputLabel>
                            <Select
                                value={sortOrder}
                                label="Order"
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <MenuItem value="desc">Newest First</MenuItem>
                                <MenuItem value="asc">Oldest First</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            {processedRecords.length} records found
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
            
            {/* Attendance Records Table */}
            <Paper elevation={3}>
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Attendance Records
                    </Typography>
                </Box>
                
                {processedRecords.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No attendance records found for the selected filters.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Day</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedRecords.map((record, index) => {
                                        const date = new Date(record.date);
                                        const isPresent = record.status === 'present' || record.status === 'Present';
                                        
                                        return (
                                            <TableRow 
                                                key={index}
                                                sx={{
                                                    backgroundColor: isPresent ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                                                    '&:hover': {
                                                        backgroundColor: isPresent ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {date.toLocaleDateString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {record.session}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {getStatusIcon(record.status)}
                                                        <Chip
                                                            label={isPresent ? 'Present' : 'Absent'}
                                                            color={getStatusColor(record.status)}
                                                            size="small"
                                                            variant="filled"
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(event, page) => setCurrentPage(page)}
                                    color="primary"
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default SubjectAttendanceDetail;