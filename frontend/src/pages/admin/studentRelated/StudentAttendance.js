import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetails } from '../../../redux/userRelated/userHandle';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import axios from 'axios';

import {
    Box, InputLabel,
    MenuItem, Select,
    Typography, Stack,
    TextField, CircularProgress, FormControl,
    Alert, Snackbar
} from '@mui/material';
import { PurpleButton } from '../../../components/buttonStyles';

const StudentAttendance = ({ situation }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser, userDetails, loading } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);
    const params = useParams();

    const [studentID, setStudentID] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [chosenSubName, setChosenSubName] = useState("");
    const [status, setStatus] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [session, setSession] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loader, setLoader] = useState(false);

    // Available sessions - matching the session configuration system
    const availableSessions = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lab', 'Tutorial'];    const submitHandler = async (event) => {
        event.preventDefault();
        
        // Get the correct subject ID
        let subjectId = chosenSubName; // From URL params
        if (!subjectId && subjectName) {
            // Find subject ID from the selected subject name
            const selectedSubject = subjectsList.find(subject => subject.subName === subjectName);
            subjectId = selectedSubject ? selectedSubject._id : null;
        }
        
        if (!subjectId || !status || !date || !session) {
            setError("Please fill all required fields including session");
            return;
        }
        
        try {
            setLoader(true);
            setError('');

            // Get class ID from user details
            const classId = userDetails.sclassName?._id;
            if (!classId) {
                throw new Error('Class information not found');
            }

            // Use the new attendance API
            const attendanceData = {
                classId,
                subjectId,
                date,
                session,
                studentAttendance: [{
                    studentId: studentID,
                    status: status.toLowerCase() // Convert to lowercase for backend compatibility
                }],
                userRole: 'Admin'
            };            // Use the correct API endpoint
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/attendance/mark`,
                attendanceData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Attendance marked successfully!');
                
                // Navigate back after a delay
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to mark attendance');
            }

        } catch (err) {
            console.error('Error marking attendance:', err);
            setError(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setLoader(false);
        }
    };

    useEffect(() => {        if (situation === "Student") {
            setStudentID(params.id);
            const stdID = params.id;
            dispatch(getUserDetails(stdID, "Student"));
        }        else if (situation === "Subject") {
            const { studentID, subjectID } = params;
            setStudentID(studentID);
            dispatch(getUserDetails(studentID, "Student"));            setChosenSubName(subjectID);
        }
    }, [situation, params.id, dispatch]);

    useEffect(() => {
        if (userDetails && userDetails.sclassName && situation === "Student") {
            dispatch(getSubjectList(userDetails.sclassName._id, "ClassSubjects"));
        }
    }, [dispatch, userDetails, situation]);

    const changeHandler = (event) => {
        const selectedSubject = subjectsList.find(
            (subject) => subject.subName === event.target.value
        );
        
        if (selectedSubject) {
            setSubjectName(selectedSubject.subName);
            setChosenSubName(selectedSubject._id);
        }
    };

    const handleCloseError = () => setError('');
    const handleCloseSuccess = () => setSuccess('');

    return (
        <>
            {loading
                ?
                <>
                    <div>Loading...</div>
                </>
                :
                <>
                    <Box
                        sx={{
                            flex: '1 1 auto',
                            alignItems: 'center',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: 550,
                                px: 3,
                                py: '100px',
                                width: '100%'
                            }}
                        >
                            <Stack spacing={1} sx={{ mb: 3 }}>
                                <Typography variant="h4">
                                    Student Name: {userDetails.name}
                                </Typography>
                                {currentUser.teachSubject &&
                                    <Typography variant="h4">
                                        Subject Name: {currentUser.teachSubject?.subName}
                                    </Typography>
                                }
                            </Stack>
                            <form onSubmit={submitHandler}>
                                <Stack spacing={3}>
                                    {
                                        situation === "Student" &&
                                        <FormControl fullWidth>
                                            <InputLabel id="demo-simple-select-label">Select Subject</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={subjectName}
                                                label="Choose an option"
                                                onChange={changeHandler} required
                                            >
                                                {subjectsList ?
                                                    subjectsList.map((subject, index) => (
                                                        <MenuItem key={index} value={subject.subName}>
                                                            {subject.subName}
                                                        </MenuItem>
                                                    ))
                                                    :
                                                    <MenuItem value="Select Subject">
                                                        Add Subjects For Attendance
                                                    </MenuItem>
                                                }
                                            </Select>
                                        </FormControl>                                    }
                                    
                                    <FormControl fullWidth>
                                        <InputLabel id="session-select-label">Select Session</InputLabel>
                                        <Select
                                            labelId="session-select-label"
                                            id="session-select"
                                            value={session}
                                            label="Select Session"
                                            onChange={(event) => setSession(event.target.value)}
                                            required
                                        >
                                            {availableSessions.map((sessionOption) => (
                                                <MenuItem key={sessionOption} value={sessionOption}>
                                                    {sessionOption}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <TextField
                                            label="Select Date"
                                            type="date"
                                            value={date}
                                            onChange={(event) => setDate(event.target.value)} 
                                            required
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel id="status-select-label">Attendance Status</InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            id="status-select"
                                            value={status}
                                            label="Attendance Status"
                                            onChange={(event) => setStatus(event.target.value)}
                                            required
                                        >
                                            <MenuItem value="present">Present</MenuItem>
                                            <MenuItem value="absent">Absent</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <PurpleButton
                                    fullWidth
                                    size="large"
                                    sx={{ mt: 3 }}
                                    variant="contained"
                                    type="submit"
                                    disabled={loader}
                                >
                                    {loader ? <CircularProgress size={24} color="inherit" /> : "Submit"}
                                </PurpleButton>                            </form>
                        </Box>
                    </Box>

                    {/* Error Snackbar */}
                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={handleCloseError}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    </Snackbar>

                    {/* Success Snackbar */}
                    <Snackbar
                        open={!!success}
                        autoHideDuration={4000}
                        onClose={handleCloseSuccess}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                            {success}
                        </Alert>
                    </Snackbar>
                </>
            }
        </>
    )
}

export default StudentAttendance