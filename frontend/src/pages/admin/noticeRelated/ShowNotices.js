import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {
    Paper,
    Box,
    IconButton,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Fab,
    useTheme,
    useMediaQuery,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    NoteAdd as NoteAddIcon,
    Delete as DeleteIcon,
    Notifications as NotificationsIcon,
    CalendarToday as CalendarIcon,
    Description as DescriptionIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { getAllNotices } from '../../../redux/noticeRelated/noticeHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import TableTemplate from '../../../components/TableTemplate';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';

const ShowNotices = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { noticesList, loading, error, response } = useSelector((state) => state.notice);
    const { currentUser } = useSelector(state => state.user);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });

    useEffect(() => {
        dispatch(getAllNotices(currentUser._id, "Notice"));
    }, [currentUser._id, dispatch]);

    if (error) {
        console.log(error);
    }

    const deleteHandler = (deleteID, address) => {
        dispatch(deleteUser(deleteID, address))
            .then(() => {
                dispatch(getAllNotices(currentUser._id, "Notice"));
            });
        setDeleteConfirm({ open: false, id: null, type: '' });
    };

    const handleDeleteClick = (id, type) => {
        setDeleteConfirm({ open: true, id, type });
    };

    const noticeColumns = [
        { id: 'title', label: 'Title', minWidth: 170 },
        { id: 'details', label: 'Details', minWidth: 100 },
        { id: 'date', label: 'Date', minWidth: 170 },
    ];

    const noticeRows = noticesList && noticesList.length > 0 && noticesList.map((notice) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
        return {
            title: notice.title,
            details: notice.details,
            date: dateString,
            id: notice._id,
        };
    });

    const NoticeButtonHaver = ({ row }) => {
        return (
            <IconButton 
                onClick={() => handleDeleteClick(row.id, "Notice")}
                size={isMobile ? "small" : "medium"}
                sx={{
                    color: 'error.main',
                    '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white'
                    }
                }}
            >
                <DeleteIcon />
            </IconButton>
        );
    };

    const actions = [
        {
            icon: <NoteAddIcon color="primary" />,
            name: 'Add New Notice',
            action: () => navigate("/Admin/addnotice")
        },
        {
            icon: <DeleteIcon color="error" />,
            name: 'Delete All Notices',
            action: () => handleDeleteClick(currentUser._id, "Notices")
        }
    ];

    // Mobile Card View
    const MobileNoticeCard = ({ notice }) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
        
        return (
            <Card
                sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                                {notice.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {dateString}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(notice._id, "Notice")}
                            sx={{
                                color: 'error.main',
                                bgcolor: 'error.light',
                                '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {notice.details}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    // Empty State
    const EmptyState = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: '400px', sm: '500px' },
                textAlign: 'center',
                p: { xs: 3, sm: 4, md: 6 }
            }}
        >
            <Box
                sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                }}
            >
                <NotificationsIcon
                    sx={{
                        fontSize: { xs: '2.5rem', sm: '3rem' },
                        color: '#1976d2'
                    }}
                />
            </Box>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
            >
                No Notices Found
            </Typography>
            <Typography
                sx={{
                    color: 'text.secondary',
                    mb: 4,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    maxWidth: '400px'
                }}
            >
                Create your first notice to keep everyone informed
            </Typography>
            <Button
                variant="contained"
                size="large"
                startIcon={<NoteAddIcon />}
                onClick={() => navigate("/Admin/addnotice")}
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textTransform: 'none',
                    borderRadius: 2,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s'
                }}
            >
                Add Your First Notice
            </Button>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px'
                    }}
                >
                    <CircularProgress size={60} />
                </Box>
            ) : (
                <>
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2
                        }}
                    >
                        <Box>
                            <Typography
                                variant={isMobile ? "h5" : "h4"}
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5
                                }}
                            >
                                Notices
                            </Typography>
                            {!isMobile && noticesList && noticesList.length > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    Manage all your announcements and notices
                                </Typography>
                            )}
                        </Box>

                        {!isMobile && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<NoteAddIcon />}
                                    onClick={() => navigate("/Admin/addnotice")}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        textTransform: 'none',
                                        px: 3,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        '&:hover': {
                                            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                                        }
                                    }}
                                >
                                    Add Notice
                                </Button>
                                {noticesList && noticesList.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDeleteClick(currentUser._id, "Notices")}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        Delete All
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Stats Chip */}
                    {noticesList && noticesList.length > 0 && (
                        <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                                label={`${noticesList.length} ${noticesList.length === 1 ? 'Notice' : 'Notices'}`}
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            />
                        </Box>
                    )}

                    {/* Content */}
                    {response || !noticesList || noticesList.length === 0 ? (
                        <Paper
                            sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <EmptyState />
                        </Paper>
                    ) : (
                        <>
                            {isMobile ? (
                                // Mobile Card View
                                <Box>
                                    {noticesList.map((notice) => (
                                        <MobileNoticeCard key={notice._id} notice={notice} />
                                    ))}
                                </Box>
                            ) : (
                                // Desktop Table View
                                <Paper
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <TableTemplate
                                        buttonHaver={NoticeButtonHaver}
                                        columns={noticeColumns}
                                        rows={noticeRows}
                                    />
                                </Paper>
                            )}

                            {/* Speed Dial for Desktop only */}
                            {/* {!isMobile && <SpeedDialTemplate actions={actions} />} */}
                        </>
                    )}

                    {/* Mobile FAB */}
                    {isMobile && noticesList && noticesList.length > 0 && (
                        <Fab
                            color="primary"
                            onClick={() => navigate("/Admin/addnotice")}
                            sx={{
                                position: 'fixed',
                                bottom: 16,
                                right: 16,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                        >
                            <NoteAddIcon />
                        </Fab>
                    )}
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, id: null, type: '' })}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, mx: isMobile ? 2 : 0 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Confirm Delete
                    </Typography>
                    <IconButton
                        onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {deleteConfirm.type === 'Notices'
                            ? 'Are you sure you want to delete all notices? This action cannot be undone.'
                            : 'Are you sure you want to delete this notice? This action cannot be undone.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => deleteHandler(deleteConfirm.id, deleteConfirm.type)}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShowNotices;