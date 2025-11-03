import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {
    Paper, Box, IconButton, Typography, Card, CardContent, CardActions,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid,
    Alert, Snackbar, CircularProgress, Fab, Fade, alpha, Tooltip
} from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { LoadingButton } from '@mui/lab';
// --- Added Imports ---
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import ListAltIcon from '@mui/icons-material/ListAlt';
// --- Removed unused api from imports ---
import api from '../../api/axiosConfig';
import Stack from '@mui/material/Stack';
// --- Re-created StatsCard component from the previous example ---
const StatsCard = ({ icon: Icon, label, value, gradient }) => (
    <Card 
        sx={{ 
            height: '100%',
            background: gradient,
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
        <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 2.5 } }}>
            <Icon sx={{ fontSize: { xs: 28, sm: 40 }, opacity: 0.9, mb: 1 }} />
            <Typography variant="h3" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' }, mb: 0.5 }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                {label}
            </Typography>
        </CardContent>
    </Card>
);

const TeacherNotices = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser } = useSelector(state => state.user);

    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedNotice, setSelectedNotice] = useState(null);

    // Form states
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [priority, setPriority] = useState('medium');
    const [formLoading, setFormLoading] = useState(false);

    // Snackbar states
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch teacher's notices
    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/TeacherNotices');
            
            if (response.data.success) {
                setNotices(response.data.notices);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch notices');
            showSnackbar('Failed to fetch notices', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.role === 'Teacher') {
            fetchNotices();
        }
    }, [currentUser]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Dialog handlers
    const openCreateDialog = () => {
        setDialogMode('create');
        setTitle('');
        setDetails('');
        setPriority('medium');
        setOpenDialog(true);
    };

    const openEditDialog = (notice) => {
        setDialogMode('edit');
        setSelectedNotice(notice);
        setTitle(notice.title);
        setDetails(notice.details);
        setPriority(notice.priority);
        setOpenDialog(true);
    };

    const openViewDialog = (notice) => {
        setDialogMode('view');
        setSelectedNotice(notice);
        setTitle(notice.title);
        setDetails(notice.details);
        setPriority(notice.priority);
        setOpenDialog(true);
    };

    const closeDialog = () => {
        setOpenDialog(false);
        setSelectedNotice(null);
        setTitle('');
        setDetails('');
        setPriority('medium');
    };

    // CRUD operations
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !details.trim()) {
            showSnackbar('Title and details are required', 'error');
            return;
        }

        setFormLoading(true);
        try {
            const noticeData = { title, details, priority };

            if (dialogMode === 'create') {
                const response = await api.post('/NoticeCreate', noticeData);
                
                if (response.data.success) {
                    showSnackbar('Notice created successfully');
                    fetchNotices();
                    closeDialog();
                }
            } else if (dialogMode === 'edit') {
                const response = await api.put(`/Notice/${selectedNotice._id}`, noticeData);
                
                if (response.data.success) {
                    showSnackbar('Notice updated successfully');
                    fetchNotices();
                    closeDialog();
                }
            }
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Operation failed', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (noticeId) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;

        try {
            const response = await api.delete(`/Notice/${noticeId}`);
            
            if (response.data.success) {
                showSnackbar('Notice deleted successfully');
                fetchNotices();
            }
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Failed to delete notice', 'error');
        }
    };

    // --- Helper functions for modern styling ---
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getPriorityGradient = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)';
            case 'medium': return 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)';
            case 'low': return 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)';
            default: return 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // --- Calculate stats ---
    const stats = {
        total: notices.length,
        high: notices.filter(n => n.priority === 'high').length,
        medium: notices.filter(n => n.priority === 'medium').length,
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        // --- MOBILE-FIT: Root box with vertical padding only ---
        <Box sx={{ py: { xs: 1.5, sm: 3, md: 4 } }}>
            {/* --- Modern Header --- */}
            <Fade in timeout={600}>
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
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
                            <NotificationsActiveIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
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
                                    fontSize: { xs: '1.5rem', sm: '2.25rem' } 
                                }}
                            >
                                My Notices
                            </Typography>
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            >
                                Create, edit, and manage your notices
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Fade>
            
            {/* --- Stats Card Section --- */}
            <Fade in timeout={800}>
                <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <StatsCard 
                            icon={ListAltIcon} 
                            label="Total Notices" 
                            value={stats.total}
                            gradient="linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)"
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <StatsCard 
                            icon={PriorityHighIcon} 
                            label="High Priority" 
                            value={stats.high}
                            gradient="linear-gradient(135deg, #f44336 0%, #ef5350 100%)"
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <StatsCard 
                            icon={LowPriorityIcon} 
                            label="Medium Priority" 
                            value={stats.medium}
                            gradient="linear-gradient(135deg, #ff9800 0%, #ffa726 100%)"
                        />
                    </Grid>
                </Grid>
            </Fade>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* --- Main Content Grid --- */}
            {notices.length === 0 ? (
                // --- Modern Empty State ---
                <Paper sx={{ 
                    p: { xs: 4, sm: 8 }, 
                    textAlign: 'center', 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: 3
                }}>
                    <NoteAddIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight="600" gutterBottom>
                        No notices found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click the 'plus' button to create your first notice
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {notices.map((notice) => (
                        <Grid item xs={12} md={6} lg={4} key={notice._id}>
                            {/* --- Modernized Notice Card --- */}
                            <Card sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    transform: 'translateY(-4px)'
                                }
                            }}>
                                <Box 
                                    sx={{ 
                                        height: 6,
                                        background: getPriorityGradient(notice.priority)
                                    }}
                                />
                                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                            {notice.title}
                                        </Typography>
                                        <Chip 
                                            label={notice.priority.toUpperCase()} 
                                            color={getPriorityColor(notice.priority)}
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {notice.details.length > 100 
                                            ? `${notice.details.substring(0, 100)}...` 
                                            : notice.details
                                        }
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Created: {formatDate(notice.createdAt)}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ 
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: alpha('#000', 0.02)
                                }}>
                                    <Tooltip title="View">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => openViewDialog(notice)}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => openEditDialog(notice)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDelete(notice._id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* --- FAB for Create Notice (Mobile-Friendly) --- */}
            <Tooltip title="Create New Notice">
                <Fab 
                    color="primary" 
                    aria-label="add"
                    onClick={openCreateDialog}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 24, sm: 32 },
                        right: { xs: 24, sm: 32 },
                        backgroundColor: '#270843',
                        '&:hover': { backgroundColor: '#3f1068' }
                    }}
                >
                    <NoteAddIcon />
                </Fab>
            </Tooltip>

            {/* Create/Edit/View Dialog (Unchanged, but kept your purple style) */}
            <Dialog open={openDialog} onClose={closeDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {dialogMode === 'create' && 'Create New Notice'}
                    {dialogMode === 'edit' && 'Edit Notice'}
                    {dialogMode === 'view' && 'View Notice'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={dialogMode === 'view'}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            label="Details"
                            fullWidth
                            required
                            multiline
                            rows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            disabled={dialogMode === 'view'}
                            sx={{ mb: 3 }}
                        />
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={priority}
                                label="Priority"
                                onChange={(e) => setPriority(e.target.value)}
                                disabled={dialogMode === 'view'}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>
                        {dialogMode === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {dialogMode !== 'view' && (
                        <LoadingButton
                            type="submit"
                            variant="contained"
                            loading={formLoading}
                            onClick={handleSubmit}
                            sx={{
                                backgroundColor: '#270843',
                                '&:hover': { backgroundColor: '#3f1068' }
                            }}
                        >
                            {dialogMode === 'create' ? 'Create' : 'Update'}
                        </LoadingButton>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications (Unchanged) */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TeacherNotices;