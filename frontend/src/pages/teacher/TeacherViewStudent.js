import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Collapse, Table, TableBody, TableHead, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, TrendingUp, CalendarToday } from '@mui/icons-material';
import { calculateOverallAttendancePercentage, calculateSubjectAttendancePercentage, groupAttendanceBySubject } from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart'
import { PurpleButton, BlueButton, GreenButton } from '../../components/buttonStyles';
import { StyledTableCell, StyledTableRow } from '../../components/styles';
import axios from 'axios';

const TeacherViewStudent = () => {

    const navigate = useNavigate()
    const params = useParams()
    const dispatch = useDispatch();
    const { currentUser, userDetails, response, loading, error } = useSelector((state) => state.user);

    const address = "Student"
    const studentID = params.id
    const teachSubject = currentUser.teachSubject?.subName
    const teachSubjectID = currentUser.teachSubject?._id

    useEffect(() => {
        dispatch(getUserDetails(studentID, address));
    }, [dispatch, studentID]);

    if (response) { console.log(response) }
    else if (error) { console.log(error) }

    const [sclassName, setSclassName] = useState('');
    const [studentSchool, setStudentSchool] = useState('');
    const [subjectMarks, setSubjectMarks] = useState('');
    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [newAttendanceSummary, setNewAttendanceSummary] = useState(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));
    };

    useEffect(() => {
        if (userDetails) {
            setSclassName(userDetails.sclassName || '');
            setStudentSchool(userDetails.school || '');
            setSubjectMarks(userDetails.examResult || '');
            setSubjectAttendance(userDetails.attendance || []);
            
            // Fetch new attendance summary
            fetchNewAttendanceSummary();
        }
    }, [userDetails]);

    // Fetch new attendance summary from the new API
    const fetchNewAttendanceSummary = async () => {
        if (!studentID || !teachSubjectID) return;
        
        try {
            setLoadingAttendance(true);
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/attendance/summary/student/${studentID}?subjectId=${teachSubjectID}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setNewAttendanceSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching attendance summary:', error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const overallAbsentPercentage = 100 - overallAttendancePercentage;

    const chartData = [
        { name: 'Present', value: overallAttendancePercentage },
        { name: 'Absent', value: overallAbsentPercentage }
    ];

    return (
        <>
            {loading
                ?
                <>
                    <div>Loading...</div>
                </>
                :
                <div>
                    Name: {userDetails.name}
                    <br />
                    Roll Number: {userDetails.rollNum}
                    <br />
                    Class: {sclassName.sclassName}
                    <br />
                    School: {studentSchool.schoolName}
                    <br /><br />

                    <h3>Attendance Summary:</h3>
                    
                    {/* New Attendance Summary */}
                    {loadingAttendance ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                            <Typography sx={{ ml: 2 }}>Loading attendance summary...</Typography>
                        </Box>
                    ) : newAttendanceSummary ? (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {teachSubject} - Current Summary
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Chip 
                                    label={`Present: ${newAttendanceSummary.presentCount}`} 
                                    color="success" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Absent: ${newAttendanceSummary.absentCount}`} 
                                    color="error" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Late: ${newAttendanceSummary.lateCount}`} 
                                    color="warning" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Excused: ${newAttendanceSummary.excusedCount}`} 
                                    color="info" 
                                    variant="outlined"
                                />
                            </Box>
                            
                            <Typography variant="h5" color="primary" gutterBottom>
                                Attendance: {newAttendanceSummary.attendancePercentage?.toFixed(1)}%
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary">
                                Total Sessions: {newAttendanceSummary.totalSessions} | 
                                Last Updated: {new Date(newAttendanceSummary.lastUpdated).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            No attendance records found in the new system. Legacy data shown below.
                        </Alert>
                    )}

                    {/* Legacy Attendance Display (for backward compatibility) */}
                    {subjectAttendance && Array.isArray(subjectAttendance) && subjectAttendance.length > 0 && (
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom color="text.secondary">
                                Legacy Attendance Records
                            </Typography>
                            {Object.entries(groupAttendanceBySubject(subjectAttendance)).map(([subName, { present, allData, subId, sessions }], index) => {
                                if (subName === teachSubject) {
                                    const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);

                                    return (
                                        <Table key={index}>
                                            <TableHead>
                                                <StyledTableRow>
                                                    <StyledTableCell>Subject</StyledTableCell>
                                                    <StyledTableCell>Present</StyledTableCell>
                                                    <StyledTableCell>Total Sessions</StyledTableCell>
                                                    <StyledTableCell>Attendance Percentage</StyledTableCell>
                                                    <StyledTableCell align="center">Actions</StyledTableCell>
                                                </StyledTableRow>
                                            </TableHead>

                                            <TableBody>
                                                <StyledTableRow>
                                                    <StyledTableCell>{subName}</StyledTableCell>
                                                    <StyledTableCell>{present}</StyledTableCell>
                                                    <StyledTableCell>{sessions}</StyledTableCell>
                                                    <StyledTableCell>{subjectAttendancePercentage}%</StyledTableCell>
                                                    <StyledTableCell align="center">
                                                        <Button variant="contained" onClick={() => handleOpen(subId)}>
                                                            {openStates[subId] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}Details
                                                        </Button>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                                <StyledTableRow>
                                                    <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                        <Collapse in={openStates[subId]} timeout="auto" unmountOnExit>
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
                                                                        {allData.map((data, index) => {
                                                                            const date = new Date(data.date);
                                                                            const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
                                                                            return (
                                                                                <StyledTableRow key={index}>
                                                                                    <StyledTableCell component="th" scope="row">
                                                                                        {dateString}
                                                                                    </StyledTableCell>
                                                                                    <StyledTableCell align="right">{data.status}</StyledTableCell>
                                                                                </StyledTableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </Box>
                                                        </Collapse>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                            </TableBody>
                                        </Table>
                                    )
                                }
                                else {
                                    return null
                                }
                            })}
                            <div>
                                Overall Attendance Percentage: {overallAttendancePercentage.toFixed(2)}%
                            </div>

                            <CustomPieChart data={chartData} />
                        </Paper>
                    )}
                    <br />
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <GreenButton
                            variant="contained"
                            startIcon={<CalendarToday />}
                            onClick={() =>
                                navigate(
                                    `/Teacher/class/student/attendance/${studentID}/${teachSubjectID}`
                                )
                            }
                        >
                            Add Individual Attendance
                        </GreenButton>
                        <BlueButton
                            variant="contained"
                            onClick={() => navigate('/Teacher/attendance/mark')}
                        >
                            Mark Class Attendance
                        </BlueButton>
                    </Box>
                    <br /><br /><br />
                    <h3>Subject Marks:</h3>

                    {subjectMarks && Array.isArray(subjectMarks) && subjectMarks.length > 0 &&
                        <>
                            {subjectMarks.map((result, index) => {
                                if (result.subName.subName === teachSubject) {
                                    return (
                                        <Table key={index}>
                                            <TableHead>
                                                <StyledTableRow>
                                                    <StyledTableCell>Subject</StyledTableCell>
                                                    <StyledTableCell>Marks</StyledTableCell>
                                                </StyledTableRow>
                                            </TableHead>
                                            <TableBody>
                                                <StyledTableRow>
                                                    <StyledTableCell>{result.subName.subName}</StyledTableCell>
                                                    <StyledTableCell>{result.marksObtained}</StyledTableCell>
                                                </StyledTableRow>
                                            </TableBody>
                                        </Table>
                                    )
                                }
                                else if (!result.subName || !result.marksObtained) {
                                    return null;
                                }
                                return null
                            })}
                        </>
                    }
                    <PurpleButton variant="contained"
                        onClick={() =>
                            navigate(
                                `/Teacher/class/student/marks/${studentID}/${teachSubjectID}`
                            )}>
                        Add Marks
                    </PurpleButton>
                    <br /><br /><br />
                </div>
            }
        </>
    )
}

export default TeacherViewStudent