import React, { useEffect, useState } from 'react';
import {
    Container, 
    Grid, 
    Paper, 
    Typography, 
    Box, 
    Fade, 
    Stack, 
    CircularProgress, 
    Tabs, 
    Tab, 
    Table, 
    TableBody, 
    TableHead,
    TableContainer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    alpha
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import CustomBarChart from '../../components/CustomBarChart';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

// --- Icons ---
import BookIcon from '@mui/icons-material/Book';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';

// Helper component for Tab Panels
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`subject-tabpanel-${index}`}
            aria-labelledby={`subject-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const StudentSubjects = () => {
    const dispatch = useDispatch();
    const { userDetails, currentUser, loading } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);

    const [subjectMarks, setSubjectMarks] = useState([]);
    const [tabValue, setTabValue] = useState(0);

    // --- FIX: Cleaned up data fetching ---
    const classID = currentUser?.sclassName 
        ? (typeof currentUser.sclassName === 'object' 
            ? currentUser.sclassName._id 
            : currentUser.sclassName)
        : null;

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(getUserDetails(currentUser._id, "Student"));
        }
        if (classID) {
            dispatch(getSubjectList(classID, "ClassSubjects"));
        }
    }, [dispatch, currentUser?._id, classID]);

    useEffect(() => {
        if (userDetails) {
            setSubjectMarks(userDetails.examResult || []);
        }
    }, [userDetails]);
    // --- End of data fetching ---

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Calculate percentage for the table
    const calculatePercentage = (marks, total) => {
        if (!marks || !total) return "N/A";
        return ((marks / total) * 100).toFixed(2) + '%';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading...</Typography>
            </Box>
        );
    }

    return (
        // --- Root container with modern padding ---
        <Box sx={{ py: { xs: 1.5, sm: 3, md: 4 }, ml:{ xs: 2, md: 2 }, mr: { xs: 2, md: 2}  }}>
            {/* --- Modern Header --- */}
            <Fade in timeout={600}>
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: { xs: 44, sm: 56 },
                                height: { xs: 44, sm: 56 },
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }}
                        >
                            <BookIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography 
                                variant="h4" 
                                fontWeight="800"
                                sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5,
                                    fontSize: { xs: '1.5rem', sm: '2.25rem' } 
                                }}
                            >
                                My Subjects
                            </Typography>
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            >
                                View your subjects.
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Fade>

            {/* --- Main Content Paper --- */}
            <Fade in timeout={800}>
                <Paper sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}>
                    {subjectMarks && subjectMarks.length > 0 ? (
                        // --- 1. MARKS VIEW (with Tabs) ---
                        <Box>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange} 
                                    variant="fullWidth" 
                                    aria-label="marks view tabs"
                                >
                                    <Tab 
                                        label="Marks Table" 
                                        icon={<TableChartIcon />} 
                                        iconPosition="start" 
                                        id="subject-tab-0" 
                                    />
                                    <Tab 
                                        label="Marks Chart" 
                                        icon={<InsertChartIcon />} 
                                        iconPosition="start" 
                                        id="subject-tab-1" 
                                    />
                                </Tabs>
                            </Box>
                            
                            {/* --- Tab Panel 1: Table --- */}
                            <TabPanel value={tabValue} index={0}>
                                <Typography variant="h6" align="center" gutterBottom>
                                    Subject Marks
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <StyledTableRow>
                                                <StyledTableCell>Subject</StyledTableCell>
                                                <StyledTableCell>Marks Obtained</StyledTableCell>
                                                <StyledTableCell>Total Marks</StyledTableCell>
                                                <StyledTableCell>Percentage</StyledTableCell>
                                            </StyledTableRow>
                                        </TableHead>
                                        <TableBody>
                                            {subjectMarks.map((result, index) => (
                                                <StyledTableRow key={index}>
                                                    <StyledTableCell>{result.subName.subName}</StyledTableCell>
                                                    <StyledTableCell>{result.marksObtained}</StyledTableCell>
                                                    <StyledTableCell>{result.totalMarks}</StyledTableCell>
                                                    <StyledTableCell>
                                                        {calculatePercentage(result.marksObtained, result.totalMarks)}
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </TabPanel>

                            {/* --- Tab Panel 2: Chart --- */}
                            <TabPanel value={tabValue} index={1}>
                                <Typography variant="h6" align="center" gutterBottom>
                                    Marks Distribution
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    {/* Pass subName as the x-axis key */}
                                    <CustomBarChart 
                                        chartData={subjectMarks.map(item => ({ ...item, name: item.subName.subName }))} 
                                        dataKey="marksObtained" 
                                    />
                                </Box>
                            </TabPanel>
                        </Box>
                    ) : (
                        // --- 2. NO MARKS VIEW (Subject List) ---
                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" gutterBottom>
                                My Enrolled Subjects
                            </Typography>
                            {subjectsList && subjectsList.length > 0 ? (
                                <List>
                                    {subjectsList.map((subject, index) => (
                                        <ListItem key={subject._id} divider={index < subjectsList.length - 1}>
                                            <ListItemIcon>
                                                <BookIcon color={index % 2 === 0 ? "primary" : "secondary"} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={subject.subName}
                                                primaryTypographyProps={{ fontWeight: '500' }}
                                                secondary={`Subject Code: ${subject.subCode}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No subjects found for your class.
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            </Fade>
            
            {/* Removed the fixed BottomNavigation */}
        </Box>
    );
};

export default StudentSubjects;