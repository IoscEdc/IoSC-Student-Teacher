import { useEffect, useState } from "react";
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getClassStudents } from "../../redux/sclassRelated/sclassHandle";
import { 
    Paper, 
    Box, 
    Typography, 
    ButtonGroup, 
    Button, 
    Popper, 
    Grow, 
    ClickAwayListener, 
    MenuList, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Select,
    Card,
    CardContent,
    Grid,
    Chip
} from '@mui/material';
import { BlackButton, BlueButton } from "../../components/buttonStyles";
import TableTemplate from "../../components/TableTemplate";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

const TeacherClassDetails = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { sclassStudents, loading, error, getresponse } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);

    // State for selected assignment
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState('');

    // Fetch students when assignment is selected
    // Note: You'll need to modify this based on how your backend fetches students
    // For now, I'm commenting it out since we need class ID, not just className
    // useEffect(() => {
    //     if (selectedAssignment) {
    //         // You might need to fetch class by className or modify your backend
    //         dispatch(getClassStudents(selectedAssignment.className));
    //     }
    // }, [dispatch, selectedAssignment]);

    if (error) {
        console.log(error);
    }

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ];

    const studentRows = sclassStudents && Array.isArray(sclassStudents) ? sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    }) : [];

    const StudentsButtonHaver = ({ row }) => {
        const options = ['Take Attendance', 'Provide Marks'];

        const [open, setOpen] = React.useState(false);
        const anchorRef = React.useRef(null);
        const [selectedIndex, setSelectedIndex] = React.useState(0);

        const handleClick = () => {
            if (selectedIndex === 0) {
                handleAttendance();
            } else if (selectedIndex === 1) {
                handleMarks();
            }
        };

        const handleAttendance = () => {
            if (selectedAssignment) {
                // Navigate with subject code or subject name
                navigate(`/Teacher/class/student/attendance/${row.id}/${selectedAssignment.subjectcode}`);
            }
        };
        
        const handleMarks = () => {
            if (selectedAssignment) {
                navigate(`/Teacher/class/student/marks/${row.id}/${selectedAssignment.subjectcode}`);
            }
        };

        const handleMenuItemClick = (event, index) => {
            setSelectedIndex(index);
            setOpen(false);
        };

        const handleToggle = () => {
            setOpen((prevOpen) => !prevOpen);
        };

        const handleClose = (event) => {
            if (anchorRef.current && anchorRef.current.contains(event.target)) {
                return;
            }
            setOpen(false);
        };

        return (
            <>
                <BlueButton
                    variant="contained"
                    onClick={() => navigate("/Teacher/class/student/" + row.id)}
                >
                    View
                </BlueButton>
                <React.Fragment>
                    <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                        <BlackButton
                            size="small"
                            aria-controls={open ? 'split-button-menu' : undefined}
                            aria-expanded={open ? 'true' : undefined}
                            aria-label="select merge strategy"
                            aria-haspopup="menu"
                            onClick={handleToggle}
                        >
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </BlackButton>
                    </ButtonGroup>
                    <Popper
                        sx={{ zIndex: 1 }}
                        open={open}
                        anchorEl={anchorRef.current}
                        role={undefined}
                        transition
                        disablePortal
                    >
                        {({ TransitionProps, placement }) => (
                            <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                        placement === 'bottom' ? 'center top' : 'center bottom',
                                }}
                            >
                                <Paper>
                                    <ClickAwayListener onClickAway={handleClose}>
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            {options.map((option, index) => (
                                                <MenuItem
                                                    key={option}
                                                    selected={index === selectedIndex}
                                                    onClick={(event) => handleMenuItemClick(event, index)}
                                                >
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    </ClickAwayListener>
                                </Paper>
                            </Grow>
                        )}
                    </Popper>
                </React.Fragment>
            </>
        );
    };

    return (
        <>
            <Typography variant="h4" align="center" gutterBottom>
                My Classes
            </Typography>

            {/* Display all assignments as cards */}
            {currentUser.assignments && currentUser.assignments.length > 0 ? (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {currentUser.assignments.map((assignment, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card 
                                sx={{ 
                                    cursor: 'pointer',
                                    border: selectedIndex === index ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-4px)'
                                    }
                                }}
                                onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setSelectedIndex(index);
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        {assignment.subject}
                                    </Typography>
                                    <Chip 
                                        label={assignment.subjectcode} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        <strong>Class:</strong> {assignment.className}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Batch:</strong> {assignment.batch}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        No classes assigned yet
                    </Typography>
                </Box>
            )}

            {/* Selected Class Details */}
            {selectedAssignment && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
                    <Typography variant="h5" gutterBottom>
                        Selected Class Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>Subject:</strong> {selectedAssignment.subject}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>Subject Code:</strong> {selectedAssignment.subjectcode}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>Class:</strong> {selectedAssignment.className}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>Batch:</strong> {selectedAssignment.batch}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Students List - Currently disabled, needs backend API modification */}
            {selectedAssignment && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Note: To display students, you need to modify your backend API to fetch students by className or create a proper class-subject relationship with IDs.
                    </Typography>
                </Paper>
            )}

            {/* Original student list code - uncomment when backend is ready
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {selectedAssignment && (
                        getresponse ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                No Students Found
                            </Box>
                        ) : (
                            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                                <Typography variant="h5" gutterBottom sx={{ p: 2, pb: 0 }}>
                                    Students List:
                                </Typography>
                                {Array.isArray(sclassStudents) && sclassStudents.length > 0 ? (
                                    <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                                ) : (
                                    <Typography variant="body1" sx={{ p: 2 }}>
                                        No students in this class.
                                    </Typography>
                                )}
                            </Paper>
                        )
                    )}
                </>
            )}
            */}
        </>
    );
};

export default TeacherClassDetails;