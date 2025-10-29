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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    SwapHoriz as SwapIcon,
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

    // NEW: reorder mode state and drag highlight
    const [reorderMode, setReorderMode] = useState(false);
    const [dragOverCell, setDragOverCell] = useState(null); // { day, index }

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

    // Ensure timetable arrays align with defaultTimeSlots length
    const normalizeTimetable = (raw) => {
        if (!raw || !raw.timetable) return raw;
        const copy = { ...raw, timetable: { ...raw.timetable } };
        days.forEach((day, i) => {
            const arr = Array.isArray(copy.timetable[day]) ? [...copy.timetable[day]] : [];
            // create placeholders up to defaultTimeSlots.length
            const normalized = defaultTimeSlots.map((time, idx) => {
                const existing = arr[idx];
                if (existing) {
                    // Ensure time field exists (if backend had different times)
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
            console.log(response.data);
            setBatches(response.data.batches);
            if (response.data.batches.length > 0) {
                setSelectedBatch(response.data.batches[0]);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            // Mock data for demo
            const mockBatches = [
                { batch: 'BatchA' },
                { batch: 'CSE-B' },
                { batch: 'ECE-A' }
            ];
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
            // Create empty timetable for new batch
            const emptyTimetable = {
                batch: newBatch,
                timetable: {
                    Monday: [
                        { time: "09:00 - 11:00", subject: "Operating Systems (ARD 203)", teacher: "Ms. Ritu Kalonia", room: "A-005 Lecture Hall" },
                        { time: "11:00 - 12:00", subject: "Essential Mathematics for AI (ARD 201)", teacher: "Prof. Abha Aggarwal", room: "A-005 Lecture Hall" },
                        { time: "12:00 - 13:00", subject: "Data Structures (ARD 209)", teacher: "Dr. Amrit Pal Singh", room: "A-005 Lecture Hall" },
                        { time: "13:00 - 14:00", subject: "Lunch Break", teacher: "-", room: "-" },
                        { time: "14:00 - 15:00", subject: "Foundation of Computer Science (ARD 207)", teacher: "Dr. Ruchika Sehgal", room: "A-005 Lecture Hall" },
                        { time: "15:00 - 16:00", subject: "Database Management System (ARD 205)", teacher: "Dr. Renu Dalal", room: "A-005 Lecture Hall" }
                    ],

                    Tuesday: [
                        { time: "09:00 - 10:00", subject: "Database Management System (ARD 205)", teacher: "Dr. Renu Dalal", room: "A-005 Lecture Hall" },
                        { time: "10:00 - 12:00", subject: "JAVA Lab (ARD 251)", teacher: "Dr. Amar Arora", room: "A-007 Computer Lab" },
                        { time: "12:00 - 13:00", subject: "Data Structures Lab (ARD 255)", teacher: "Dr. Amrit Pal Singh", room: "AUB-04 Computer Lab" },
                        { time: "13:00 - 14:00", subject: "Lunch Break", teacher: "-", room: "-" },
                        { time: "14:00 - 15:00", subject: "Essential Mathematics for AI (ARD 201)", teacher: "Prof. Abha Aggarwal", room: "A-005 Lecture Hall" },
                        { time: "15:00 - 16:00", subject: "Operating Systems (ARD 203)", teacher: "Ms. Ritu Kalonia", room: "A-005 Lecture Hall" },
                        { time: "16:00 - 17:00", subject: "Data Structures (ARD 209)", teacher: "Dr. Amrit Pal Singh", room: "A-005 Lecture Hall" }
                    ],

                    Wednesday: [
                        { time: "09:00 - 11:00", subject: "Foundation of Computer Science (ARD 207)", teacher: "Dr. Ruchika Sehgal", room: "A-005 Lecture Hall" },
                        { time: "11:00 - 12:00", subject: "Essential Mathematics for AI (ARD 201)", teacher: "Prof. Abha Aggarwal", room: "A-005 Lecture Hall" },
                        { time: "12:00 - 13:00", subject: "Database Management System (ARD 205)", teacher: "Dr. Renu Dalal", room: "A-005 Lecture Hall" },
                        { time: "13:00 - 14:00", subject: "Lunch Break", teacher: "-", room: "-" },
                        { time: "14:00 - 16:00", subject: "Accountancy for Engineers (MSAI 211)", teacher: "Ms. Kanika Jindal", room: "A-004 Lecture Hall" }
                    ],

                    Thursday: [
                        { time: "09:00 - 10:00", subject: "Foundation of Computer Science (ARD 207)", teacher: "Dr. Ruchika Sehgal", room: "A-005 Lecture Hall" },
                        { time: "10:00 - 12:00", subject: "JAVA Lab (ARD 251)", teacher: "Dr. Amar Arora", room: "A-204 Computer Lab" },
                        { time: "12:00 - 13:00", subject: "Data Structures Lab (ARD 255)", teacher: "Dr. Amrit Pal Singh", room: "AUB-04 Computer Lab" },
                        { time: "13:00 - 14:00", subject: "Lunch Break", teacher: "-", room: "-" },
                        { time: "14:00 - 15:00", subject: "Database Management System Lab (ARD 253)", teacher: "Dr. Renu Dalal", room: "A-203 Computer Lab" },
                        { time: "15:00 - 16:00", subject: "Database Management System Lab (ARD 253)", teacher: "Dr. Renu Dalal", room: "A-203 Computer Lab" }
                    ],

                    Friday: [
                        { time: "09:00 - 11:00", subject: "JAVA Lab (ARD 251)", teacher: "Dr. Amar Arora", room: "A-007 Computer Lab" },
                        { time: "11:00 - 12:00", subject: "Essential Mathematics for AI (ARD 201)", teacher: "Prof. Abha Aggarwal", room: "A-005 Lecture Hall" },
                        { time: "12:00 - 13:00", subject: "Lunch Break", teacher: "-", room: "-" },
                        { time: "13:00 - 14:00", subject: "Accountancy for Engineers (MSAI 211)", teacher: "Ms. Kanika Jindal", room: "A-005 Lecture Hall" },
                        { time: "14:00 - 15:00", subject: "Operating Systems (ARD 203)", teacher: "Ms. Ritu Kalonia", room: "A-005 Lecture Hall" },
                        { time: "15:00 - 16:00", subject: "Data Structures (ARD 209)", teacher: "Dr. Amrit Pal Singh", room: "A-005 Lecture Hall" }
                    ]
                }
            };


            await axios.post('http://localhost:5000/batches', emptyTimetable);
            showSnackbar('Batch created successfully', 'success');
            setOpenBatchDialog(false);
            setNewBatch('');
            fetchBatches();
        } catch (error) {
            console.error('Error creating batch:', error);
            // For demo
            setBatches([...batches, { batch: newBatch }]);
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
            // setBatches(batches.filter(b => b.batch !== deleteConfirm.batch));
            // if (selectedBatch === deleteConfirm.batch) {
            //     setSelectedBatch(batches[0]?.batch || '');
            // }
        } catch (error) {
            console.error('Error deleting batch:', error);
            // For demo
            setBatches(batches.filter(b => b.batch !== deleteConfirm.batch));
            showSnackbar('Batch deleted (demo)', 'success');
        }
        setDeleteConfirm({ open: false, batch: null });
    };

    const handleEditSlot = (day, slotIndex) => {
        const slot = timetableData.timetable[day][slotIndex];

        if (slot.subject === 'Lunch Break') {
            setCurrentLunchSlot({
                day,
                slotIndex,
                time: slot.time
            });
            setOpenLunchDialog(true);
        } else {
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
        }
    };

    const handleAddSlot = (day) => {
        setCurrentSlot({
            day,
            slotIndex: -1,
            time: '',
            subject: '',
            teacher: '',
            room: ''
        });
        setEditMode(false);
        setOpenSlotDialog(true);
    };

    const handleSaveSlot = async () => {
        if (!currentSlot.subject || !currentSlot.teacher || !currentSlot.room || !currentSlot.time) {
            showSnackbar('Please fill all fields', 'error');
            return;
        }

        try {
            const updatedTimetable = { ...timetableData };

            if (editMode) {
                // Update existing slot
                updatedTimetable.timetable[currentSlot.day][currentSlot.slotIndex] = {
                    time: currentSlot.time,
                    subject: currentSlot.subject,
                    teacher: currentSlot.teacher,
                    room: currentSlot.room
                };
            } else {
                // Add new slot appended to end of the day
                updatedTimetable.timetable[currentSlot.day].push({
                    time: currentSlot.time,
                    subject: currentSlot.subject,
                    teacher: currentSlot.teacher,
                    room: currentSlot.room
                });
            }

            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar(editMode ? 'Slot updated successfully' : 'Slot added successfully', 'success');
            setOpenSlotDialog(false);
        } catch (error) {
            console.error('Error saving slot:', error);
            // For demo fallback
            const updatedTimetable = { ...timetableData };
            if (editMode) {
                updatedTimetable.timetable[currentSlot.day][currentSlot.slotIndex] = {
                    time: currentSlot.time,
                    subject: currentSlot.subject,
                    teacher: currentSlot.teacher,
                    room: currentSlot.room
                };
            } else {
                updatedTimetable.timetable[currentSlot.day].push({
                    time: currentSlot.time,
                    subject: currentSlot.subject,
                    teacher: currentSlot.teacher,
                    room: currentSlot.room
                });
            }
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar(editMode ? 'Slot updated (demo)' : 'Slot added (demo)', 'success');
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
            // For demo
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[currentLunchSlot.day][currentLunchSlot.slotIndex] = {
                time: currentLunchSlot.time,
                subject: 'Lunch Break',
                teacher: '-',
                room: '-'
            };
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar('Lunch break updated (demo)', 'success');
            setOpenLunchDialog(false);
        }
    };

    const handleDeleteSlot = async (day, slotIndex) => {
        try {
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[day].splice(slotIndex, 1);

            const normalized = normalizeTimetable(updatedTimetable);
            await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, normalized);
            setTimetableData(normalized);
            showSnackbar('Slot deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting slot:', error);
            const updatedTimetable = { ...timetableData };
            updatedTimetable.timetable[day].splice(slotIndex, 1);
            setTimetableData(normalizeTimetable(updatedTimetable));
            showSnackbar('Slot deleted (demo)', 'success');
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
    return colors[subject] || '#607D8B'; // Default color if subject not found
};


    // ---------- Drag and Drop handlers (NEW) ----------
    // dragData encoded as JSON: { day, index }
    const onDragStart = (e, day, index) => {
        e.dataTransfer.effectAllowed = 'move';
        // store dragging info
        e.dataTransfer.setData('application/json', JSON.stringify({ day, index }));
        // small visual hint
        e.currentTarget.style.opacity = '0.5';
    };

    const onDragEnd = (e) => {
        // cleanup visuals
        e.currentTarget.style.opacity = '1';
        setDragOverCell(null);
        handleDragEnd(e);
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDragOverCell(null);
    };



    const onDragOver = (e, day, index) => {
        if (!reorderMode) return;
        e.preventDefault(); // allow drop
        setDragOverCell({ day, index });
    };

    const onDrop = (e, day, index) => {
        e.preventDefault();

        // Parse drag data
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        const { day: sourceDay, index: sourceIndex } = dragData;

        const updatedTimetable = { ...timetableData };
        const movedSlot = { ...updatedTimetable.timetable[sourceDay][sourceIndex] };

        // Check if source or destination slot is invalid
        if (!movedSlot) {
            console.error('Invalid moved slot:', dragData);
            return;
        }

        if (sourceDay === day) {
            // ✅ Same-day reorder
            updatedTimetable.timetable[day].splice(sourceIndex, 1);
            updatedTimetable.timetable[day].splice(index, 0, movedSlot);
        } else {
            // ✅ Move across days
            updatedTimetable.timetable[day].splice(index, 0, movedSlot);

            // Make old position empty
            updatedTimetable.timetable[sourceDay][sourceIndex] = {
                subject: '',
                teacher: '',
                time: '',
                room: '',
            };
        }

        setTimetableData(updatedTimetable);
        showSnackbar('Slot moved successfully', 'success');
    };


    // Save the current timetable layout to backend
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

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Timetable Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant={reorderMode ? 'contained' : 'outlined'}
                        startIcon={<SwapIcon />}
                        onClick={() => setReorderMode(!reorderMode)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        {reorderMode ? 'Reorder: ON' : 'Reorder: OFF'}
                    </Button>

                    {reorderMode && (
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveLayout}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Save Layout
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenBatchDialog(true)}
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
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Delete Batch
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Batch Selector */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Select Batch</InputLabel>
                            <Select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                label="Select Batch"
                            >
                                {batches.map((batch) => (
                                    <MenuItem key={batch} value={batch}>
                                        {batch}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {timetableData.batch} - Weekly Schedule
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Time</StyledTableCell>
                                    {days.map((day) => (
                                        <StyledTableCell key={day} align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{day}</span>
                                                <Tooltip title="Add slot">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAddSlot(day)}
                                                        sx={{ color: 'white', ml: 1 }}
                                                    >
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </StyledTableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {defaultTimeSlots.map((timeSlot, index) => (
                                    <TableRow key={timeSlot}>
                                        <TimeSlotCell component="th" scope="row">
                                            {timeSlot}
                                        </TimeSlotCell>
                                        {days.map((day) => {
                                            // ensure we have a slot object at this index
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
                                                        // Visual indicator when reorder mode active
                                                        outline: reorderMode ? '1px dashed rgba(0,0,0,0.06)' : 'none',
                                                    }}
                                                    // Drag & Drop props
                                                    draggable={reorderMode}
                                                    onDragStart={(e) => reorderMode && onDragStart(e, day, index)}
                                                    onDragEnd={(e) => reorderMode && onDragEnd(e)}
                                                    onDragOver={(e) => reorderMode && onDragOver(e, day, index)}
                                                    onDrop={(e) => reorderMode && onDrop(e, day, index)}
                                                >
                                                    {slot ? (
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                {slot.subject || <span style={{ color: '#9e9e9e' }}>Empty</span>}
                                                            </Typography>
                                                            {!isLunchBreak && slot.subject && (
                                                                <>
                                                                    <Typography variant="caption" display="block" color="text.secondary">
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
                                                            {isLunchBreak && (
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
                                                                </Box>
                                                            )}
                                                            {/* When slot empty and reorderMode on, show hint */}
                                                            {!slot.subject && reorderMode && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Drop a slot here
                                                                </Typography>
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

                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                            Click on any cell to edit • Hover to see edit/delete options • Toggle Reorder to drag & swap slots
                        </Typography>
                    </Box>
                </Paper>
            )}

            {/* Create Batch Dialog */}
            <Dialog
                open={openBatchDialog}
                onClose={() => setOpenBatchDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
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
                        placeholder="e.g., CSE-A, ECE-B, ME-A"
                        helperText="Enter a unique batch identifier"
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

            {/* Edit/Add Slot Dialog */}
            <Dialog
                open={openSlotDialog}
                onClose={() => setOpenSlotDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
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
                        <FormControl fullWidth>
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
                        </FormControl>
                        <TextField
                            label="Subject"
                            value={currentSlot.subject}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, subject: e.target.value })}
                            fullWidth
                            placeholder="e.g., Mathematics, Physics"
                        />
                        <TextField
                            label="Teacher"
                            value={currentSlot.teacher}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, teacher: e.target.value })}
                            fullWidth
                            placeholder="e.g., Dr. Smith"
                        />
                        <TextField
                            label="Room"
                            value={currentSlot.room}
                            onChange={(e) => setCurrentSlot({ ...currentSlot, room: e.target.value })}
                            fullWidth
                            placeholder="e.g., Room 101, Lab 2"
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
                PaperProps={{ sx: { borderRadius: 2 } }}
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
                        <FormControl fullWidth>
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
