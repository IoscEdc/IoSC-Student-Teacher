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
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    Snackbar,
    Tooltip,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    SwapHoriz as SwapIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import axios from 'axios';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: '0.875rem',
}));

const TimeSlotCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
    minWidth: '100px',
    fontSize: '0.813rem',
}));

const SubjectCell = styled(TableCell)(({ theme }) => ({
    padding: '12px',
    minWidth: '140px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const AdminTimeTable = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [timetableData, setTimetableData] = useState(null);
    const [openBatchDialog, setOpenBatchDialog] = useState(false);
    const [openSlotDialog, setOpenSlotDialog] = useState(false);
    const [openLunchDialog, setOpenLunchDialog] = useState(false);
    const [newBatch, setNewBatch] = useState('');
    const [currentSlot, setCurrentSlot] = useState({
        day: '',
        slotIndex: -1,
        time: '',
        subject: '',
        teacher: '',
        room: ''
    });
    const [currentLunchSlot, setCurrentLunchSlot] = useState({
        day: '',
        slotIndex: -1,
        time: ''
    });
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, batch: null });
    const [reorderMode, setReorderMode] = useState(false);
    const [dragOverCell, setDragOverCell] = useState(null);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const defaultTimeSlots = [
        '09:00 - 10:00',
        '10:00 - 11:00',
        '11:00 - 12:00',
        '12:00 - 01:00',
        '01:00 - 02:00',
        '02:00 - 03:00',
        '03:00 - 04:00',
        '04:00 - 05:00'
    ];

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
        if (selectedBatch) {
            fetchTimetable(selectedBatch);
        }
    }, [selectedBatch]);

    const normalizeTimetable = (raw) => {
        if (!raw || !raw.timetable) return raw;
        const copy = { ...raw, timetable: { ...raw.timetable } };
        days.forEach((day) => {
            const arr = Array.isArray(copy.timetable[day]) ? [...copy.timetable[day]] : [];
            const normalized = defaultTimeSlots.map((time, idx) => {
                const existing = arr[idx];
                if (existing) {
                    return {
                        time: existing.time || time,
                        subject: existing.subject ?? '',
                        teacher: existing.teacher ?? '',
                        room: existing.room ?? ''
                    };
                } else {
                    return {
                        time,
                        subject: '',
                        teacher: '',
                        room: ''
                    };
                }
            });
            copy.timetable[day] = normalized;
        });
        return copy;
    };

    const fetchBatches = async () => {
        try {
            const response = await axios.get('http://localhost:5000/batches/');
            setBatches(response.data.batches || []);
            if (response.data.batches && response.data.batches.length > 0) {
                setSelectedBatch(response.data.batches[0]);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            const mockBatches = ['CSE-A', 'CSE-B', 'ECE-A'];
            setBatches(mockBatches);
            setSelectedBatch('CSE-A');
        }
    };

    const fetchTimetable = async (batch) => {
        try {
            const response = await axios.get(`http://localhost:5000/TimeTable/${batch}`);
            setTimetableData(normalizeTimetable(response.data));
        } catch (error) {
            console.error('Error fetching timetable:', error);
        }
    };

    const handleCreateBatch = async () => {
        if (!newBatch.trim()) {
            showSnackbar('Please enter a batch name', 'error');
            return;
        }

        try {
            const emptyTimetable = {
                batch: newBatch,
                timetable: {}
            };

            days.forEach(day => {
                emptyTimetable.timetable[day] = defaultTimeSlots.map(time => ({
                    time,
                    subject: '',
                    teacher: '',
                    room: ''
                }));
            });

            await axios.post('http://localhost:5000/batches', emptyTimetable);
            showSnackbar('Batch created successfully', 'success');
            setOpenBatchDialog(false);
            setNewBatch('');
            fetchBatches();
        } catch (error) {
            console.error('Error creating batch:', error);
            setBatches([...batches, newBatch]);
            setSelectedBatch(newBatch);
            showSnackbar('Batch created (demo)', 'success');
            setOpenBatchDialog(false);
            setNewBatch('');
        }
    };

    const handleDeleteBatch = async () => {
        try {
            await axios.delete(`http://localhost:5000/batches/${deleteConfirm.batch}`);
            showSnackbar('Batch deleted successfully', 'success');
            fetchBatches();
        } catch (error) {
            console.error('Error deleting batch:', error);
            setBatches(batches.filter(b => b !== deleteConfirm.batch));
            showSnackbar('Batch deleted (demo)', 'success');
        }
        setDeleteConfirm({ open: false, batch: null });
    };

    const handleEditSlot = (day, slotIndex) => {
        if (!timetableData?.timetable?.[day]?.[slotIndex]) return;
        
        const slot = timetableData.timetable[day][slotIndex];

        // if (slot.subject === 'Lunch Break') {
        //     setCurrentLunchSlot({
        //         day,
        //         slotIndex,
        //         time: slot.time
        //     });
        //     setOpenLunchDialog(true);
        // } else {
            setCurrentSlot({
                day,
                slotIndex,
                time: slot.time,
                subject: slot.subject,
                teacher: slot.teacher,
                room: slot.room
            });
            setEditMode(true);
            setOpenSlotDialog(true);
        // }
    };

    const handleSaveSlot = async () => {
        if (!currentSlot.subject || !currentSlot.teacher || !currentSlot.room || !currentSlot.time) {
            showSnackbar('Please fill all fields', 'error');
            return;
        }

        try {
            const updatedTimetable = { ...timetableData };

            updatedTimetable.timetable[currentSlot.day][currentSlot.slotIndex] = {
                time: currentSlot.time,
                subject: currentSlot.subject,
                teacher: currentSlot.teacher,
                room: currentSlot.room
            };

            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar('Slot updated successfully', 'success');
            setOpenSlotDialog(false);
        } catch (error) {
            console.error('Error saving slot:', error);
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[currentSlot.day][currentSlot.slotIndex] = {
                time: currentSlot.time,
                subject: currentSlot.subject,
                teacher: currentSlot.teacher,
                room: currentSlot.room
            };
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar('Slot updated (demo)', 'success');
            setOpenSlotDialog(false);
        }
    };

    const handleSaveLunchBreak = async () => {
        if (!currentLunchSlot.time) {
            showSnackbar('Please select a time slot', 'error');
            return;
        }

        try {
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[currentLunchSlot.day][currentLunchSlot.slotIndex] = {
                time: currentLunchSlot.time,
                subject: 'Lunch Break',
                teacher: '-',
                room: '-'
            };

            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar('Lunch break updated successfully', 'success');
            setOpenLunchDialog(false);
        } catch (error) {
            console.error('Error saving lunch break:', error);
            showSnackbar('Lunch break updated (demo)', 'success');
            setOpenLunchDialog(false);
        }
    };

    const handleDeleteSlot = async (day, slotIndex) => {
        try {
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[day][slotIndex] = {
                time: updatedTimetable.timetable[day][slotIndex].time,
                subject: '',
                teacher: '',
                room: ''
            };

            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
            setTimetableData(updatedTimetable);
            showSnackbar('Slot cleared successfully', 'success');
        } catch (error) {
            console.error('Error deleting slot:', error);
            showSnackbar('Slot cleared (demo)', 'success');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const getSubjectColor = (subject) => {
        const colors = {
            'Operating Systems (ARD 203)': '#2196F3',
            'Essential Mathematics for AI (ARD 201)': '#4CAF50',
            'Data Structures (ARD 209)': '#FF9800',
            'Foundation of Computer Science (ARD 207)': '#00BCD4',
            'Database Management System (ARD 205)': '#9C27B0',
            'JAVA Lab (ARD 251)': '#FF5722',
            'Data Structures Lab (ARD 255)': '#FFC107',
            'Database Management System Lab (ARD 253)': '#3F51B5',
            'Accountancy for Engineers (MSAI 211)': '#795548',
            'Lunch Break': '#9E9E9E',
        };
        return colors[subject] || '#607D8B';
    };

    const onDragStart = (e, day, index) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ day, index }));
        e.currentTarget.style.opacity = '0.5';
    };

    const onDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDragOverCell(null);
    };

    const onDragOver = (e, day, index) => {
        if (!reorderMode) return;
        e.preventDefault();
        setDragOverCell({ day, index });
    };

    const onDrop = (e, day, index) => {
        e.preventDefault();

        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        const { day: sourceDay, index: sourceIndex } = dragData;

        const updatedTimetable = { ...timetableData };
        const movedSlot = { ...updatedTimetable.timetable[sourceDay][sourceIndex] };

        if (!movedSlot) return;

        if (sourceDay === day) {
            const temp = updatedTimetable.timetable[day][sourceIndex];
            updatedTimetable.timetable[day][sourceIndex] = updatedTimetable.timetable[day][index];
            updatedTimetable.timetable[day][index] = temp;
        } else {
            const targetSlot = { ...updatedTimetable.timetable[day][index] };
            updatedTimetable.timetable[day][index] = movedSlot;
            updatedTimetable.timetable[sourceDay][sourceIndex] = targetSlot;
        }

        setTimetableData(updatedTimetable);
        setDragOverCell(null);
        showSnackbar('Slots swapped successfully', 'success');
    };

    const handleSaveLayout = async () => {
        try {
            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, timetableData);
            showSnackbar('Layout saved successfully', 'success');
            setReorderMode(false);
        } catch (error) {
            console.error('Error saving layout:', error);
            showSnackbar('Layout saved (demo)', 'success');
            setReorderMode(false);
        }
    };

    // Mobile Day Card View
    const MobileDayView = ({ day }) => {
        const daySlots = timetableData?.timetable?.[day] || [];
        
        return (
            <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
                <Box sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        {day}
                    </Typography>
                    <CalendarIcon sx={{ color: 'white' }} />
                </Box>
                <CardContent sx={{ p: 1.5 }}>
                    {daySlots.map((slot, index) => {
                        if (!slot.subject) return null;
                        const isLunchBreak = slot.subject === 'Lunch Break';
                        
                        return (
                            <Box
                                key={index}
                                onClick={() => handleEditSlot(day, index)}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderLeft: `4px solid ${getSubjectColor(slot.subject)}`,
                                    bgcolor: isLunchBreak ? '#f5f5f5' : 'background.paper',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 2,
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                    <Chip 
                                        label={slot.time} 
                                        size="small"
                                        sx={{ 
                                            fontSize: '0.7rem',
                                            height: 20,
                                            bgcolor: getSubjectColor(slot.subject),
                                            color: 'white'
                                        }}
                                    />
                                    {!isLunchBreak && (
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSlot(day, index);
                                                }}
                                                sx={{ p: 0.5 }}
                                            >
                                                <EditIcon sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSlot(day, index);
                                                }}
                                                sx={{ p: 0.5 }}
                                            >
                                                <DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {slot.subject}
                                </Typography>
                                {!isLunchBreak && (
                                    <>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {slot.teacher}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            📍 {slot.room}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 2
                    }}
                >
                    Timetable Management
                </Typography>
                
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>
                    <Button
                        variant={reorderMode ? 'contained' : 'outlined'}
                        startIcon={<SwapIcon />}
                        onClick={() => setReorderMode(!reorderMode)}
                        size={isMobile ? "small" : "medium"}
                        fullWidth={isMobile}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        {reorderMode ? 'Reorder: ON' : 'Reorder: OFF'}
                    </Button>

                    {reorderMode && (
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveLayout}
                            size={isMobile ? "small" : "medium"}
                            fullWidth={isMobile}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Save Layout
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenBatchDialog(true)}
                        size={isMobile ? "small" : "medium"}
                        fullWidth={isMobile}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Create Batch
                    </Button>
                    
                    {selectedBatch && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteConfirm({ open: true, batch: selectedBatch })}
                            size={isMobile ? "small" : "medium"}
                            fullWidth={isMobile}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Delete Batch
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Batch Selector */}
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel>Select Batch</InputLabel>
                            <Select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                label="Select Batch"
                            >
                                {batches.map((batch, idx) => (
                                    <MenuItem key={idx} value={batch}>
                                        {batch}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                            <Typography variant="body2" color="text.secondary">
                                Total Batches:
                            </Typography>
                            <Chip label={batches.length} color="primary" size="small" />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Timetable Display */}
            {timetableData && (
                <>
                    {isMobile ? (
                        // Mobile View - Day Cards
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                {timetableData.batch} - Weekly Schedule
                            </Typography>
                            {days.map(day => (
                                <MobileDayView key={day} day={day} />
                            ))}
                        </Box>
                    ) : (
                        // Desktop View - Table
                        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                                {timetableData.batch} - Weekly Schedule
                            </Typography>

                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                                <Table size={isTablet ? "small" : "medium"}>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell sx={{ minWidth: 100 }}>Time</StyledTableCell>
                                            {days.map((day) => (
                                                <StyledTableCell key={day} align="center" sx={{ minWidth: 150 }}>
                                                    {day}
                                                </StyledTableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {defaultTimeSlots.map((timeSlot, index) => (
                                            <TableRow key={timeSlot}>
                                                <TimeSlotCell>{timeSlot}</TimeSlotCell>
                                                {days.map((day) => {
                                                    const slot = timetableData.timetable[day]?.[index] ?? { time: timeSlot, subject: '', teacher: '', room: '' };
                                                    const isLunchBreak = slot?.subject === 'Lunch Break';
                                                    const isDragOver = dragOverCell && dragOverCell.day === day && dragOverCell.index === index;

                                                    return (
                                                        <SubjectCell
                                                            key={day}
                                                            align="center"
                                                            onClick={() => slot && handleEditSlot(day, index)}
                                                            sx={{
                                                                backgroundColor: isLunchBreak ? '#f5f5f5' : isDragOver ? 'rgba(25,118,210,0.06)' : 'transparent',
                                                                borderLeft: slot?.subject ? `4px solid ${getSubjectColor(slot.subject)}` : 'none',
                                                                position: 'relative',
                                                                outline: reorderMode ? '1px dashed rgba(0,0,0,0.06)' : 'none',
                                                            }}
                                                            draggable={reorderMode && slot?.subject}
                                                            onDragStart={(e) => reorderMode && slot?.subject && onDragStart(e, day, index)}
                                                            onDragEnd={(e) => reorderMode && onDragEnd(e)}
                                                            onDragOver={(e) => reorderMode && onDragOver(e, day, index)}
                                                            onDrop={(e) => reorderMode && onDrop(e, day, index)}
                                                        >
                                                            {slot?.subject ? (
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                                                        {slot.subject}
                                                                    </Typography>
                                                                    {!isLunchBreak && (
                                                                        <>
                                                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: isTablet ? '0.65rem' : '0.75rem' }}>
                                                                                {slot.teacher}
                                                                            </Typography>
                                                                            <Chip
                                                                                label={slot.room}
                                                                                size="small"
                                                                                sx={{
                                                                                    mt: 0.5,
                                                                                    height: '20px',
                                                                                    fontSize: '0.7rem',
                                                                                    backgroundColor: getSubjectColor(slot.subject),
                                                                                    color: 'white',
                                                                                }}
                                                                            />
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: 4,
                                                                                    right: 4,
                                                                                    display: 'flex',
                                                                                    gap: 0.5,
                                                                                    opacity: 0,
                                                                                    transition: 'opacity 0.2s',
                                                                                    '.MuiTableCell-root:hover &': {
                                                                                        opacity: 1,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleEditSlot(day, index);
                                                                                    }}
                                                                                    sx={{ bgcolor: 'background.paper', boxShadow: 1, p: 0.5 }}
                                                                                >
                                                                                    <EditIcon sx={{ fontSize: '0.9rem' }} />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteSlot(day, index);
                                                                                    }}
                                                                                    sx={{ bgcolor: 'background.paper', boxShadow: 1, p: 0.5 }}
                                                                                >
                                                                                    <DeleteIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                                                                                </IconButton>
                                                                            </Box>
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="caption" color="text.disabled">
                                                                    Empty
                                                                </Typography>
                                                            )}
                                                        </SubjectCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Click on any cell to edit • Toggle Reorder to drag & swap slots
                                </Typography>
                            </Box>
                        </Paper>
                    )}
                </>
            )}

            {/* Create Batch Dialog */}
            <Dialog
                open={openBatchDialog}
                onClose={() => setOpenBatchDialog(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Create New Batch
                    </Typography>
                    <IconButton onClick={() => setOpenBatchDialog(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Batch Name"
                        value={newBatch}
                        onChange={(e) => setNewBatch(e.target.value)}
                        fullWidth
                        placeholder="e.g., CSE-A, ECE-B"
                        helperText="Enter a unique batch identifier"
                        size={isMobile ? "small" : "medium"}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenBatchDialog(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateBatch}
                        variant="contained"
                        disabled={!newBatch.trim()}
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Slot Dialog */}
            <Dialog
                open={openSlotDialog}
                onClose={() => setOpenSlotDialog(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {editMode ? 'Edit Slot' : 'Add Slot'} - {currentSlot.day}
                    </Typography>
                    <IconButton onClick={() => setOpenSlotDialog(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        {/* <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel>Time Slot</InputLabel>
                            <Select
                                value={currentSlot.time}
                                onChange={(e) => setCurrentSlot({ ...currentSlot, time: e.target.value })}
                                label="Time Slot"
                                disabled={editMode}
                            >
                                {defaultTimeSlots.map((slot) => (
                                    <MenuItem key={slot} value={slot}>
                                        {slot}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl> */}
                        <TextField
                            label="Subject"
                            value={currentSlot.subject}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, subject: e.target.value })}
                            fullWidth
                            placeholder="e.g., Mathematics"
                            size={isMobile ? "small" : "medium"}
                        />
                        <TextField
                            label="Teacher"
                            value={currentSlot.teacher}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, teacher: e.target.value })}
                            fullWidth
                            placeholder="e.g., Dr. Smith"
                            size={isMobile ? "small" : "medium"}
                        />
                        <TextField
                            label="Room"
                            value={currentSlot.room}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, room: e.target.value })}
                            fullWidth
                            placeholder="e.g., Room 101"
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenSlotDialog(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveSlot}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!currentSlot.subject || !currentSlot.teacher || !currentSlot.room || !currentSlot.time}
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        {editMode ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Lunch Break Dialog */}
            <Dialog
                open={openLunchDialog}
                onClose={() => setOpenLunchDialog(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Edit Lunch Break - {currentLunchSlot.day}
                    </Typography>
                    <IconButton onClick={() => setOpenLunchDialog(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Lunch breaks can only have their time slot modified.
                        </Alert>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel>Time Slot</InputLabel>
                            <Select
                                value={currentLunchSlot.time}
                                onChange={(e) => setCurrentLunchSlot({ ...currentLunchSlot, time: e.target.value })}
                                label="Time Slot"
                            >
                                {defaultTimeSlots.map((slot) => (
                                    <MenuItem key={slot} value={slot}>
                                        {slot}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenLunchDialog(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveLunchBreak}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!currentLunchSlot.time}
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, batch: null })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete batch <strong>{deleteConfirm.batch}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirm({ open: false, batch: null })}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteBatch}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none', px: 3 }}
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
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminTimeTable;