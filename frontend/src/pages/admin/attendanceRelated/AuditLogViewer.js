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
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Collapse,
    Avatar,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    History as HistoryIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Error as ErrorIcon,
    Visibility as ViewIcon,
    FileDownload as ExportIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../../api/axiosConfig';

const AuditLogViewer = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const { currentUser } = useSelector((state) => state.user);
    
    // Helper function for ISO date strings
    const getISODateString = (date) => date.toISOString().split('T')[0];
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    
    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    
    // Filters - Use ISO date strings
    const [filters, setFilters] = useState({
        startDate: getISODateString(new Date(new Date().setDate(new Date().getDate() - 30))),
        endDate: getISODateString(new Date()),
        action: '',
        userId: '',
        recordType: '',
        searchTerm: ''
    });
    
    // Expanded rows for details
    const [expandedRows, setExpandedRows] = useState(new Set());
    
    // Data
    const [users, setUsers] = useState([]);
    const [actionTypes, setActionTypes] = useState(['create', 'update', 'delete', 'view', 'export']);
    const [recordTypes, setRecordTypes] = useState([]);

    const actionIcons = {
        create: <AddIcon color="success" />,
        update: <EditIcon color="primary" />,
        delete: <DeleteIcon color="error" />,
        view: <ViewIcon color="info" />,
        export: <ExportIcon color="secondary" />
    };

    const actionColors = {
        create: 'success',
        update: 'primary',
        delete: 'error',
        view: 'info',
        export: 'secondary'
    };

    const severityIcons = {
        low: <InfoIcon color="info" />,
        medium: <WarningIcon color="warning" />,
        high: <ErrorIcon color="error" />,
        critical: <ErrorIcon color="error" />
    };

    useEffect(() => {
        if (currentUser?._id) {
            loadInitialData();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?._id) {
            loadAuditLogs();
        }
    }, [currentUser, filters.action, filters.userId, filters.recordType, filters.startDate, filters.endDate, page, rowsPerPage]);

    useEffect(() => {
        applyFilters();
    }, [auditLogs, filters.searchTerm]);

    const loadInitialData = async () => {
        if (!currentUser?._id) return;

        try {
            const schoolId = currentUser._id;
            
            // Load users for the school
            const usersRes = await api.get(`/Teachers?school=${schoolId}`);
            const usersData = Array.isArray(usersRes.data) 
                ? usersRes.data 
                : (usersRes.data?.teachers || usersRes.data?.data || []);
            
            setUsers(usersData);
            
            // Set default record types
            setRecordTypes(['attendance', 'student', 'class', 'subject', 'teacher']);
            
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadAuditLogs = async () => {
        if (!currentUser?._id) return;

        setLoading(true);
        setError(null);
        
        try {
            const schoolId = currentUser._id;
            
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                startDate: filters.startDate,
                endDate: filters.endDate
            };

            // Only add filters if they have values
            if (filters.action) params.action = filters.action;
            if (filters.userId) params.userId = filters.userId;
            if (filters.recordType) params.recordType = filters.recordType;
            
            const response = await api.get(
                `/attendance/audit/logs/${schoolId}`,
                { params }
            );
            
            const logsData = Array.isArray(response.data) 
                ? response.data 
                : (response.data?.logs || response.data?.data || []);
            
            setAuditLogs(logsData);
            setTotalCount(response.data?.totalCount || response.data?.total || logsData.length);
            
        } catch (err) {
            console.error('Error loading audit logs:', err);
            setError(err.response?.data?.message || 'Failed to load audit logs');
            // Set empty array on error
            setAuditLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = auditLogs;
        
        if (filters.searchTerm && Array.isArray(auditLogs)) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = auditLogs.filter(log => 
                log.action?.toLowerCase().includes(searchLower) ||
                log.details?.toLowerCase().includes(searchLower) ||
                log.userName?.toLowerCase().includes(searchLower) ||
                log.recordId?.toLowerCase().includes(searchLower) ||
                log.reason?.toLowerCase().includes(searchLower)
            );
        }
        
        setFilteredLogs(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({
            startDate: getISODateString(new Date(new Date().setDate(new Date().getDate() - 30))),
            endDate: getISODateString(new Date()),
            action: '',
            userId: '',
            recordType: '',
            searchTerm: ''
        });
        setPage(0);
    };

    const toggleRowExpansion = (logId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedRows(newExpanded);
    };

    const getUserName = (userId) => {
        const user = users.find(u => u._id === userId);
        return user ? user.name : 'Unknown User';
    };

    const getUserRole = (userId) => {
        const user = users.find(u => u._id === userId);
        return user ? user.role : 'Unknown';
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    const getSeverityLevel = (action, changes) => {
        if (action === 'delete') return 'high';
        if (action === 'create') return 'low';
        if (action === 'update') {
            if (changes?.attendance?.status) return 'medium';
            if (changes?.bulk) return 'medium';
            return 'low';
        }
        return 'low';
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
                {/* Search */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Search"
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        placeholder="Search by action, user, or record ID..."
                    />
                </Grid>
                
                {/* Date Range */}
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Start Date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label="End Date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                {/* Action Filter */}
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Action</InputLabel>
                        <Select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            label="Action"
                        >
                            <MenuItem value="">All Actions</MenuItem>
                            {actionTypes.map((action) => (
                                <MenuItem key={action} value={action}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {actionIcons[action]}
                                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                                            {action}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                {/* User Filter */}
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>User</InputLabel>
                        <Select
                            value={filters.userId}
                            onChange={(e) => handleFilterChange('userId', e.target.value)}
                            label="User"
                        >
                            <MenuItem value="">All Users</MenuItem>
                            {Array.isArray(users) && users.map((user) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.name} ({user.role})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Paper>
    );

    const renderAuditLogTable = () => {
        const displayLogs = filters.searchTerm && filteredLogs.length >= 0 ? filteredLogs : auditLogs;

        if (!Array.isArray(displayLogs) || displayLogs.length === 0) {
            return (
                <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No audit logs found for the selected filters.
                    </Typography>
                </Paper>
            );
        }

        return (
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width="50px"></TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Record Type</TableCell>
                            <TableCell>Record ID</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayLogs.map((log) => {
                            const isExpanded = expandedRows.has(log._id);
                            const severity = getSeverityLevel(log.action, log.changes);
                            
                            return (
                                <React.Fragment key={log._id || Math.random()}>
                                    <TableRow hover>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleRowExpansion(log._id)}
                                            >
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatTimestamp(log.performedAt || log.timestamp || log.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}>
                                                    {getUserName(log.performedBy || log.userId).charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {getUserName(log.performedBy || log.userId)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {getUserRole(log.performedBy || log.userId)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={actionIcons[log.action] || actionIcons.view}
                                                label={(log.action || 'unknown').toUpperCase()}
                                                color={actionColors[log.action] || 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {log.recordType || 'Attendance'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {log.recordId ? `${log.recordId.substring(0, 8)}...` : 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {severityIcons[severity]}
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        ml: 0.5, 
                                                        textTransform: 'uppercase',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {severity}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>
                                                {log.reason || log.details || 'No details available'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Expanded Row Details */}
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ py: 0 }}>
                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="subtitle2" gutterBottom>
                                                                Record Details
                                                            </Typography>
                                                            <Box sx={{ pl: 2 }}>
                                                                <Typography variant="body2">
                                                                    <strong>Full Record ID:</strong> {log.recordId || 'N/A'}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>IP Address:</strong> {log.ipAddress || 'N/A'}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>User Agent:</strong> {log.userAgent || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                        
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="subtitle2" gutterBottom>
                                                                Changes Made
                                                            </Typography>
                                                            <Box sx={{ pl: 2 }}>
                                                                {log.oldValues && (
                                                                    <Box sx={{ mb: 1 }}>
                                                                        <Typography variant="caption" color="error.main">
                                                                            Old Values:
                                                                        </Typography>
                                                                        <pre style={{ 
                                                                            fontSize: '0.75rem', 
                                                                            margin: 0,
                                                                            whiteSpace: 'pre-wrap',
                                                                            wordBreak: 'break-word'
                                                                        }}>
                                                                            {JSON.stringify(log.oldValues, null, 2)}
                                                                        </pre>
                                                                    </Box>
                                                                )}
                                                                
                                                                {log.newValues && (
                                                                    <Box>
                                                                        <Typography variant="caption" color="success.main">
                                                                            New Values:
                                                                        </Typography>
                                                                        <pre style={{ 
                                                                            fontSize: '0.75rem', 
                                                                            margin: 0,
                                                                            whiteSpace: 'pre-wrap',
                                                                            wordBreak: 'break-word'
                                                                        }}>
                                                                            {JSON.stringify(log.newValues, null, 2)}
                                                                        </pre>
                                                                    </Box>
                                                                )}
                                                                
                                                                {!log.oldValues && !log.newValues && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        No detailed changes recorded
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
                
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>
        );
    };

    const renderSummaryCards = () => {
        if (!Array.isArray(auditLogs)) return null;

        const todayLogs = auditLogs.filter(log => {
            const logDate = log.performedAt || log.timestamp || log.createdAt;
            return logDate && new Date(logDate).toDateString() === new Date().toDateString();
        });
        
        const actionCounts = auditLogs.reduce((acc, log) => {
            const action = log.action || 'unknown';
            acc[action] = (acc[action] || 0) + 1;
            return acc;
        }, {});

        return (
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="primary">
                                    Today's Activity
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {todayLogs.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Audit entries today
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <EditIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="success.main">
                                    Updates
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {actionCounts.update || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Records updated
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AddIcon color="info" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="info.main">
                                    Creates
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {actionCounts.create || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Records created
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <DeleteIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="error.main">
                                    Deletions
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {actionCounts.delete || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Records deleted
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    if (loading && auditLogs.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading audit logs...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Audit Log Viewer
                </Typography>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={loadAuditLogs} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            {renderSummaryCards()}

            {/* Filters */}
            {renderFilters()}

            {/* Audit Log Table */}
            {renderAuditLogTable()}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}
        </Box>
    );
};

export default AuditLogViewer;