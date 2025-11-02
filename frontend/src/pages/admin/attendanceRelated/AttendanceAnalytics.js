import React, { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    FilterList as FilterIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useSelector } from 'react-redux'; // Removed useDispatch
import axios from 'axios'; // Using axios from component, not api/axiosConfig

import api from '../../../api/axiosConfig'

// Helper function to format date strings
const getISODateString = (date) => {
    return date.toISOString().split('T')[0];
};

const AttendanceAnalytics = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const { currentUser } = useSelector((state) => state.user);
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    
    // --- FIXED: Use string dates to avoid timezone issues ---
    const [filters, setFilters] = useState({
        startDate: getISODateString(new Date(new Date().setMonth(new Date().getMonth() - 3))),
        endDate: getISODateString(new Date()),
        classId: '',
        subjectId: '',
        teacherId: '',
        attendanceStatus: 'all'
    });
    
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Chart colors
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

    // --- FIXED: Load initial data for filters only when currentUser is available ---
    useEffect(() => {
        if (currentUser?._id) {
            loadInitialData();
        }
    }, [currentUser]);

    useEffect(() => {
        console.log('🔍 DEBUG - Current User:', currentUser);
        console.log('🔍 DEBUG - LocalStorage user:', localStorage.getItem('user'));
        console.log('🔍 DEBUG - LocalStorage token:', localStorage.getItem('token'));
    }, [currentUser]);

    // --- FIXED: Load analytics data when currentUser or filters change ---
    useEffect(() => {
        if (currentUser?._id) {
            loadAnalyticsData();
        }
    }, [currentUser, filters]);

    const loadInitialData = async () => {
        if (!currentUser?._id) return;
        
        try {
            // --- FIXED: Pass schoolId (currentUser._id) to all API calls ---
            const schoolId = currentUser._id;
            const [classesRes, subjectsRes, teachersRes] = await Promise.all([
                // These routes are based on your other backend files
                axios.get(`${process.env.REACT_APP_BASE_URL}/Sclasses/school/${schoolId}`), 
                axios.get(`${process.env.REACT_APP_BASE_URL}/AllSubjects/${schoolId}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers?school=${schoolId}`)
            ]);
            
            // --- FIXED: Defensively parse API responses ---
            setClasses(classesRes.data.classes || classesRes.data || []);
            setSubjects(subjectsRes.data.subjects || subjectsRes.data || []);
            setTeachers(teachersRes.data.teachers || teachersRes.data || []);
        } catch (err) {
            console.error('Error loading initial data:', err);
            setError("Failed to load filter data (classes, subjects, teachers).");
        }
    };

    const loadAnalyticsData = async () => {
        if (!currentUser?._id) return;

        setLoading(true);
        setError(null);
        
        try {
            const schoolId = currentUser._id;
            
            // Build params object with all filters
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                includeClassBreakdown: true,
                includeSubjectBreakdown: true
            };

            // Only add optional filters if they have values
            if (filters.classId) {
                params.classId = filters.classId;
            }
            if (filters.subjectId) {
                params.subjectId = filters.subjectId;
            }
            if (filters.teacherId) {
                params.teacherId = filters.teacherId;
            }
            if (filters.attendanceStatus && filters.attendanceStatus !== 'all') {
                params.attendanceStatus = filters.attendanceStatus;
            }

            console.log('📤 Sending request with params:', params);

            // FIXED: Remove /attendance prefix and pass params
            const response = await api.get(
                `/attendance/analytics/school/${schoolId}`,
                { params } // ✅ NOW PASSING PARAMS
            );
            
            console.log('📥 Response received:', response.data);
            
            setAnalyticsData(response.data.data); 

        } catch (err) {
            console.error('❌ Error loading analytics:', err);
            setError(err.response?.data?.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRefresh = () => {
        loadAnalyticsData();
    };

    const handleExport = async () => {
        if (!currentUser?._id) {
            setError('Cannot export: User not found.');
            return;
        }
        try {
            // --- FIXED: Add schoolId to export params ---
            const params = {
                ...filters,
                schoolId: currentUser._id
            };

            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/reports/export`,
                { 
                    params: params,
                    responseType: 'blob'
                }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to export data');
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: getISODateString(new Date(new Date().setMonth(new Date().getMonth() - 3))),
            endDate: getISODateString(new Date()),
            classId: '',
            subjectId: '',
            teacherId: '',
            attendanceStatus: 'all'
        });
    };

    const renderOverviewCards = () => {
        if (!analyticsData?.overview) return null;

        const { overview } = analyticsData;
        
        return (
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="primary">
                                    Total Students
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {overview.totalStudents?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Across all classes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ClassIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="success.main">
                                    Avg Attendance
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {overview.averageAttendance?.toFixed(1) || 0}%
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                {overview.attendanceTrend > 0 ? (
                                    <TrendingUpIcon color="success" fontSize="small" />
                                ) : (
                                    <TrendingDownIcon color="error" fontSize="small" />
                                )}
                                <Typography 
                                    variant="body2" 
                                    color={overview.attendanceTrend > 0 ? 'success.main' : 'error.main'}
                                    sx={{ ml: 0.5 }}
                                >
                                    {Math.abs(overview.attendanceTrend || 0).toFixed(1)}% from last period
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="warning.main">
                                    Low Attendance
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                {overview.lowAttendanceCount || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Students below 75%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ClassIcon color="info" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="info.main">
                                    Total Classes
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {overview.totalClasses || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sessions conducted
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderFilters = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={clearFilters} size="small">
                    Clear All
                </Button>
            </Box>
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Start Date"
                        type="date"
                        value={filters.startDate} // --- FIXED ---
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} // --- FIXED ---
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="End Date"
                        type="date"
                        value={filters.endDate} // --- FIXED ---
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} // --- FIXED ---
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={filters.classId}
                            onChange={(e) => handleFilterChange('classId', e.target.value)}
                            label="Class"
                        >
                            <MenuItem value="">All Classes</MenuItem>
                            {classes.map((cls) => (
                                <MenuItem key={cls._id} value={cls._id}>
                                    {cls.sclassName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={filters.subjectId}
                            onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                            label="Subject"
                        >
                            <MenuItem value="">All Subjects</MenuItem>
                            {subjects.map((subject) => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    {subject.subName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* --- ADDED TEACHER FILTER --- */}
                 <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Teacher</InputLabel>
                        <Select
                            value={filters.teacherId}
                            onChange={(e) => handleFilterChange('teacherId', e.target.value)}
                            label="Teacher"
                        >
                            <MenuItem value="">All Teachers</MenuItem>
                            {teachers.map((teacher) => (
                                <MenuItem key={teacher._id} value={teacher._id}>
                                    {teacher.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                 {/* --- ADDED STATUS FILTER --- */}
                 <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.attendanceStatus}
                            onChange={(e) => handleFilterChange('attendanceStatus', e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                            <MenuItem value="Late">Late</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Paper>
    );

    const renderCharts = () => {
        if (!analyticsData?.charts) return null;

        const { charts } = analyticsData;

        // Ensure data is an array before rendering
        const classWiseData = Array.isArray(charts.classWise) ? charts.classWise : [];
        const subjectWiseData = Array.isArray(charts.subjectWise) ? charts.subjectWise : [];
        const trendData = Array.isArray(charts.trend) ? charts.trend : [];
        const distributionData = Array.isArray(charts.distribution) ? charts.distribution : [];
        const lowAttendanceData = Array.isArray(charts.lowAttendanceStudents) ? charts.lowAttendanceStudents : [];

        return (
            <Grid container spacing={3}>
                {/* Class-wise Attendance Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Class-wise Attendance
                        </Typography>
                        {classWiseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={classWiseData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="className" />
                                    <YAxis domain={[0, 100]} />
                                    <RechartsTooltip />
                                    <Bar dataKey="percentage" fill={colors[0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (<Typography>No data for this period.</Typography>)}
                    </Paper>
                </Grid>

                {/* Subject-wise Attendance Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Subject-wise Attendance
                        </Typography>
                        {subjectWiseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={subjectWiseData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subjectName" />
                                    <YAxis domain={[0, 100]} />
                                    <RechartsTooltip />
                                    <Bar dataKey="percentage" fill={colors[1]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (<Typography>No data for this period.</Typography>)}
                    </Paper>
                </Grid>

                {/* Attendance Trend Chart */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Attendance Trend Over Time
                        </Typography>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="percentage" 
                                        stroke={colors[2]} 
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (<Typography>No data for this period.</Typography>)}
                    </Paper>
                </Grid>

                {/* Attendance Distribution Pie Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Attendance Distribution
                        </Typography>
                        {distributionData.length > 0 && distributionData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        outerRadius={100} // Increased size
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend /> 
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (<Typography>No data for this period.</Typography>)}
                    </Paper>
                </Grid>

                {/* Low Attendance Students */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Students Requiring Attention
                        </Typography>
                        {lowAttendanceData.length > 0 ? (
                            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                {lowAttendanceData.map((student) => (
                                    <Box key={student.id} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {student.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Class: {student.className} | Attendance: {student.percentage}%
                                        </Typography>
                                        <Chip 
                                            label={student.percentage < 65 ? 'Critical' : 'Warning'}
                                            color={student.percentage < 65 ? 'error' : 'warning'}
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ) : (<Typography>No students found with low attendance.</Typography>)}
                    </Paper>
                </Grid>
            </Grid>
        );
    };

    if (loading && !analyticsData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Attendance Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={handleRefresh} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Data">
                        <IconButton onClick={handleExport} disabled={loading || !analyticsData}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            {renderFilters()}

            {/* Overview Cards */}
            {renderOverviewCards()}

            {/* Charts */}
            {renderCharts()}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}
        </Box>
    );
};

export default AttendanceAnalytics;