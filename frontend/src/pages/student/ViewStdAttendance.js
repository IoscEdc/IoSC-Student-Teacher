import React, { useEffect, useState } from 'react'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Box, Button, Collapse, Paper, Table, TableBody, TableHead, Typography, CircularProgress, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import useStudentAttendance from '../../hooks/useStudentAttendance';

import CustomBarChart from '../../components/CustomBarChart'

import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

const ViewStdAttendance = () => {
    const [openStates, setOpenStates] = useState({});
    const [selectedSection, setSelectedSection] = useState('table');

    const handleOpen = (subId) => {
        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));
    };

    const { currentUser } = useSelector((state) => state.user);
    
    // Use the new attendance API hook
    const { 
        attendanceData, 
        loading, 
        error 
    } = useStudentAttendance(currentUser?._id);

    const overallPercentage = attendanceData?.overallPercentage || 0;
    const subjects = attendanceData?.subjects || [];

    const subjectData = subjects.map(subject => ({
        subject: subject.subject,
        attendancePercentage: subject.percentage,
        totalClasses: subject.total,
        attendedClasses: subject.present
    }));

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    const renderTableSection = () => {
        return (
            <>
                <Typography variant="h4" align="center" gutterBottom>
                    Attendance
                </Typography>
                <Table>
                    <TableHead>
                        <StyledTableRow>
                            <StyledTableCell>Subject</StyledTableCell>
                            <StyledTableCell>Present</StyledTableCell>
                            <StyledTableCell>Total Sessions</StyledTableCell>
                            <StyledTableCell>Attendance Percentage</StyledTableCell>
                            <StyledTableCell align="center">Actions</StyledTableCell>
                        </StyledTableRow>
                    </TableHead>
                    {subjects.map((subject, index) => {

                        return (
                            <TableBody key={index}>
                                <StyledTableRow>
                                    <StyledTableCell>{subject.subject}</StyledTableCell>
                                    <StyledTableCell>{subject.present}</StyledTableCell>
                                    <StyledTableCell>{subject.total}</StyledTableCell>
                                    <StyledTableCell>{(subject.percentage || 0).toFixed(1)}%</StyledTableCell>
                                    <StyledTableCell align="center">
                                        <Button variant="contained"
                                            onClick={() => handleOpen(subject.subjectId)}>
                                            {openStates[subject.subjectId] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}Details
                                        </Button>
                                    </StyledTableCell>
                                </StyledTableRow>
                                <StyledTableRow>
                                    <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                        <Collapse in={openStates[subject.subjectId]} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <Typography variant="h6" gutterBottom component="div">
                                                    Attendance Details
                                                </Typography>
                                                <Table size="small" aria-label="purchases">
                                                    <TableHead>
                                                        <StyledTableRow>
                                                            <StyledTableCell>Date</StyledTableCell>
                                                            <StyledTableCell align="right">Status</StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                                        {subject.records && subject.records.length > 0 ? subject.records.map((data, recordIndex) => {
                                                            const date = new Date(data.date);
                                                            const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
                                                            const isPresent = data.status === 'present' || data.status === 'Present';
                                                            return (
                                                                <StyledTableRow key={recordIndex}>
                                                                    <StyledTableCell component="th" scope="row">
                                                                        {dateString}
                                                                    </StyledTableCell>
                                                                    <StyledTableCell align="right">
                                                                        <span style={{ 
                                                                            color: isPresent ? '#4caf50' : '#f44336',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {isPresent ? 'Present' : 'Absent'}
                                                                        </span>
                                                                    </StyledTableCell>
                                                                </StyledTableRow>
                                                            )
                                                        }) : (
                                                            <StyledTableRow>
                                                                <StyledTableCell colSpan={2} align="center">
                                                                    No attendance records found
                                                                </StyledTableCell>
                                                            </StyledTableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </Collapse>
                                    </StyledTableCell>
                                </StyledTableRow>
                            </TableBody>
                        )
                    }
                    )}
                </Table>
                <div>
                    Overall Attendance Percentage: {(overallPercentage || 0).toFixed(2)}%
                </div>
            </>
        )
    }

    const renderChartSection = () => {
        return (
            <>
                <CustomBarChart chartData={subjectData} dataKey="attendancePercentage" />
            </>
        )
    };

    return (
        <>
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                    Error loading attendance data: {error}
                </Alert>
            ) : (
                <div>
                    {subjects && subjects.length > 0 ?
                        <>
                            {selectedSection === 'table' && renderTableSection()}
                            {selectedSection === 'chart' && renderChartSection()}

                            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels>
                                    <BottomNavigationAction
                                        label="Table"
                                        value="table"
                                        icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />}
                                    />
                                    <BottomNavigationAction
                                        label="Chart"
                                        value="chart"
                                        icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />}
                                    />
                                </BottomNavigation>
                            </Paper>
                        </>
                        :
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Alert severity="info">
                                <Typography variant="h6" gutterBottom>
                                    No Attendance Records Found
                                </Typography>
                                <Typography variant="body2">
                                    Your attendance data will appear here once your teachers start marking attendance for your subjects.
                                </Typography>
                            </Alert>
                        </Box>
                    }
                </div>
            )}
        </>
    )
}

export default ViewStdAttendance