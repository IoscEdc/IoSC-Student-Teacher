import React, { useState } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    FormControl,
    InputLabel,
    Select ,
    MenuItem,
    Box,
    Chip,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect } from 'react';
import axios from 'axios';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
}));

const TimeSlotCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
    minWidth: '100px',
}));

const SubjectCell = styled(TableCell)(({ theme }) => ({
    padding: '12px',
    minWidth: '120px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StudentTimeTable = () => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');


    const [timetableData, setTimeTableData] = useState(null);

    useEffect(() => {
        // axios.get("http://localhost:5000/TimeTable/AIML")
        //     .then(res => {
        //         console.log("Timetable data fetched:", res.data);
        //         setTimeTableData(res.data.timetable);
        //         setLoading(false);
        //     })
        //     .catch(err => console.error(err));
        fetchBatches();

    }, []);

    useEffect(() => {
        if (selectedBatch) {
            fetchTimetable(selectedBatch);
        }
    }, [selectedBatch]);

    const fetchTimetable = async (batch) => {
        try {
            const response = await axios.get(`http://localhost:5000/TimeTable/${batch}`);
            setTimeTableData(response.data.timetable);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching timetable:', error);

        }
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

    if (loading || !timetableData) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Loading Timetable...</Typography>
            </Box>
        );
    }

    const days = Object.keys(timetableData);
    const timeSlots = timetableData[days[0]].map(slot => slot.time);

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



    const handleCellClick = (day, classInfo) => {
        if (classInfo.subject !== 'Lunch Break') {
            setSelectedClass({ day, ...classInfo });
        }
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Weekly Time Table
            </Typography>

            {selectedClass && (
                <Card sx={{ mb: 3, backgroundColor: getSubjectColor(selectedClass.subject), color: 'white' }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Typography variant="h6">{selectedClass.subject}</Typography>
                                <Typography variant="body2">{selectedClass.day}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Teacher</Typography>
                                <Typography variant="body1">{selectedClass.teacher}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Time</Typography>
                                <Typography variant="body1">{selectedClass.time}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Room</Typography>
                                <Typography variant="body1">{selectedClass.room}</Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

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

            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>Time</StyledTableCell>
                            {days.map((day) => (
                                <StyledTableCell key={day} align="center">
                                    {day}
                                </StyledTableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {timeSlots.map((timeSlot, index) => (
                            <TableRow key={timeSlot}>
                                <TimeSlotCell component="th" scope="row">
                                    {timeSlot}
                                </TimeSlotCell>

                                {days.map((day) => {
                                    const classInfo = timetableData[day][index];

                                    // If classInfo doesn't exist, render an empty cell
                                    if (!classInfo) {
                                        return <SubjectCell key={day} align="center" />;
                                    }

                                    const isLunchBreak = classInfo.subject === 'Lunch Break';

                                    return (
                                        <SubjectCell
                                            key={day}
                                            align="center"
                                            onClick={() => handleCellClick(day, classInfo)}
                                            sx={{
                                                backgroundColor: isLunchBreak ? '#f5f5f5' : 'transparent',
                                                borderLeft: `4px solid ${getSubjectColor(classInfo.subject)}`,
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                    {classInfo.subject}
                                                </Typography>
                                                {!isLunchBreak && (
                                                    <>
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            {classInfo.teacher}
                                                        </Typography>
                                                        <Chip
                                                            label={classInfo.room}
                                                            size="small"
                                                            sx={{
                                                                mt: 0.5,
                                                                height: '20px',
                                                                fontSize: '0.7rem',
                                                                backgroundColor: getSubjectColor(classInfo.subject),
                                                                color: 'white',
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </Box>
                                        </SubjectCell>
                                    );
                                })}
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Click on any class to view details
                </Typography>
            </Box>
        </Box>
    );
};

export default StudentTimeTable;