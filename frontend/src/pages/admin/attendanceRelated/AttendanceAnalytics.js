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
    Tab,
    Tabs
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
// Using native date input instead of date picker library
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
    AreaChart,
    Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const AttendanceAnalytics = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch();
    
    const { currentUser } = useSelector((state) => state.user);
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        endDate: new Date(),
        classId: '',
        subjectId: '',
        teacherId: '',
        attendanceStatus: 'all'
    });
    const [tabValue, setTabValue] = useState(0);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Chart colors
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

    useEffect(() => {
        loadInitialData();
        loadAnalyticsData();
    }, []);

    useEffect(() => {
        loadAnalyticsData();
    }, [filters]);

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes, teachersRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/AllSubjects/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers/${currentUser.school}`)
            ]);
            
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setTeachers(teachersRes.data || []);
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadAnalyticsData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/analytics/school/${currentUser.school}`,
                { params: filters }
            );
            
            setAnalyticsData(response.data);
        } catch (err) {
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
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/reports/export`,
                { 
                    params: filters,
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
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            endDate: new Date(),
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
                        value={filters.startDate.toISOString().split('T')[0]}
                        onChange={(e) => handleFilterChange('startDate', new Date(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="End Date"
                        type="date"
                        value={filters.endDate.toISOString().split('T')[0]}
                        onChange={(e) => handleFilterChange('endDate', new Date(e.target.value))}
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
            </Grid>
        </Paper>
    );

    const renderCharts = () => {
        if (!analyticsData?.charts) return null;

        const { charts } = analyticsData;

        return (
            <Grid container spacing={3}>
                {/* Class-wise Attendance Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Class-wise Attendance
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.classWise}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="className" />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip />
                                <Bar dataKey="percentage" fill={colors[0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Subject-wise Attendance Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Subject-wise Attendance
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.subjectWise}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subjectName" />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip />
                                <Bar dataKey="percentage" fill={colors[1]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Attendance Trend Chart */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Attendance Trend Over Time
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={charts.trend}>
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
                    </Paper>
                </Grid>

                {/* Attendance Distribution Pie Chart */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Attendance Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {charts.distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Low Attendance Students */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Students Requiring Attention
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {charts.lowAttendanceStudents?.map((student, index) => (
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
                        <IconButton onClick={handleExport}>
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