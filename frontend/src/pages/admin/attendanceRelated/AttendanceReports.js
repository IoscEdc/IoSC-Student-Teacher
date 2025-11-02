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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Download as DownloadIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Description as CsvIcon,
    Schedule as ScheduleIcon,
    Report as ReportIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../../api/axiosConfig';

const AttendanceReports = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const { currentUser } = useSelector((state) => state.user);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Get ISO date string helper
    const getISODateString = (date) => date.toISOString().split('T')[0];
    
    const [reportConfig, setReportConfig] = useState({
        type: 'student-summary',
        format: 'excel',
        dateRange: {
            startDate: getISODateString(new Date(new Date().setMonth(new Date().getMonth() - 1))),
            endDate: getISODateString(new Date())
        },
        filters: {
            classId: '',
            subjectId: '',
            teacherId: '',
            studentId: '',
            attendanceThreshold: 75,
            includeExcused: true,
            groupBy: 'class'
        },
        columns: {
            studentInfo: true,
            attendanceStats: true,
            percentages: true,
            trends: false,
            details: false
        }
    });
    
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [reportPreview, setReportPreview] = useState(null);
    const [savedReports, setSavedReports] = useState([]);
    const [previewDialog, setPreviewDialog] = useState({ open: false, data: null });
    const [scheduleDialog, setScheduleDialog] = useState({ open: false });
    const [scheduleConfig, setScheduleConfig] = useState({
        name: '',
        frequency: 'weekly',
        recipients: [],
        enabled: true
    });
    
    const reportTypes = [
        { value: 'student-summary', label: 'Student Attendance Summary', description: 'Individual student attendance statistics' },
        { value: 'class-summary', label: 'Class Attendance Summary', description: 'Class-wise attendance overview' },
        { value: 'teacher-summary', label: 'Teacher Assignment Report', description: 'Teacher assignments and class coverage' },
        { value: 'detailed', label: 'Detailed Attendance Log', description: 'Complete attendance records with timestamps' },
        { value: 'low-attendance', label: 'Low Attendance Alert', description: 'Students below attendance threshold' },
        { value: 'trend-analysis', label: 'Attendance Trend Analysis', description: 'Attendance patterns over time' }
    ];
    
    const formatOptions = [
        { value: 'excel', label: 'Excel (.xlsx)', icon: <ExcelIcon />, description: 'Spreadsheet format with charts' },
        { value: 'pdf', label: 'PDF (.pdf)', icon: <PdfIcon />, description: 'Formatted document for printing' },
        { value: 'csv', label: 'CSV (.csv)', icon: <CsvIcon />, description: 'Raw data for analysis' }
    ];

    useEffect(() => {
        if (currentUser?._id) {
            loadInitialData();
            loadSavedReports();
        }
    }, [currentUser]);

    const loadInitialData = async () => {
        if (!currentUser?._id) return;
        
        setLoading(true);
        try {
            const schoolId = currentUser._id;
            
            const [classesRes, subjectsRes, teachersRes, studentsRes] = await Promise.all([
                api.get(`/Sclasses/school/${schoolId}`),
                api.get(`/AllSubjects/${schoolId}`),
                api.get(`/Teachers?school=${schoolId}`),
                api.get(`/Students/${schoolId}`)
            ]);
            
            // Handle different response structures
            setClasses(Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.classes || []));
            setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.subjects || []));
            setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : (teachersRes.data?.teachers || []));
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.students || []));
            
        } catch (err) {
            setError('Failed to load initial data. Please refresh.');
            console.error('Error loading initial data:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedReports = async () => {
        if (!currentUser?._id) return;
        
        try {
            const response = await api.get(`/attendance/reports/saved/${currentUser._id}`);
            setSavedReports(Array.isArray(response.data) ? response.data : (response.data?.reports || []));
        } catch (err) {
            console.error('Error loading saved reports:', err);
        }
    };

    const handleGenerateReport = async () => {
        if (!currentUser?._id) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post(
                `/attendance/reports/generate`,
                {
                    ...reportConfig,
                    schoolId: currentUser._id
                },
                {
                    responseType: reportConfig.format === 'excel' || reportConfig.format === 'pdf' ? 'blob' : 'json'
                }
            );
            
            if (reportConfig.format === 'excel' || reportConfig.format === 'pdf') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const extension = reportConfig.format === 'excel' ? 'xlsx' : 'pdf';
                link.setAttribute('download', `attendance-report-${reportConfig.type}-${new Date().toISOString().split('T')[0]}.${extension}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                setSuccess('Report downloaded successfully');
            } else {
                setReportPreview(response.data);
                setPreviewDialog({ open: true, data: response.data });
            }
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate report');
            console.error('Report generation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewReport = async () => {
        if (!currentUser?._id) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post(
                `/attendance/reports/preview`,
                {
                    ...reportConfig,
                    schoolId: currentUser._id
                }
            );
            
            setReportPreview(response.data);
            setPreviewDialog({ open: true, data: response.data });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to preview report');
            console.error('Preview error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReportConfig = async () => {
        if (!currentUser?._id) {
            setError('User not authenticated');
            return;
        }

        try {
            await api.post(
                `/attendance/reports/save-config`,
                {
                    name: `${reportConfig.type}-${new Date().toISOString().split('T')[0]}`,
                    config: reportConfig,
                    schoolId: currentUser._id
                }
            );
            
            setSuccess('Report configuration saved');
            loadSavedReports();
        } catch (err) {
            setError('Failed to save report configuration');
            console.error('Save config error:', err);
        }
    };

    const handleScheduleReport = async () => {
        if (!currentUser?._id) {
            setError('User not authenticated');
            return;
        }

        try {
            await api.post(
                `/attendance/reports/schedule`,
                {
                    ...scheduleConfig,
                    reportConfig,
                    schoolId: currentUser._id
                }
            );
            
            setSuccess('Report scheduled successfully');
            setScheduleDialog({ open: false });
        } catch (err) {
            setError('Failed to schedule report');
            console.error('Schedule report error:', err);
        }
    };
    
    const updateReportConfig = (field, value) => {
        setReportConfig(prev => ({ ...prev, [field]: value }));
    };
    
    const updateFilters = (field, value) => {
        setReportConfig(prev => ({
            ...prev,
            filters: { ...prev.filters, [field]: value }
        }));
    };
    
    const updateColumns = (field, value) => {
        setReportConfig(prev => ({
            ...prev,
            columns: { ...prev.columns, [field]: value }
        }));
    };

    const renderReportTypeSelector = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Report Type</Typography>
            <Grid container spacing={2}>
                {reportTypes.map((type) => (
                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                border: reportConfig.type === type.value ? 2 : 1,
                                borderColor: reportConfig.type === type.value ? 'primary.main' : 'divider',
                                height: '100%',
                                '&:hover': { boxShadow: 3 }
                            }}
                            onClick={() => updateReportConfig('type', type.value)}
                        >
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {type.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {type.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );

    const renderFormatSelector = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Export Format</Typography>
            <RadioGroup
                value={reportConfig.format}
                onChange={(e) => updateReportConfig('format', e.target.value)}
                row={!isMobile}
            >
                {formatOptions.map((format) => (
                    <FormControlLabel
                        key={format.value}
                        value={format.value}
                        control={<Radio />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {format.icon}
                                <Box sx={{ ml: 1 }}>
                                    <Typography variant="body2">{format.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {format.description}
                                    </Typography>
                                </Box>
                            </Box>
                        }
                    />
                ))}
            </RadioGroup>
        </Paper>
    );

    const renderFilters = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filters & Options</Typography>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={reportConfig.dateRange.startDate}
                        onChange={(e) => updateReportConfig('dateRange', {
                            ...reportConfig.dateRange,
                            startDate: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        value={reportConfig.dateRange.endDate}
                        onChange={(e) => updateReportConfig('dateRange', {
                            ...reportConfig.dateRange,
                            endDate: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={reportConfig.filters.classId}
                            onChange={(e) => updateFilters('classId', e.target.value)}
                            label="Class"
                        >
                            <MenuItem value="">All Classes</MenuItem>
                            {Array.isArray(classes) && classes.map((cls) => (
                                <MenuItem key={cls._id} value={cls._id}>
                                    {cls.sclassName || cls.className || 'Unnamed Class'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={reportConfig.filters.subjectId}
                            onChange={(e) => updateFilters('subjectId', e.target.value)}
                            label="Subject"
                        >
                            <MenuItem value="">All Subjects</MenuItem>
                            {Array.isArray(subjects) && subjects.map((subject) => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    {subject.subName || 'Unnamed Subject'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Teacher</InputLabel>
                        <Select
                            value={reportConfig.filters.teacherId}
                            onChange={(e) => updateFilters('teacherId', e.target.value)}
                            label="Teacher"
                        >
                            <MenuItem value="">All Teachers</MenuItem>
                            {Array.isArray(teachers) && teachers.map((teacher) => (
                                <MenuItem key={teacher._id} value={teacher._id}>
                                    {teacher.name || 'Unnamed Teacher'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="Attendance Threshold (%)"
                        type="number"
                        value={reportConfig.filters.attendanceThreshold}
                        onChange={(e) => updateFilters('attendanceThreshold', parseInt(e.target.value) || 75)}
                        inputProps={{ min: 0, max: 100 }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Group By</InputLabel>
                        <Select
                            value={reportConfig.filters.groupBy}
                            onChange={(e) => updateFilters('groupBy', e.target.value)}
                            label="Group By"
                        >
                            <MenuItem value="class">Class</MenuItem>
                            <MenuItem value="subject">Subject</MenuItem>
                            <MenuItem value="teacher">Teacher</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={reportConfig.filters.includeExcused}
                                onChange={(e) => updateFilters('includeExcused', e.target.checked)}
                            />
                        }
                        label="Include Excused Absences"
                    />
                </Grid>
            </Grid>
        </Paper>
    );

    const renderColumnSelector = () => (
        <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Column Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={reportConfig.columns.studentInfo}
                                    onChange={(e) => updateColumns('studentInfo', e.target.checked)}
                                />
                            }
                            label="Student Information"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={reportConfig.columns.attendanceStats}
                                    onChange={(e) => updateColumns('attendanceStats', e.target.checked)}
                                />
                            }
                            label="Attendance Statistics"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={reportConfig.columns.percentages}
                                    onChange={(e) => updateColumns('percentages', e.target.checked)}
                                />
                            }
                            label="Percentages"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={reportConfig.columns.trends}
                                    onChange={(e) => updateColumns('trends', e.target.checked)}
                                />
                            }
                            label="Trends"
                        />
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );

    const renderPreviewDialog = () => (
        <Dialog
            open={previewDialog.open}
            onClose={() => setPreviewDialog({ open: false, data: null })}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>Report Preview</DialogTitle>
            <DialogContent>
                {reportPreview && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {reportTypes.find(t => t.value === reportConfig.type)?.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Generated on: {new Date().toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Records: {reportPreview.totalRecords || 0}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {reportPreview.headers?.map((header, index) => (
                                            <TableCell key={index}>{header}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportPreview.data?.slice(0, 10).map((row, index) => (
                                        <TableRow key={index}>
                                            {row.map((cell, cellIndex) => (
                                                <TableCell key={cellIndex}>{cell}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {reportPreview.data?.length > 10 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Showing first 10 rows of {reportPreview.data.length} total rows
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPreviewDialog({ open: false, data: null })}>
                    Close
                </Button>
                <Button onClick={handleGenerateReport} variant="contained">
                    Download Full Report
                </Button>
            </DialogActions>
        </Dialog>
    );

    if (loading && classes.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading report data...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Attendance Reports
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Schedule Report">
                        <IconButton onClick={() => setScheduleDialog({ open: true })}>
                            <ScheduleIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={loadInitialData} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {renderReportTypeSelector()}
            {renderFormatSelector()}
            {renderFilters()}
            {renderColumnSelector()}

            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        onClick={handlePreviewReport}
                        disabled={loading}
                        startIcon={<ReportIcon />}
                    >
                        Preview Report
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleGenerateReport}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    >
                        {loading ? 'Generating...' : 'Generate & Download'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleSaveReportConfig}
                        startIcon={<ScheduleIcon />}
                        disabled={loading}
                    >
                        Save Configuration
                    </Button>
                </Box>
            </Paper>

            {savedReports.length > 0 && (
                <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Saved Report Configurations
                    </Typography>
                    <List>
                        {savedReports.map((report) => (
                            <ListItem key={report._id}>
                                <ListItemIcon>
                                    <ReportIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={report.name}
                                    secondary={`Created: ${new Date(report.createdAt).toLocaleDateString()}`}
                                />
                                <Button
                                    size="small"
                                    onClick={() => setReportConfig(report.config)}
                                >
                                    Load
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {renderPreviewDialog()}

            <Dialog
                open={scheduleDialog.open}
                onClose={() => setScheduleDialog({ open: false })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Schedule Report</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Report Name"
                                value={scheduleConfig.name}
                                onChange={(e) => setScheduleConfig(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Frequency</InputLabel>
                                <Select
                                    value={scheduleConfig.frequency}
                                    onChange={(e) => setScheduleConfig(prev => ({
                                        ...prev,
                                        frequency: e.target.value
                                    }))}
                                    label="Frequency"
                                >
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email Recipients (comma separated)"
                                value={scheduleConfig.recipients.join(', ')}
                                onChange={(e) => setScheduleConfig(prev => ({
                                    ...prev,
                                    recipients: e.target.value.split(',').map(email => email.trim())
                                }))}
                                helperText="Enter email addresses separated by commas"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialog({ open: false })}>
                        Cancel
                    </Button>
                    <Button onClick={handleScheduleReport} variant="contained">
                        Schedule Report
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendanceReports;