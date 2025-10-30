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
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    Upload as UploadIcon,
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
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const BulkStudentManager = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch();
    
    const { currentUser } = useSelector((state) => state.user);
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [operationType, setOperationType] = useState('assign'); // 'assign', 'transfer', 'bulk-mark'
    
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
    
    // Data
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    
    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({ open: false, data: null });
    const [resultsDialog, setResultsDialog] = useState({ open: false, data: null });

    const steps = ['Configure Operation', 'Preview & Validate', 'Execute & Results'];

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [classesRes, subjectsRes, studentsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/AllSubjects/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/Students/${currentUser.school}`)
            ]);
            
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err) {
            setError('Failed to load initial data');
            console.error('Error loading initial data:', err);
        }
    };

    const handlePatternValidation = async () => {
        if (!assignmentData.pattern || !assignmentData.classId) {
            setError('Please provide pattern and select a class');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/bulk/validate-pattern`,
                {
                    pattern: assignmentData.pattern,
                    classId: assignmentData.classId,
                    schoolId: currentUser.school
                }
            );
            
            setAssignmentData(prev => ({
                ...prev,
                previewStudents: response.data.matchingStudents,
                validationResults: response.data.validation
            }));
            
            if (response.data.matchingStudents.length > 0) {
                setActiveStep(1);
            }
        } catch (err) {
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
                `${process.env.REACT_APP_BASE_URL}/api/attendance/bulk/assign-students`,
                {
                    pattern: assignmentData.pattern,
                    classId: assignmentData.classId,
                    subjectIds: assignmentData.subjectIds,
                    schoolId: currentUser.school
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
            
            setSuccess(`Successfully assigned ${response.data.successCount} students`);
            setActiveStep(2);
            
        } catch (err) {
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Assignment failed']
            }));
            setError('Bulk assignment failed');
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
                `${process.env.REACT_APP_BASE_URL}/api/attendance/bulk/transfer`,
                {
                    studentIds: transferData.studentIds,
                    fromClassId: transferData.fromClassId,
                    toClassId: transferData.toClassId,
                    schoolId: currentUser.school
                }
            );
            
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                progress: 100,
                currentOperation: 'Transfer completed',
                results: response.data
            }));
            
            setSuccess(`Successfully transferred ${response.data.successCount} students`);
            setActiveStep(2);
            
        } catch (err) {
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Transfer failed']
            }));
            setError('Student transfer failed');
        }
    };

    const handleBulkMarkAttendance = async () => {
        if (!bulkMarkData.classId || !bulkMarkData.subjectId || !bulkMarkData.date) {
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
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/bulk/mark`,
                {
                    classId: bulkMarkData.classId,
                    subjectId: bulkMarkData.subjectId,
                    date: bulkMarkData.date,
                    session: bulkMarkData.session,
                    status: bulkMarkData.status,
                    studentIds: bulkMarkData.studentIds,
                    schoolId: currentUser.school
                }
            );
            
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                progress: 100,
                currentOperation: 'Attendance marking completed',
                results: response.data
            }));
            
            setSuccess(`Successfully marked attendance for ${response.data.successCount} students`);
            setActiveStep(2);
            
        } catch (err) {
            setOperationProgress(prev => ({
                ...prev,
                isRunning: false,
                errors: [err.response?.data?.message || 'Bulk attendance marking failed']
            }));
            setError('Bulk attendance marking failed');
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
                            borderColor: operationType === 'assign' ? 'primary.main' : 'divider'
                        }}
                        onClick={() => setOperationType('assign')}
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
                            borderColor: operationType === 'transfer' ? 'primary.main' : 'divider'
                        }}
                        onClick={() => setOperationType('transfer')}
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
                            borderColor: operationType === 'bulk-mark' ? 'primary.main' : 'divider'
                        }}
                        onClick={() => setOperationType('bulk-mark')}
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
                            {classes.map((cls) => (
                                <MenuItem key={cls._id} value={cls._id}>
                                    {cls.sclassName}
                                </MenuItem>
                            ))}
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
                            {subjects.map((subject) => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    {subject.subName}
                                </MenuItem>
                            ))}
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
                            Validate Pattern
                        </Button>
                        <Button variant="outlined" onClick={resetOperation}>
                            Reset
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );

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
                            {assignmentData.validationResults.message}
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
                                        primary={student.name}
                                        secondary={`ID: ${student.universityId} | Roll: ${student.rollNum}`}
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
                    <Accordion>
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
                                            {operationProgress.results.errorCount || 0}
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
                            
                            {operationProgress.results.errors && operationProgress.results.errors.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                                        Errors:
                                    </Typography>
                                    {operationProgress.results.errors.map((error, index) => (
                                        <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                            {error}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Bulk Student Management
                </Typography>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={loadInitialData}>
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