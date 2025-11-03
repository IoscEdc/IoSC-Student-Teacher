import React, { useState, useEffect } from 'react';
import {
    Paper,
    TablePagination,
    Box,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    TextField,
    Card,
    CardContent,
    Grid,
    Stack,
    IconButton,
    Divider,
    InputAdornment,
    Avatar,
    Fade,
    Collapse,
    Button,
    Tooltip,
    alpha
} from '@mui/material';
import { 
    CalendarMonth as CalendarIcon,
    Person as PersonIcon,
    Event as EventIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

// Modern Attendance Card Component
const AttendanceCard = ({ record }) => {
    
    // (Helper functions getStatusColor, getStatusIcon, getStatusGradient, formatDate remain the same)
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'excused': return 'info';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return <CheckIcon fontSize="small" />;
            case 'absent': return <CancelIcon fontSize="small" />;
            case 'excused': return <EventIcon fontSize="small" />;
            default: return null;
        }
    };

    const getStatusGradient = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)';
            case 'absent': return 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)';
            case 'excused': return 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)';
            default: return 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)';
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

    return (
        <Card 
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-4px)',
                }
            }}
        >
            <Box 
                sx={{ 
                    height: 6,
                    background: getStatusGradient(record.status)
                }}
            />
            
            {/* --- MOBILE-FIT: Reduced padding on mobile --- */}
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {/* --- MOBILE-FIT: Shrunk avatar on mobile --- */}
                            <Avatar 
                                sx={{ 
                                    width: { xs: 40, sm: 48 }, 
                                    height: { xs: 40, sm: 48 },
                                    background: getStatusGradient(record.status),
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            >
                                <PersonIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ lineHeight: 1.3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                    {record.studentId?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    Roll #{record.studentId?.rollNum || 'N/A'}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip
                            icon={getStatusIcon(record.status)}
                            label={record.status?.toUpperCase() || 'UNKNOWN'}
                            color={getStatusColor(record.status)}
                            size="small"
                            sx={{ 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                                borderRadius: 1.5
                            }}
                        />
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                             {/* --- MOBILE-FIT: Reduced padding on mobile --- */}
                            <Box 
                                sx={{ 
                                    p: { xs: 1.5, sm: 1.5 }, // Kept padding small
                                    bgcolor: alpha('#2196f3', 0.05),
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: alpha('#2196f3', 0.1)
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {/* --- MOBILE-FIT: Shrunk icon on mobile --- */}
                                    <CalendarIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#2196f3' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                            DATE
                                        </Typography>
                                        {/* --- MOBILE-FIT: Shrunk font on mobile --- */}
                                        <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                                            {formatDate(record.date)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box 
                                sx={{ 
                                    p: { xs: 1.5, sm: 1.5 }, // Kept padding small
                                    bgcolor: alpha('#9c27b0', 0.05),
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: alpha('#9c27b0', 0.1)
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {/* --- MOBILE-FIT: Shrunk icon on mobile --- */}
                                    <EventIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#9c27b0' }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                            SESSION
                                        </Typography>
                                        {/* --- MOBILE-FIT: Shrunk font on mobile --- */}
                                        <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                                            {record.session || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Stack>

                <Box sx={{ 
                    mt: 2, 
                    pt: 1.5, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}>
                    <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                        Marked by: <strong>{record.teacherId?.name || record.markedBy?.name || 'System'}</strong>
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color, gradient }) => (
    <Card 
        sx={{ 
            height: '100%',
            background: gradient || `linear-gradient(135deg, ${color} 0%, ${color} 100%)`,
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }
        }}
    >
        {/* --- MOBILE-FIT: Reduced padding on mobile --- */}
        <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 2.5 } }}>
            {/* --- MOBILE-FIT: Shrunk icon on mobile --- */}
            <Icon sx={{ fontSize: { xs: 28, sm: 40 }, opacity: 0.9, mb: 1 }} />
            {/* --- MOBILE-FIT: Shrunk font on mobile --- */}
            <Typography variant="h3" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' }, mb: 0.5 }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                {label}
            </Typography>
        </CardContent>
    </Card>
);

const SimpleAttendanceHistory = ({ classId, subjectId, teacherId }) => {
    // ... (State and fetch logic are unchanged) ...
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(24);
    const [totalRecords, setTotalRecords] = useState(0);
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0, excused: 0 });
    
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

                const statusCounts = records.reduce((acc, record) => {
                    const status = record.status?.toLowerCase() || 'unknown';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                
                setStats({
                    present: statusCounts.present || 0,
                    absent: statusCounts.absent || 0,
                    excused: statusCounts.excused || 0
                });
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

    const clearDateFilter = () => {
        setDateFilter('');
    };

    const handleRefresh = () => {
        fetchAttendanceRecords();
    };

    if (loading) {
        // ... (Loading state is unchanged)
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                p: 3 
            }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Loading attendance records...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Fetching latest data
                </Typography>
            </Box>
        );
    }

    if (error) {
        // ... (Error state is unchanged)
         return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert 
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={handleRefresh}>
                            Retry
                        </Button>
                    }
                    sx={{ 
                        boxShadow: 2,
                        borderRadius: 2
                    }}
                >
                    <Typography variant="body1" fontWeight="600" gutterBottom>
                        {error}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Debug: classId={classId}, subjectId={subjectId}
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        // --- MOBILE-FIT: Reduced vertical padding on mobile ---
        <Box sx={{ 
            py: { xs: 1.5, sm: 3, md: 4 }, // Only vertical padding
            minHeight: '100vh' 
        }}>

            {/* Modern Header */}
            <Fade in timeout={600}>
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                             {/* --- MOBILE-FIT: Shrunk icon box on mobile --- */}
                            <Box
                                sx={{
                                    width: { xs: 44, sm: 56 },
                                    height: { xs: 44, sm: 56 },
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                }}
                            >
                                {/* --- MOBILE-FIT: Shrunk icon on mobile --- */}
                                <SchoolIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography 
                                    variant="h4" 
                                    fontWeight="800"
                                    sx={{ 
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 0.5,
                                        // --- MOBILE-FIT: Shrunk font on mobile ---
                                        fontSize: { xs: '1.5rem', sm: '2.25rem' } 
                                    }}
                                >
                                    Attendance History
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                        fontWeight: 500,
                                        // --- MOBILE-FIT: Shrunk font on mobile ---
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                >
                                    Track and monitor student attendance records
                                </Typography>
                            </Box>
                        </Stack>
                        <Tooltip title="Refresh Data">
                            <IconButton 
                                onClick={handleRefresh}
                                sx={{ 
                                    bgcolor: 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    '&:hover': { 
                                        bgcolor: 'white',
                                        transform: 'rotate(180deg)',
                                        transition: 'transform 0.6s'
                                    }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {/* --- MOBILE-FIT: Reduced grid spacing for mobile --- */}
                    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4} md={4}>
                            <StatsCard 
                                icon={CheckIcon} 
                                label="Present" 
                                value={stats.present}
                                gradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <StatsCard 
                                icon={CancelIcon} 
                                label="Absent" 
                                value={stats.absent}
                                gradient="linear-gradient(135deg, #f44336 0%, #ef5350 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <StatsCard 
                                icon={TrendingUpIcon} 
                                label="Total Records" 
                                value={totalRecords}
                                gradient="linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Fade>

            {/* Filters Section */}
            <Paper sx={{ mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <Box 
                    sx={{ 
                        p: 2, 
                        bgcolor: alpha('#667eea', 0.05),
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <FilterIcon sx={{ color: '#667eea' }} />
                        <Typography variant="subtitle1" fontWeight="700">
                            Filters
                        </Typography>
                        {dateFilter && (
                            <Chip 
                                label="1 Active" 
                                size="small"
                                color="primary"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                        )}
                    </Stack>
                </Box>
                
                <Collapse in={showFilters}>
                     {/* --- MOBILE-FIT: Reduced padding on mobile --- */}
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Filter by Date"
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                fullWidth
                                sx={{ 
                                    maxWidth: { sm: 300 },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                                InputProps={{
                                    endAdornment: dateFilter && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={clearDateFilter}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            {dateFilter && (
                                <Button
                                    variant="outlined"
                                    startIcon={<CloseIcon />}
                                    onClick={clearDateFilter}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Clear Filter
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Collapse>
            </Paper>

            {/* Records Grid */}
            <Fade in timeout={800}>
                <Box>
                    {attendanceRecords.length === 0 ? (
                        <Paper sx={{ 
                            // --- MOBILE-FIT: Reduced padding on mobile ---
                            p: { xs: 4, sm: 8 }, 
                            textAlign: 'center', 
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            borderRadius: 3
                        }}>
                             {/* --- MOBILE-FIT: Shrunk icon on mobile --- */}
                            <EventIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight="600" gutterBottom>
                                No attendance records found
                            </Typography>
                            {dateFilter && (
                                <Typography variant="body2" color="text.secondary">
                                    Try adjusting your filters
                                </Typography>
                            )}
                        </Paper>
                    ) : (
                        // --- MOBILE-FIT: Reduced grid spacing for mobile ---
                        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                            {attendanceRecords.map((record, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={record._id || index}>
                                    <AttendanceCard record={record} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Fade>

            {/* Pagination */}
            {totalRecords > 0 && (
                <Paper sx={{ 
                    mt: { xs: 2, sm: 3 }, // --- MOBILE-FIT: Reduced margin-top on mobile ---
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: 3
                }}>
                    <TablePagination
                        rowsPerPageOptions={[12, 24, 48, 96]}
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
            )}
        </Box>
    );
};

export default SimpleAttendanceHistory;