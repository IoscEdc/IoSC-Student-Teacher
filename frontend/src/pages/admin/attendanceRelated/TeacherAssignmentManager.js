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
    ListItemSecondaryAction,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Checkbox,
    Avatar
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    SwapHoriz as SwapIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const TeacherAssignmentManager = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch();
    
    const { currentUser } = useSelector((state) => state.user);
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Data
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    
    // Table state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedAssignments, setSelectedAssignments] = useState([]);
    
    // Dialog states
    const [assignDialog, setAssignDialog] = useState({ open: false, teacher: null, mode: 'add' });
    const [transferDialog, setTransferDialog] = useState({ open: false, assignments: [] });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, assignments: [] });
    
    // Form state
    const [assignmentForm, setAssignmentForm] = useState({
        teacherId: '',
        classId: '',
        subjectIds: []
    });
    
    const [transferForm, setTransferForm] = useState({
        fromTeacherId: '',
        toTeacherId: '',
        assignmentIds: []
    });

    useEffect(() => {
        loadInitialData();
        loadAssignments();
    }, []);

    const loadInitialData = async () => {
        try {
            const [teachersRes, classesRes, subjectsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/${currentUser.school}`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/AllSubjects/${currentUser.school}`)
            ]);
            
            setTeachers(teachersRes.data || []);
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
        } catch (err) {
            setError('Failed to load initial data');
            console.error('Error loading initial data:', err);
        }
    };

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/teacher-assignments/${currentUser.school}`
            );
            setAssignments(response.data || []);
        } catch (err) {
            setError('Failed to load teacher assignments');
            console.error('Error loading assignments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!assignmentForm.teacherId || !assignmentForm.classId || assignmentForm.subjectIds.length === 0) {
            setError('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/teacher-assignments`,
                {
                    teacherId: assignmentForm.teacherId,
                    classId: assignmentForm.classId,
                    subjectIds: assignmentForm.subjectIds,
                    schoolId: currentUser.school
                }
            );
            
            setSuccess('Teacher assignments created successfully');
            setAssignDialog({ open: false, teacher: null, mode: 'add' });
            setAssignmentForm({ teacherId: '', classId: '', subjectIds: [] });
            loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAssignment = async (assignmentId, updateData) => {
        setLoading(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/teacher-assignments/${assignmentId}`,
                updateData
            );
            
            setSuccess('Assignment updated successfully');
            loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignments = async () => {
        if (selectedAssignments.length === 0) {
            setError('Please select assignments to delete');
            return;
        }

        setLoading(true);
        try {
            await axios.delete(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/teacher-assignments/bulk`,
                { data: { assignmentIds: selectedAssignments } }
            );
            
            setSuccess(`${selectedAssignments.length} assignments deleted successfully`);
            setSelectedAssignments([]);
            setDeleteDialog({ open: false, assignments: [] });
            loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleTransferAssignments = async () => {
        if (!transferForm.fromTeacherId || !transferForm.toTeacherId || transferForm.assignmentIds.length === 0) {
            setError('Please fill all required fields for transfer');
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_BASE_URL}/api/attendance/teacher-assignments/transfer`,
                {
                    fromTeacherId: transferForm.fromTeacherId,
                    toTeacherId: transferForm.toTeacherId,
                    assignmentIds: transferForm.assignmentIds
                }
            );
            
            setSuccess(`${transferForm.assignmentIds.length} assignments transferred successfully`);
            setTransferDialog({ open: false, assignments: [] });
            setTransferForm({ fromTeacherId: '', toTeacherId: '', assignmentIds: [] });
            loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to transfer assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAssignment = (assignmentId) => {
        setSelectedAssignments(prev => 
            prev.includes(assignmentId) 
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        );
    };

    const handleSelectAllAssignments = (event) => {
        if (event.target.checked) {
            const newSelected = assignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(assignment => assignment._id);
            setSelectedAssignments(newSelected);
        } else {
            setSelectedAssignments([]);
        }
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t._id === teacherId);
        return teacher ? teacher.name : 'Unknown Teacher';
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c._id === classId);
        return cls ? cls.sclassName : 'Unknown Class';
    };

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        return subject ? subject.subName : 'Unknown Subject';
    };

    const renderAssignmentDialog = () => (
        <Dialog 
            open={assignDialog.open} 
            onClose={() => setAssignDialog({ open: false, teacher: null, mode: 'add' })}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                {assignDialog.mode === 'add' ? 'Create New Assignment' : 'Edit Assignment'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Teacher</InputLabel>
                            <Select
                                value={assignmentForm.teacherId}
                                onChange={(e) => setAssignmentForm(prev => ({ ...prev, teacherId: e.target.value }))}
                                label="Teacher"
                                disabled={assignDialog.mode === 'edit'}
                            >
                                {teachers.map((teacher) => (
                                    <MenuItem key={teacher._id} value={teacher._id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                                {teacher.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1">{teacher.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {teacher.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={assignmentForm.classId}
                                onChange={(e) => setAssignmentForm(prev => ({ ...prev, classId: e.target.value }))}
                                label="Class"
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
                            <InputLabel>Subjects</InputLabel>
                            <Select
                                multiple
                                value={assignmentForm.subjectIds}
                                onChange={(e) => setAssignmentForm(prev => ({ ...prev, subjectIds: e.target.value }))}
                                label="Subjects"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip 
                                                key={value} 
                                                label={getSubjectName(value)} 
                                                size="small" 
                                            />
                                        ))}
                                    </Box>
                                )}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject._id} value={subject._id}>
                                        <Checkbox checked={assignmentForm.subjectIds.indexOf(subject._id) > -1} />
                                        <ListItemText primary={subject.subName} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setAssignDialog({ open: false, teacher: null, mode: 'add' })}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleCreateAssignment}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                    {assignDialog.mode === 'add' ? 'Create' : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderTransferDialog = () => (
        <Dialog 
            open={transferDialog.open} 
            onClose={() => setTransferDialog({ open: false, assignments: [] })}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Transfer Assignments</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>From Teacher</InputLabel>
                            <Select
                                value={transferForm.fromTeacherId}
                                onChange={(e) => setTransferForm(prev => ({ ...prev, fromTeacherId: e.target.value }))}
                                label="From Teacher"
                            >
                                {teachers.map((teacher) => (
                                    <MenuItem key={teacher._id} value={teacher._id}>
                                        {teacher.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>To Teacher</InputLabel>
                            <Select
                                value={transferForm.toTeacherId}
                                onChange={(e) => setTransferForm(prev => ({ ...prev, toTeacherId: e.target.value }))}
                                label="To Teacher"
                            >
                                {teachers.filter(t => t._id !== transferForm.fromTeacherId).map((teacher) => (
                                    <MenuItem key={teacher._id} value={teacher._id}>
                                        {teacher.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                            {selectedAssignments.length} assignments will be transferred
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setTransferDialog({ open: false, assignments: [] })}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleTransferAssignments}
                    variant="contained"
                    disabled={loading}
                    startIcon={<SwapIcon />}
                >
                    Transfer
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderAssignmentsTable = () => (
        <TableContainer component={Paper} elevation={2}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={selectedAssignments.length > 0 && selectedAssignments.length < assignments.length}
                                checked={assignments.length > 0 && selectedAssignments.length === assignments.length}
                                onChange={handleSelectAllAssignments}
                            />
                        </TableCell>
                        <TableCell>Teacher</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Subjects</TableCell>
                        <TableCell>Assigned Date</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {assignments
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((assignment) => (
                            <TableRow key={assignment._id} hover>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedAssignments.includes(assignment._id)}
                                        onChange={() => handleSelectAssignment(assignment._id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                            {getTeacherName(assignment.teacherId).charAt(0)}
                                        </Avatar>
                                        <Typography variant="body2">
                                            {getTeacherName(assignment.teacherId)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={getClassName(assignment.classId)} 
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {assignment.subjectIds.map((subjectId) => (
                                            <Chip 
                                                key={subjectId}
                                                label={getSubjectName(subjectId)} 
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Edit Assignment">
                                        <IconButton 
                                            size="small"
                                            onClick={() => {
                                                setAssignmentForm({
                                                    teacherId: assignment.teacherId,
                                                    classId: assignment.classId,
                                                    subjectIds: assignment.subjectIds
                                                });
                                                setAssignDialog({ open: true, teacher: assignment, mode: 'edit' });
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Assignment">
                                        <IconButton 
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                                setSelectedAssignments([assignment._id]);
                                                setDeleteDialog({ open: true, assignments: [assignment] });
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={assignments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                }}
            />
        </TableContainer>
    );

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Teacher Assignment Manager
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={loadAssignments}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAssignDialog({ open: true, teacher: null, mode: 'add' })}
                    >
                        New Assignment
                    </Button>
                </Box>
            </Box>

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

            {/* Action Buttons */}
            {selectedAssignments.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">
                            {selectedAssignments.length} assignments selected
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<SwapIcon />}
                            onClick={() => {
                                setTransferForm(prev => ({ ...prev, assignmentIds: selectedAssignments }));
                                setTransferDialog({ open: true, assignments: selectedAssignments });
                            }}
                        >
                            Transfer
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialog({ open: true, assignments: selectedAssignments })}
                        >
                            Delete
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Assignments Table */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            ) : (
                renderAssignmentsTable()
            )}

            {/* Dialogs */}
            {renderAssignmentDialog()}
            {renderTransferDialog()}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, assignments: [] })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {selectedAssignments.length} assignment(s)? 
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, assignments: [] })}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteAssignments}
                        color="error"
                        variant="contained"
                        disabled={loading}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherAssignmentManager;