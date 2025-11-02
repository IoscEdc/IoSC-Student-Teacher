import React, { useEffect, useState } from "react";
import { 
    Button, 
    TextField, 
    Grid, 
    Box, 
    Typography, 
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material";
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import Popup from '../../../components/Popup';
import api from '../../../api/axiosConfig';

const SubjectForm = () => {
    const [subjects, setSubjects] = useState([{ subName: "", subCode: "", teacherId: "" }]);
    const [teachers, setTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();

    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error } = userState;

    const sclassName = params.id;
    const adminID = currentUser._id;
    const address = "Subject";

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false);

    // Fetch teachers on component mount
    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoadingTeachers(true);
        try {
            const response = await api.get('/teachers', {
                params: {
                    school: adminID,
                    isActive: true
                }
            });
            
            if (response.data.success) {
                setTeachers(response.data.teachers || []);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setMessage('Failed to fetch teachers');
            setShowPopup(true);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const handleSubjectNameChange = (index) => (event) => {
        const newSubjects = [...subjects];
        newSubjects[index].subName = event.target.value;
        setSubjects(newSubjects);
    };

    const handleSubjectCodeChange = (index) => (event) => {
        const newSubjects = [...subjects];
        newSubjects[index].subCode = event.target.value;
        setSubjects(newSubjects);
    };

    const handleTeacherChange = (index) => (event) => {
        const newSubjects = [...subjects];
        newSubjects[index].teacherId = event.target.value;
        setSubjects(newSubjects);
    };

    const handleAddSubject = () => {
        setSubjects([...subjects, { subName: "", subCode: "", teacherId: "" }]);
    };

    const handleRemoveSubject = (index) => () => {
        const newSubjects = [...subjects];
        newSubjects.splice(index, 1);
        setSubjects(newSubjects);
    };

    const fields = {
        sclassName,
        subjects: subjects.map((subject) => ({
            subName: subject.subName,
            subCode: subject.subCode,
            teacher: subject.teacherId, // Removed || null
        })),
        adminID,
    };

    const submitHandler = (event) => {
        event.preventDefault();
        setLoader(true);
        dispatch(addStuff({ fields, address }));
    };

    useEffect(() => {
        if (status === 'added') {
            navigate("/Admin/subjects");
            dispatch(underControl());
            setLoader(false);
        }
        else if (status === 'failed') {
            setMessage(response);
            setShowPopup(true);
            setLoader(false);
        }
        else if (status === 'error') {
            setMessage("Network Error");
            setShowPopup(true);
            setLoader(false);
        }
    }, [status, navigate, error, response, dispatch]);

    return (
        <form onSubmit={submitHandler}>
            <Box mb={2}>
                <Typography variant="h6">Add Subjects</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Class: {sclassName} | Available Teachers: {teachers.length}
                </Typography>
            </Box>
            <Grid container spacing={2}>
                {subjects.map((subject, index) => (
                    <React.Fragment key={index}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Subject Name"
                                variant="outlined"
                                value={subject.subName}
                                onChange={handleSubjectNameChange(index)}
                                sx={styles.inputField}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="Subject Code"
                                variant="outlined"
                                value={subject.subCode}
                                onChange={handleSubjectCodeChange(index)}
                                sx={styles.inputField}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth sx={styles.inputField} required>
                                <InputLabel id={`teacher-label-${index}`}>
                                    Teacher
                                </InputLabel>
                                <Select
                                    labelId={`teacher-label-${index}`}
                                    id={`teacher-${index}`}
                                    value={subject.teacherId}
                                    label="Teacher"
                                    onChange={handleTeacherChange(index)}
                                    disabled={loadingTeachers}
                                    required // Added required
                                >
                                    {/* Removed the "None" MenuItem */}
                                    {teachers.map((teacher) => (
                                        <MenuItem key={teacher._id} value={teacher._id}>
                                            {teacher.name} 
                                            {teacher.department && ` (${teacher.department})`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Box display="flex" alignItems="center" height="100%">
                                {index === 0 ? (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={handleAddSubject}
                                        fullWidth
                                    >
                                        Add Subject
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleRemoveSubject(index)}
                                        fullWidth
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Box>
                        </Grid>
                    </React.Fragment>
                ))}
                
                {teachers.length === 0 && !loadingTeachers && (
                    <Grid item xs={12}>
                        <Box 
                            sx={{ 
                                p: 2, 
                                bgcolor: '#fff3cd', 
                                borderRadius: 1,
                                border: '1px solid #ffc107'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">
                                ⚠️ No teachers found. 
                                You cannot add subjects without available teachers.
                            </Typography>
                        </Box>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end">
                        <Button 
                            variant="contained" 
                            color="primary" 
                            type="submit" 
                            disabled={loader || loadingTeachers || teachers.length === 0} // Disable if no teachers
                        >
                            {loader ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </Box>
                </Grid>
                <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
            </Grid>
        </form>
    );
}

export default SubjectForm;

const styles = {
    inputField: {
        '& .MuiInputLabel-root': {
            color: '#838080',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#838080',
        },
    },
};