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
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
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
  const [tabValue, setTabValue] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, batch: null });

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

  const fetchBatches = async () => {
    try {
      const response = await axios.get('/api/timetables/batches');
      setBatches(response.data);
      if (response.data.length > 0) {
        setSelectedBatch(response.data[0].batch);
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
      setTimetableData(response.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      // Mock data for demo
      setTimetableData({
        batch: batch,
        timetable: {
          Monday: [
            { time: '09:00 - 10:00', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
            { time: '10:00 - 11:00', subject: 'Physics', teacher: 'Prof. Johnson', room: 'Lab 2' },
            { time: '11:00 - 12:00', subject: 'Chemistry', teacher: 'Dr. Williams', room: 'Lab 1' },
            { time: '12:00 - 01:00', subject: 'Lunch Break', teacher: '-', room: '-' },
            { time: '01:00 - 02:00', subject: 'English', teacher: 'Ms. Brown', room: 'Room 205' },
            { time: '02:00 - 03:00', subject: 'Computer Science', teacher: 'Mr. Davis', room: 'Computer Lab' },
          ],
          Tuesday: [
            { time: '09:00 - 10:00', subject: 'Chemistry', teacher: 'Dr. Williams', room: 'Lab 1' },
            { time: '10:00 - 11:00', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
            { time: '11:00 - 12:00', subject: 'Physical Education', teacher: 'Coach Wilson', room: 'Playground' },
            { time: '12:00 - 01:00', subject: 'Lunch Break', teacher: '-', room: '-' },
            { time: '01:00 - 02:00', subject: 'Biology', teacher: 'Dr. Taylor', room: 'Lab 3' },
            { time: '02:00 - 03:00', subject: 'History', teacher: 'Mr. Anderson', room: 'Room 302' },
          ],
          Wednesday: [
            { time: '09:00 - 10:00', subject: 'Physics', teacher: 'Prof. Johnson', room: 'Lab 2' },
            { time: '10:00 - 11:00', subject: 'English', teacher: 'Ms. Brown', room: 'Room 205' },
            { time: '11:00 - 12:00', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
            { time: '12:00 - 01:00', subject: 'Lunch Break', teacher: '-', room: '-' },
            { time: '01:00 - 02:00', subject: 'Computer Science', teacher: 'Mr. Davis', room: 'Computer Lab' },
            { time: '02:00 - 03:00', subject: 'Geography', teacher: 'Ms. Martinez', room: 'Room 401' },
          ],
          Thursday: [
            { time: '09:00 - 10:00', subject: 'Biology', teacher: 'Dr. Taylor', room: 'Lab 3' },
            { time: '10:00 - 11:00', subject: 'Chemistry', teacher: 'Dr. Williams', room: 'Lab 1' },
            { time: '11:00 - 12:00', subject: 'English', teacher: 'Ms. Brown', room: 'Room 205' },
            { time: '12:00 - 01:00', subject: 'Lunch Break', teacher: '-', room: '-' },
            { time: '01:00 - 02:00', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
            { time: '02:00 - 03:00', subject: 'Art', teacher: 'Ms. Garcia', room: 'Art Room' },
          ],
          Friday: [
            { time: '09:00 - 10:00', subject: 'Computer Science', teacher: 'Mr. Davis', room: 'Computer Lab' },
            { time: '10:00 - 11:00', subject: 'Physics', teacher: 'Prof. Johnson', room: 'Lab 2' },
            { time: '11:00 - 12:00', subject: 'History', teacher: 'Mr. Anderson', room: 'Room 302' },
            { time: '12:00 - 01:00', subject: 'Lunch Break', teacher: '-', room: '-' },
            { time: '01:00 - 02:00', subject: 'Biology', teacher: 'Dr. Taylor', room: 'Lab 3' },
            { time: '02:00 - 03:00', subject: 'Physical Education', teacher: 'Coach Wilson', room: 'Playground' },
          ],
        }
      });
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

      await axios.post('/api/timetables', emptyTimetable);
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
      await axios.delete(`/api/timetables/${deleteConfirm.batch}`);
      showSnackbar('Batch deleted successfully', 'success');
      setBatches(batches.filter(b => b.batch !== deleteConfirm.batch));
      if (selectedBatch === deleteConfirm.batch) {
        setSelectedBatch(batches[0]?.batch || '');
      }
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
        // Add new slot
        updatedTimetable.timetable[currentSlot.day].push({
          time: currentSlot.time,
          subject: currentSlot.subject,
          teacher: currentSlot.teacher,
          room: currentSlot.room
        });
      }

      await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
      setTimetableData(updatedTimetable);
      showSnackbar(editMode ? 'Slot updated successfully' : 'Slot added successfully', 'success');
      setOpenSlotDialog(false);
    } catch (error) {
      console.error('Error saving slot:', error);
      // For demo
      const updatedTimetable = { ...timetableData };
      if (editMode) {
        updatedTimetable.timetable[currentSlot.day][currentSlot.slotIndex] = {
          time: currentSlot.time,
          subject: currentSlot.subject,
          teacher: currentSlot.teacher,
          room: currentSlot.room
        };
      }
      setTimetableData(updatedTimetable);
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
      setTimetableData(updatedTimetable);
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
      setTimetableData(updatedTimetable);
      showSnackbar('Lunch break updated (demo)', 'success');
      setOpenLunchDialog(false);
    }
  };

  const handleDeleteSlot = async (day, slotIndex) => {
    try {
      const updatedTimetable = { ...timetableData };
      updatedTimetable.timetable[day].splice(slotIndex, 1);
      
      await axios.put(`http://localhost:5000/TimeTable/${selectedBatch}`, updatedTimetable);
      setTimetableData(updatedTimetable);
      showSnackbar('Slot deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting slot:', error);
      const updatedTimetable = { ...timetableData };
      updatedTimetable.timetable[day].splice(slotIndex, 1);
      setTimetableData(updatedTimetable);
      showSnackbar('Slot deleted (demo)', 'success');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': '#2196F3',
      'Physics': '#9C27B0',
      'Chemistry': '#4CAF50',
      'Biology': '#FF9800',
      'English': '#F44336',
      'Computer Science': '#00BCD4',
      'History': '#795548',
      'Geography': '#009688',
      'Physical Education': '#8BC34A',
      'Art': '#E91E63',
      'Lunch Break': '#9E9E9E',
    };
    return colors[subject] || '#607D8B';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Timetable Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
                  <MenuItem key={batch.batch} value={batch.batch}>
                    {batch.batch}
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
                      const slot = timetableData.timetable[day]?.[index];
                      const isLunchBreak = slot?.subject === 'Lunch Break';
                      return (
                        <SubjectCell
                          key={day}
                          align="center"
                          onClick={() => slot && handleEditSlot(day, index)}
                          sx={{
                            backgroundColor: isLunchBreak ? '#f5f5f5' : 'transparent',
                            borderLeft: slot?.subject ? `4px solid ${getSubjectColor(slot.subject)}` : 'none',
                            position: 'relative',
                          }}
                        >
                          {slot ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {slot.subject}
                              </Typography>
                              {!isLunchBreak && (
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
              Click on any cell to edit • Hover to see edit/delete options
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
              Lunch breaks can onlyhave their time slot modified.
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