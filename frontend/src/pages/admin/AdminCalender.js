import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    Alert,
    Snackbar,
    useTheme,
    useMediaQuery,
    Fab,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CalendarToday,
    ChevronLeft,
    ChevronRight,
    Close as CloseIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import axios from 'axios';

const AdminCalendar = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [events, setEvents] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEvent, setCurrentEvent] = useState({
        _id: '',
        date: '',
        type: 'Event',
        title: '',
        description: ''
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, eventId: null });
    const [showEventsList, setShowEventsList] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Calender/`);
            setEvents(response.data.calender || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDialog = (event = null) => {
        if (event) {
            setCurrentEvent(event);
            setEditMode(true);
        } else {
            setCurrentEvent({
                _id: '',
                date: '',
                type: 'Event',
                title: '',
                description: ''
            });
            setEditMode(false);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentEvent({
            _id: '',
            date: '',
            type: 'Event',
            title: '',
            description: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEvent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editMode) {
                await axios.put(`${process.env.REACT_APP_BASE_URL}/Calender/`, {
                    id: currentEvent._id,
                    date: currentEvent.date,
                    type: currentEvent.type,
                    title: currentEvent.title,
                    description: currentEvent.description
                });
                showSnackbar('Event updated successfully', 'success');
            } else {
                await axios.post(`${process.env.REACT_APP_BASE_URL}/Calender/`, currentEvent);
                showSnackbar('Event added successfully', 'success');
            }
            handleCloseDialog();
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            // Demo fallback
            if (editMode) {
                setEvents(events.map(e => e._id === currentEvent._id ? currentEvent : e));
            } else {
                const newEvent = { ...currentEvent, _id: Date.now().toString() };
                setEvents([...events, newEvent]);
            }
            handleCloseDialog();
            showSnackbar(editMode ? 'Event updated (demo)' : 'Event added (demo)', 'success');
        }
    };

    const handleDeleteClick = (eventId) => {
        setDeleteConfirm({ open: true, eventId });
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/Calender/${deleteConfirm.eventId}`);
            setEvents(events.filter(e => e._id !== deleteConfirm.eventId));
            showSnackbar('Event deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting event:', error);
            setEvents(events.filter(e => e._id !== deleteConfirm.eventId));
            showSnackbar('Event deleted (demo)', 'success');
        }
        setDeleteConfirm({ open: false, eventId: null });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getEventsForDate = (dateStr) => {
        return events.filter(event => event.date === dateStr);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(
                <Box 
                    key={`empty-${i}`} 
                    sx={{ 
                        p: { xs: 0.5, sm: 1.5 }, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        minHeight: { xs: '50px', sm: '100px' }
                    }} 
                />
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            const dayEvents = getEventsForDate(dateStr);
            const today = new Date();
            const isToday = formatDate(today) === dateStr;

            days.push(
                <Box
                    key={day}
                    onClick={() => {
                        if (isMobile && dayEvents.length > 0) {
                            setShowEventsList(true);
                        }
                    }}
                    sx={{
                        p: { xs: 0.5, sm: 1.5 },
                        minHeight: { xs: '50px', sm: '100px' },
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isToday ? 'action.selected' : 'background.paper',
                        cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'primary.main' : 'text.primary',
                            mb: { xs: 0.25, sm: 0.5 },
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}
                    >
                        {day}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
                        {isMobile ? (
                            dayEvents.length > 0 && (
                                <Box sx={{ 
                                    width: 6, 
                                    height: 6, 
                                    borderRadius: '50%', 
                                    bgcolor: dayEvents[0].type === 'Holiday' ? 'error.main' : 'primary.main' 
                                }} />
                            )
                        ) : (
                            dayEvents.slice(0, 2).map((event) => (
                                <Chip
                                    key={event._id}
                                    label={event.title}
                                    size="small"
                                    color={event.type === 'Holiday' ? 'error' : 'primary'}
                                    sx={{
                                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                        height: { xs: '16px', sm: '20px' },
                                        '& .MuiChip-label': {
                                            px: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                />
                            ))
                        )}
                        {!isMobile && dayEvents.length > 2 && (
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                +{dayEvents.length - 2} more
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        }

        return days;
    };

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2
            }}>
                <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    Calendar Management
                </Typography>
                {!isMobile && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            textTransform: 'none',
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    >
                        Add Event
                    </Button>
                )}
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Calendar View */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: { xs: 2, sm: 3 } 
                        }}>
                            <IconButton 
                                onClick={handlePrevMonth} 
                                sx={{ bgcolor: 'action.hover' }}
                                size={isMobile ? "small" : "medium"}
                            >
                                <ChevronLeft />
                            </IconButton>

                            <Typography 
                                variant={isMobile ? "h6" : "h5"} 
                                sx={{ fontWeight: 'bold' }}
                            >
                                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </Typography>

                            <IconButton 
                                onClick={handleNextMonth} 
                                sx={{ bgcolor: 'action.hover' }}
                                size={isMobile ? "small" : "medium"}
                            >
                                <ChevronRight />
                            </IconButton>
                        </Box>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: { xs: 0.5, sm: 1 }, 
                            mb: 1 
                        }}>
                            {daysOfWeek.map(day => (
                                <Typography
                                    key={day}
                                    variant="subtitle2"
                                    sx={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: 'text.secondary',
                                        py: { xs: 0.5, sm: 1 },
                                        fontSize: { xs: '0.65rem', sm: '0.875rem' }
                                    }}
                                >
                                    {day}
                                </Typography>
                            ))}
                        </Box>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: { xs: 0.5, sm: 1 } 
                        }}>
                            {renderMonthView()}
                        </Box>

                        <Box sx={{ 
                            mt: { xs: 2, sm: 3 }, 
                            display: 'flex', 
                            gap: { xs: 2, sm: 3 }, 
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: '50%' }} />
                                <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    Holiday
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 16, height: 16, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    Event
                                </Typography>
                            </Box>
                        </Box>

                        {/* Mobile Events List Toggle */}
                        {isMobile && (
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setShowEventsList(!showEventsList)}
                                sx={{ mt: 2, textTransform: 'none' }}
                            >
                                {showEventsList ? 'Hide Events List' : 'Show Events List'}
                            </Button>
                        )}
                    </Paper>
                </Grid>

                {/* Events List */}
                {(!isMobile || showEventsList) && (
                    <Grid item xs={12} lg={4}>
                        <Paper 
                            elevation={2} 
                            sx={{ 
                                p: { xs: 2, sm: 3 }, 
                                borderRadius: 3, 
                                maxHeight: { xs: 'auto', lg: '800px' }, 
                                overflow: 'auto' 
                            }}
                        >
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    mb: 2, 
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}
                            >
                                All Events & Holidays
                            </Typography>

                            {sortedEvents.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CalendarToday sx={{ fontSize: { xs: 40, sm: 60 }, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        No events added yet
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {sortedEvents.map((event) => (
                                        <Card key={event._id} variant="outlined" sx={{ borderRadius: 2 }}>
                                            <CardContent sx={{ pb: 1, p: { xs: 1.5, sm: 2 } }}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'flex-start', 
                                                    mb: 1,
                                                    flexWrap: 'wrap',
                                                    gap: 1
                                                }}>
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 'bold', 
                                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                                        }}
                                                    >
                                                        {event.title}
                                                    </Typography>
                                                    <Chip
                                                        label={event.type}
                                                        size="small"
                                                        color={event.type === 'Holiday' ? 'error' : 'primary'}
                                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                    />
                                                </Box>
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary" 
                                                    display="block" 
                                                    sx={{ mb: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                >
                                                    {new Date(event.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                >
                                                    {event.description}
                                                </Typography>
                                            </CardContent>
                                            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(event)}
                                                    sx={{ color: 'primary.main' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteClick(event._id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </CardActions>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Mobile FAB */}
            {isMobile && (
                <Fab
                    color="primary"
                    onClick={() => handleOpenDialog()}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    <AddIcon />
                </Fab>
            )}

            {/* Add/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: { borderRadius: isMobile ? 0 : 2 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {editMode ? 'Edit Event' : 'Add New Event'}
                    </Typography>
                    <IconButton onClick={handleCloseDialog} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            label="Event Title"
                            name="title"
                            value={currentEvent.title}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            placeholder="e.g., Republic Day, Tech Fest"
                            size={isMobile ? "small" : "medium"}
                        />

                        <TextField
                            label="Date"
                            name="date"
                            type="date"
                            value={currentEvent.date}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            size={isMobile ? "small" : "medium"}
                        />

                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                name="type"
                                value={currentEvent.type}
                                onChange={handleInputChange}
                                label="Type"
                            >
                                <MenuItem value="Event">Event</MenuItem>
                                <MenuItem value="Holiday">Holiday</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Description"
                            name="description"
                            value={currentEvent.description}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            multiline
                            rows={3}
                            placeholder="Provide details about the event or holiday"
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!currentEvent.title || !currentEvent.date || !currentEvent.description}
                        sx={{ 
                            textTransform: 'none', 
                            px: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    >
                        {editMode ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, eventId: null })}
                PaperProps={{
                    sx: { borderRadius: 2, mx: isMobile ? 2 : 0 }
                }}
            >
                <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Are you sure you want to delete this event? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirm({ open: false, eventId: null })}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminCalendar;