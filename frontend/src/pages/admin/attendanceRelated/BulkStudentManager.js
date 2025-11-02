import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Paper,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Stepper,
    Step,
    StepLabel,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Download as DownloadIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const BulkStudentManager = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const { currentUser } = useSelector((state) => state.user);
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [operationType, setOperationType] = useState('assign');
    
    // Assignment state
    const [assignmentData, setAssignmentData] = useState({
        pattern: '',
        classId: '',
        subjectIds: [],
        previewStudents: [],
        validationResults: null
    });
    
    // Transfer state
    const [transferData, setTransferData] = useState({
        fromClassId: '',
        toClassId: '',
        studentIds: [],
        selectedStudents: []
    });
    
    // Bulk marking state
    const [bulkMarkData, setBulkMarkData] = useState({
        classId: '',
        subjectId: '',
        date: new Date().toISOString().split('T')[0],
        session: '',
        status: 'present',
        studentIds: []
    });
    
    // Operation progress
    const [operationProgress, setOperationProgress] = useState({
        isRunning: false,
        progress: 0,
        currentOperation: '',
        results: null,
        errors: []
    });
    
    // Data - Initialize as empty arrays
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);

    const steps = ['Configure Operation', 'Preview & Validate', 'Execute & Results'];

    useEffect(() => {
        if (currentUser?._id) {
            loadInitialData();
        }
    }, [currentUser]);

    const loadInitialData = async () => {
        if (!currentUser?._id) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        try {
            const schoolId = currentUser._id;
            console.log('Loading data for school:', schoolId);

            const [classesRes, subjectsRes, studentsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/Sclasses/school/${schoolId}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/AllSubjects/${schoolId}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/Students/${schoolId}`)
            ]);
            
            console.log('Classes response:', classesRes.data);
            console.log('Subjects response:', subjectsRes.data);
            console.log('Students response:', studentsRes.data);

            // Handle different response structures
            const classesData = Array.isArray(classesRes.data) 
                ? classesRes.data 
                : (classesRes.data?.classes || classesRes.data?.data || []);
            
            const subjectsData = Array.isArray(subjectsRes.data) 
                ? subjectsRes.data 
                : (subjectsRes.data?.subjects || subjectsRes.data?.data || []);
            
            const studentsData = Array.isArray(studentsRes.data) 
                ? studentsRes.data 
                : (studentsRes.data?.students || studentsRes.data?.data || []);

            setClasses(classesData);
            setSubjects(subjectsData);
            setStudents(studentsData);

            console.log('Processed data:', {
                classes: classesData.length,
                subjects: subjectsData.length,
                students: studentsData.length
            });

        } catch (err) {
            console.error('Error loading initial data:', err);
            setError(`Failed to load initial data: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePatternValidation = async () => {
        if (!assignmentData.pattern || !assignmentData.classId) {
            setError('Please provide pattern and select a class');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/attendance/bulk/validate-pattern`,
                {
                    pattern: assignmentData.pattern,
                    classId: assignmentData.classId,
                    schoolId: currentUser._id
                }
            );
            
            setAssignmentData(prev => ({
                ...prev,
                previewStudents: response.data.matchingStudents || [],
                validationResults: response.data.validation
            }));
            
            if (response.data.matchingStudents && response.data.matchingStudents.length > 0) {
                setActiveStep(1);
                setSuccess(`Found ${response.data.matchingStudents.length} matching students`);
            } else {
                setError('No students found matching this pattern');
            }
        } catch (err) {
            console.error('Pattern validation error:', err);
            setError(err.response?.data?.message || 'Pattern validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAssignment = async () => {
        setOperationProgress({
            isRunning: true,
            progress: 0,
            currentOperation: 'Assigning students...',
            results: null,
            errors: []
        });

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/attendance/bulk/assign-students`,
                {
                    pattern: assignmentData.pattern,
                    targetClassId: assignmentData.classId,
                    subjectIds: assignmentData.subjectIds,
                    schoolId: currentUser._id
                },
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setOperationProgress(prev => ({ ...prev, progress }));
                    }
                }
            );
            
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                progress: 100,
                currentOperation: 'Assignment completed',
                results: response.data
            }));
            
            setSuccess(`Successfully assigned ${response.data.successCount || 0} students`);
            setActiveStep(2);
            
        } catch (err) {
            console.error('Bulk assignment error:', err);
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Assignment failed']
            }));
            setError(err.response?.data?.message || 'Bulk assignment failed');
        }
    };

    const handleStudentTransfer = async () => {
        if (!transferData.fromClassId || !transferData.toClassId || transferData.studentIds.length === 0) {
            setError('Please select source class, target class, and students to transfer');
            return;
        }

        setOperationProgress({
            isRunning: true,
            progress: 0,
            currentOperation: 'Transferring students...',
            results: null,
            errors: []
        });

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_BASE_URL}/attendance/bulk/transfer`,
                {
                    studentIds: transferData.studentIds,
                    fromClassId: transferData.fromClassId,
                    toClassId: transferData.toClassId,
                    migrateAttendance: true,
                    schoolId: currentUser._id
                },
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setOperationProgress(prev => ({ ...prev, progress }));
                    }
                }
            );
            
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                progress: 100,
                currentOperation: 'Transfer completed',
                results: response.data
            }));
            
            setSuccess(`Successfully transferred ${response.data.successCount || 0} students`);
            setActiveStep(2);
            
        } catch (err) {
            console.error('Student transfer error:', err);
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Transfer failed']
            }));
            setError(err.response?.data?.message || 'Student transfer failed');
        }
    };

    const handleBulkMarkAttendance = async () => {
        if (!bulkMarkData.classId || !bulkMarkData.subjectId || !bulkMarkData.date || !bulkMarkData.session) {
            setError('Please fill all required fields for bulk attendance marking');
            return;
        }

        setOperationProgress({
            isRunning: true,
            progress: 0,
            currentOperation: 'Marking attendance...',
            results: null,
            errors: []
        });

        try {
            // Build student attendance array
            const studentAttendance = bulkMarkData.studentIds.length > 0
                ? bulkMarkData.studentIds.map(studentId => ({
                    studentId,
                    status: bulkMarkData.status
                }))
                : students
                    .filter(s => s.sclassName?._id === bulkMarkData.classId || s.classId === bulkMarkData.classId)
                    .map(student => ({
                        studentId: student._id,
                        status: bulkMarkData.status
                    }));

            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/attendance/mark`,
                {
                    classId: bulkMarkData.classId,
                    subjectId: bulkMarkData.subjectId,
                    date: bulkMarkData.date,
                    session: bulkMarkData.session,
                    studentAttendance: studentAttendance
                },
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setOperationProgress(prev => ({ ...prev, progress }));
                    }
                }
            );
            
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                progress: 100,
                currentOperation: 'Attendance marking completed',
                results: response.data.data || response.data
            }));
            
            const successCount = response.data.data?.successCount || response.data.successCount || studentAttendance.length;
            setSuccess(`Successfully marked attendance for ${successCount} students`);
            setActiveStep(2);
            
        } catch (err) {
            console.error('Bulk attendance marking error:', err);
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Bulk attendance marking failed']
            }));
            setError(err.response?.data?.message || 'Bulk attendance marking failed');
        }
    };

    const resetOperation = () => {
        setActiveStep(0);
        setAssignmentData({
            pattern: '',
            classId: '',
            subjectIds: [],
            previewStudents: [],
            validationResults: null
        });
        setTransferData({
            fromClassId: '',
            toClassId: '',
            studentIds: [],
            selectedStudents: []
        });
        setBulkMarkData({
            classId: '',
            subjectId: '',
            date: new Date().toISOString().split('T')[0],
            session: '',
            status: 'present',
            studentIds: []
        });
        setOperationProgress({
            isRunning: false,
            progress: 0,
            currentOperation: '',
            results: null,
            errors: []
        });
        setError(null);
        setSuccess(null);
    };

    const renderOperationSelector = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Select Bulk Operation
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            border: operationType === 'assign' ? 2 : 1,
                            borderColor: operationType === 'assign' ? 'primary.main' : 'divider',
                            '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => {
                            setOperationType('assign');
                            resetOperation();
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AssignmentIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="h6">Student Assignment</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Assign students to classes using ID patterns
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            border: operationType === 'transfer' ? 2 : 1,
                            borderColor: operationType === 'transfer' ? 'primary.main' : 'divider',
                            '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => {
                            setOperationType('transfer');
                            resetOperation();
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PersonIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="h6">Student Transfer</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Transfer students between classes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            border: operationType === 'bulk-mark' ? 2 : 1,
                            borderColor: operationType === 'bulk-mark' ? 'primary.main' : 'divider',
                            '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => {
                            setOperationType('bulk-mark');
                            resetOperation();
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="h6">Bulk Attendance</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Mark attendance for entire class
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Paper>
    );

    const renderAssignmentForm = () => (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Student Assignment Configuration
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="University ID Pattern"
                        placeholder="e.g., CSE2021*, IT2022*, etc."
                        value={assignmentData.pattern}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, pattern: e.target.value }))}
                        helperText="Use * as wildcard. Example: CSE2021* matches CSE2021001, CSE2021002, etc."
                    />
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Target Class</InputLabel>
                        <Select
                            value={assignmentData.classId}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, classId: e.target.value }))}
                            label="Target Class"
                        >
                            {Array.isArray(classes) && classes.length > 0 ? (
                                classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id}>
                                        {cls.sclassName || cls.className || 'Unnamed Class'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No classes available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Subjects to Enroll</InputLabel>
                        <Select
                            multiple
                            value={assignmentData.subjectIds}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, subjectIds: e.target.value }))}
                            label="Subjects to Enroll"
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const subject = subjects.find(s => s._id === value);
                                        return (
                                            <Chip key={value} label={subject?.subName || value} size="small" />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {Array.isArray(subjects) && subjects.length > 0 ? (
                                subjects.map((subject) => (
                                    <MenuItem key={subject._id} value={subject._id}>
                                        {subject.subName || 'Unnamed Subject'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No subjects available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handlePatternValidation}
                            disabled={loading || !assignmentData.pattern || !assignmentData.classId}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                        >
                            {loading ? 'Validating...' : 'Validate Pattern'}
                        </Button>
                        <Button variant="outlined" onClick={resetOperation}>
                            Reset
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );

    const renderTransferForm = () => (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Student Transfer Configuration
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>From Class</InputLabel>
                        <Select
                            value={transferData.fromClassId}
                            onChange={(e) => {
                                setTransferData(prev => ({ ...prev, fromClassId: e.target.value, studentIds: [] }));
                                // Load students from this class
                                loadStudentsFromClass(e.target.value);
                            }}
                            label="From Class"
                        >
                            {Array.isArray(classes) && classes.length > 0 ? (
                                classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id}>
                                        {cls.sclassName || cls.className || 'Unnamed Class'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No classes available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>To Class</InputLabel>
                        <Select
                            value={transferData.toClassId}
                            onChange={(e) => setTransferData(prev => ({ ...prev, toClassId: e.target.value }))}
                            label="To Class"
                        >
                            {Array.isArray(classes) && classes.length > 0 ? (
                                classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id} disabled={cls._id === transferData.fromClassId}>
                                        {cls.sclassName || cls.className || 'Unnamed Class'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No classes available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Select Students to Transfer</InputLabel>
                        <Select
                            multiple
                            value={transferData.studentIds}
                            onChange={(e) => setTransferData(prev => ({ ...prev, studentIds: e.target.value }))}
                            label="Select Students to Transfer"
                            disabled={!transferData.fromClassId}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const student = students.find(s => s._id === value);
                                        return (
                                            <Chip key={value} label={student?.name || value} size="small" />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {Array.isArray(students) && students.length > 0 ? (
                                students
                                    .filter(student => student.sclassName?._id === transferData.fromClassId || student.classId === transferData.fromClassId)
                                    .map((student) => (
                                        <MenuItem key={student._id} value={student._id}>
                                            {student.name || 'Unnamed Student'} - {student.rollNum || student.universityId || 'N/A'}
                                        </MenuItem>
                                    ))
                            ) : (
                                <MenuItem disabled>
                                    {transferData.fromClassId ? 'No students in selected class' : 'Select a class first'}
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <Alert severity="info">
                        Selected {transferData.studentIds.length} student(s) will be transferred from the source class to the target class.
                    </Alert>
                </Grid>
                
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleStudentTransfer}
                            disabled={loading || !transferData.fromClassId || !transferData.toClassId || transferData.studentIds.length === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : <PersonIcon />}
                        >
                            {loading ? 'Transferring...' : 'Execute Transfer'}
                        </Button>
                        <Button variant="outlined" onClick={resetOperation}>
                            Reset
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );

    const renderBulkMarkForm = () => (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Bulk Attendance Marking Configuration
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={bulkMarkData.classId}
                            onChange={(e) => {
                                setBulkMarkData(prev => ({ ...prev, classId: e.target.value }));
                                loadStudentsFromClass(e.target.value);
                            }}
                            label="Class"
                        >
                            {Array.isArray(classes) && classes.length > 0 ? (
                                classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id}>
                                        {cls.sclassName || cls.className || 'Unnamed Class'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No classes available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={bulkMarkData.subjectId}
                            onChange={(e) => setBulkMarkData(prev => ({ ...prev, subjectId: e.target.value }))}
                            label="Subject"
                            disabled={!bulkMarkData.classId}
                        >
                            {Array.isArray(subjects) && subjects.length > 0 ? (
                                subjects.map((subject) => (
                                    <MenuItem key={subject._id} value={subject._id}>
                                        {subject.subName || 'Unnamed Subject'}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No subjects available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Date"
                        type="date"
                        value={bulkMarkData.date}
                        onChange={(e) => setBulkMarkData(prev => ({ ...prev, date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Session"
                        placeholder="e.g., Morning, Afternoon, Lecture 1"
                        value={bulkMarkData.session}
                        onChange={(e) => setBulkMarkData(prev => ({ ...prev, session: e.target.value }))}
                    />
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={bulkMarkData.status}
                            onChange={(e) => setBulkMarkData(prev => ({ ...prev, status: e.target.value }))}
                            label="Status"
                        >
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                            <MenuItem value="Late">Late</MenuItem>
                            <MenuItem value="Excused">Excused</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Select Students (Optional - leave empty for all)</InputLabel>
                        <Select
                            multiple
                            value={bulkMarkData.studentIds}
                            onChange={(e) => setBulkMarkData(prev => ({ ...prev, studentIds: e.target.value }))}
                            label="Select Students (Optional - leave empty for all)"
                            disabled={!bulkMarkData.classId}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.length === 0 ? (
                                        <Chip label="All Students" size="small" color="primary" />
                                    ) : (
                                        selected.map((value) => {
                                            const student = students.find(s => s._id === value);
                                            return (
                                                <Chip key={value} label={student?.name || value} size="small" />
                                            );
                                        })
                                    )}
                                </Box>
                            )}
                        >
                            {Array.isArray(students) && students.length > 0 ? (
                                students
                                    .filter(student => student.sclassName?._id === bulkMarkData.classId || student.classId === bulkMarkData.classId)
                                    .map((student) => (
                                        <MenuItem key={student._id} value={student._id}>
                                            {student.name || 'Unnamed Student'} - {student.rollNum || student.universityId || 'N/A'}
                                        </MenuItem>
                                    ))
                            ) : (
                                <MenuItem disabled>
                                    {bulkMarkData.classId ? 'No students in selected class' : 'Select a class first'}
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <Alert severity="info">
                        {bulkMarkData.studentIds.length === 0 
                            ? 'Attendance will be marked for ALL students in the selected class'
                            : `Attendance will be marked for ${bulkMarkData.studentIds.length} selected student(s)`
                        }
                    </Alert>
                </Grid>
                
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleBulkMarkAttendance}
                            disabled={loading || !bulkMarkData.classId || !bulkMarkData.subjectId || !bulkMarkData.date || !bulkMarkData.session}
                            startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
                        >
                            {loading ? 'Marking...' : 'Mark Attendance'}
                        </Button>
                        <Button variant="outlined" onClick={resetOperation}>
                            Reset
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );

    const loadStudentsFromClass = async (classId) => {
        if (!classId) return;
        
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/Students/${currentUser._id}`
            );
            const studentsData = Array.isArray(response.data) 
                ? response.data 
                : (response.data?.students || response.data?.data || []);
            setStudents(studentsData);
        } catch (err) {
            console.error('Error loading students:', err);
        }
    };

    const renderPreviewResults = () => {
        if (operationType === 'assign' && assignmentData.previewStudents.length > 0) {
            return (
                <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Preview: Matching Students ({assignmentData.previewStudents.length})
                    </Typography>
                    
                    {assignmentData.validationResults && (
                        <Alert 
                            severity={assignmentData.validationResults.hasConflicts ? 'warning' : 'success'}
                            sx={{ mb: 2 }}
                        >
                            {assignmentData.validationResults.message || 'Students validated successfully'}
                        </Alert>
                    )}
                    
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        <List>
                            {assignmentData.previewStudents.map((student) => (
                                <ListItem key={student._id}>
                                    <ListItemIcon>
                                        <PersonIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={student.name || 'Unknown'}
                                        secondary={`ID: ${student.universityId || student.rollNum || 'N/A'}`}
                                    />
                                    {student.conflict && (
                                        <Chip label="Conflict" color="warning" size="small" />
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleBulkAssignment}
                            disabled={operationProgress.isRunning}
                            startIcon={<AssignmentIcon />}
                        >
                            Execute Assignment
                        </Button>
                        <Button variant="outlined" onClick={() => setActiveStep(0)}>
                            Back to Configuration
                        </Button>
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const renderProgressIndicator = () => {
        if (!operationProgress.isRunning && !operationProgress.results) return null;

        return (
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Operation Progress
                </Typography>
                
                {operationProgress.isRunning && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {operationProgress.currentOperation}
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={operationProgress.progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {operationProgress.progress}% complete
                        </Typography>
                    </Box>
                )}
                
                {operationProgress.results && (
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">
                                Operation Results
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                                        <Typography variant="h6" color="success.main">
                                            {operationProgress.results.successCount || 0}
                                        </Typography>
                                        <Typography variant="body2">Successful</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <ErrorIcon color="error" sx={{ fontSize: 48 }} />
                                        <Typography variant="h6" color="error.main">
                                            {operationProgress.results.failureCount || operationProgress.results.errorCount || 0}
                                        </Typography>
                                        <Typography variant="body2">Failed</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <WarningIcon color="warning" sx={{ fontSize: 48 }} />
                                        <Typography variant="h6" color="warning.main">
                                            {operationProgress.results.warningCount || 0}
                                        </Typography>
                                        <Typography variant="body2">Warnings</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            
                            {operationProgress.errors && operationProgress.errors.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                                        Errors:
                                    </Typography>
                                    {operationProgress.errors.map((error, index) => (
                                        <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                            {error}
                                        </Alert>
                                    ))}
                                </Box>
                            )}

                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button variant="contained" onClick={resetOperation}>
                                    Start New Operation
                                </Button>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}
            </Paper>
        );
    };

    if (loading && classes.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading data...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Bulk Student Management
                </Typography>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={loadInitialData} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Progress Stepper */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Step Content */}
            {activeStep === 0 && (
                <>
                    {renderOperationSelector()}
                    {operationType === 'assign' && renderAssignmentForm()}
                    {operationType === 'transfer' && renderTransferForm()}
                    {operationType === 'bulk-mark' && renderBulkMarkForm()}
                </>
            )}

            {activeStep === 1 && renderPreviewResults()}

            {activeStep === 2 && renderProgressIndicator()}

            {/* Progress Indicator for Running Operations */}
            {operationProgress.isRunning && renderProgressIndicator()}
        </Box>
    );
};

export default BulkStudentManager;