import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassDetails, getClassStudents, getSubjectList } from "../../../redux/sclassRelated/sclassHandle";
import { deleteUser } from '../../../redux/userRelated/userHandle';
import {
    Box, Container, Typography, Tab, IconButton, Card, CardContent,
    Grid, Chip, CircularProgress, Paper, Divider, Tooltip, Button
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
// Import teacher actions and state
import { getClassTeachers } from "../../../redux/teacherRelated/teacherHandle";
import { resetSubjects } from "../../../redux/sclassRelated/sclassSlice";
import { resetClassTeachers } from "../../../redux/teacherRelated/teacherSlice";
import { BlueButton, GreenButton, PurpleButton } from "../../../components/buttonStyles";
import TableTemplate from "../../../components/TableTemplate";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";
import DeleteIcon from "@mui/icons-material/Delete";
import PostAddIcon from '@mui/icons-material/PostAdd';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import styled from 'styled-components';

// Brand Colors
const brandDark = '#0f2b6e';
const brandPrimary = '#2176FF';

const ClassDetails = () => {
    const params = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Sclass State
    const { subjectsList, sclassStudents, sclassDetails, loading, error, response, getresponse } = useSelector((state) => state.sclass);
    
    // Teacher State
    const { classTeachersList, loading: teacherLoading, error: teacherError, getresponse: teacherGetResponse } = useSelector((state) => state.teacher);

    const classID = params.id;

    useEffect(() => {
        dispatch(getClassDetails(classID, "Sclass"));
        dispatch(getSubjectList(classID, "ClassSubjects"));
        dispatch(getClassStudents(classID));
        dispatch(getClassTeachers(classID)); // <-- Fetch class teachers

        // Cleanup function
        return () => {
            dispatch(resetSubjects());
            dispatch(resetClassTeachers()); // <-- Cleanup teacher state
        };
    }, [dispatch, classID]);

    if (error) {
        console.log(error);
    }
    if (teacherError) {
        console.log(teacherError);
    }

    const [value, setValue] = useState('1');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);
        setMessage("Sorry the delete function has been disabled for now.");
        setShowPopup(true);
    };

    // --- SUBJECTS SECTION ---
    const subjectColumns = [
        { id: 'name', label: 'Subject Name', minWidth: 170 },
        { id: 'code', label: 'Subject Code', minWidth: 100 },
        { id: 'teacher', label: 'Teacher', minWidth: 170 }, // <-- ADDED
    ];

    const subjectRows = subjectsList && subjectsList.length > 0 && subjectsList.map((subject) => {
        return {
            name: subject.subName,
            code: subject.subCode,
            teacher: subject.teacher?.name || 'Not Assigned', // <-- ADDED
            id: subject._id,
        };
    });

    const SubjectsButtonHaver = ({ row }) => {
        return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="Delete Subject">
                    <IconButton
                        onClick={() => deleteHandler(row.id, "Subject")}
                        size="small"
                        sx={{
                            color: 'error.main',
                            '&:hover': {
                                bgcolor: 'error.light',
                                color: 'white'
                            },
                            transition: 'all 0.2s'
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/Admin/class/subject/${classID}/${row.id}`)}
                    startIcon={<VisibilityIcon />}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 2,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s'
                    }}
                >
                    View
                </Button>
            </Box>
        );
    };

    const subjectActions = [
        {
            icon: <PostAddIcon color="primary" />,
            name: 'Add New Subject',
            action: () => navigate("/Admin/addsubject/" + classID)
        },
        {
            icon: <DeleteIcon color="error" />,
            name: 'Delete All Subjects',
            action: () => deleteHandler(classID, "SubjectsClass")
        }
    ];

    const ClassSubjectsSection = () => {
        return (
            <>
                {getresponse ? (
                    <EmptyStateBox>
                        <EmptyIcon>
                            <MenuBookIcon sx={{ fontSize: '3rem', color: '#99b3ff' }} />
                        </EmptyIcon>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: brandDark, mb: 1 }}>
                            No Subjects Found
                        </Typography>
                        <Typography sx={{ color: '#666', mb: 3, fontSize: '0.875rem' }}>
                            Add subjects to this class to get started
                        </Typography>
                        <GreenButton
                            variant="contained"
                            startIcon={<PostAddIcon />}
                            onClick={() => navigate("/Admin/addsubject/" + classID)}
                        >
                            Add Subjects
                        </GreenButton>
                    </EmptyStateBox>
                ) : (
                    <>
                        <SectionHeader>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: brandDark, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                                Subjects List
                            </Typography>
                            <Chip
                                label={`${subjectsList?.length || 0} ${subjectsList?.length === 1 ? 'Subject' : 'Subjects'}`}
                                sx={{
                                    background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        </SectionHeader>
                        <StyledPaper>
                            <TableTemplate
                                buttonHaver={SubjectsButtonHaver}
                                columns={subjectColumns}
                                rows={subjectRows}
                            />
                        </StyledPaper>
                        <SpeedDialTemplate actions={subjectActions} />
                    </>
                )}
            </>
        );
    };

    // --- STUDENTS SECTION ---
    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ];

    const studentRows = sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    });

    const StudentsButtonHaver = ({ row }) => {
        return (
            <ButtonGroup>
                <IconButton onClick={() => deleteHandler(row.id, "Student")} size="small">
                    <PersonRemoveIcon color="error" fontSize="small" />
                </IconButton>
                <StyledViewButton
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/Admin/students/student/" + row.id)}
                >
                    <VisibilityIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    View
                </StyledViewButton>
                <PurpleButton
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/Admin/students/student/attendance/" + row.id)}
                >
                    Attendance
                </PurpleButton>
            </ButtonGroup>
        );
    };

    const studentActions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Student',
            action: () => navigate("/Admin/class/addstudents/" + classID)
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Students',
            action: () => deleteHandler(classID, "StudentsClass")
        },
    ];

    const ClassStudentsSection = () => {
        return (
            <>
                {getresponse ? (
                    <EmptyStateBox>
                        <EmptyIcon>
                            <PeopleIcon sx={{ fontSize: '3rem', color: '#99b3ff' }} />
                        </EmptyIcon>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: brandDark, mb: 1 }}>
                            No Students Found
                        </Typography>
                        <Typography sx={{ color: '#666', mb: 3, fontSize: '0.875rem' }}>
                            Add students to this class to get started
                        </Typography>
                        <GreenButton
                            variant="contained"
                            startIcon={<PersonAddAlt1Icon />}
                            onClick={() => navigate("/Admin/class/addstudents/" + classID)}
                        >
                            Add Students
                        </GreenButton>
                    </EmptyStateBox>
                ) : (
                    <>
                        <SectionHeader>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: brandDark, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                                Students List
                            </Typography>
                            <Chip
                                label={`${sclassStudents?.length || 0} Students`}
                                sx={{
                                    background: `linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%)`,
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            />
                        </SectionHeader>
                        <StyledPaper>
                            <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                        </StyledPaper>
                        <SpeedDialTemplate actions={studentActions} />
                    </>
                )}
            </>
        );
    };

    // --- TEACHERS SECTION ---
    const teacherColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'email', label: 'Email', minWidth: 100 },
        { id: 'department', label: 'Department', minWidth: 100 },
    ];

    const teacherRows = classTeachersList && classTeachersList.length > 0 ? classTeachersList.map((teacher) => {
        return {
            name: teacher.name,
            email: teacher.email,
            department: teacher.department || 'N/A',
            id: teacher._id,
        };
    }) : [];

    const TeachersButtonHaver = ({ row }) => {
        return (
            <ButtonGroup>
                <IconButton onClick={() => deleteHandler(row.id, "Teacher")} size="small">
                    <PersonRemoveIcon color="error" fontSize="small" />
                </IconButton>
                <StyledViewButton
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}
                >
                    <VisibilityIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    View
                </StyledViewButton>
            </ButtonGroup>
        );
    };

    const ClassTeachersSection = () => {
        return (
            <>
                {teacherLoading ? (
                     <LoadingContainer>
                        <CircularProgress size={50} thickness={4} sx={{ color: brandPrimary }} />
                        <Typography sx={{ mt: 2, color: '#666', fontWeight: 500 }}>
                            Loading teachers...
                        </Typography>
                    </LoadingContainer>
                ) : teacherGetResponse || teacherRows.length === 0 ? (
                    <EmptyStateBox>
                        <EmptyIcon>
                            <SchoolIcon sx={{ fontSize: '3rem', color: '#99b3ff' }} />
                        </EmptyIcon>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: brandDark, mb: 1 }}>
                            No Teachers Found
                        </Typography>
                        <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
                            Teachers assigned to subjects in this class will appear here.
                        </Typography>
                    </EmptyStateBox>
                ) : (
                    <>
                        <SectionHeader>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: brandDark, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                                Teachers List
                            </Typography>
                            <Chip
                                label={`${classTeachersList?.length || 0} Teachers`}
                                sx={{
                                    background: `linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%)`,
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            />
                        </SectionHeader>
                        <StyledPaper>
                            <TableTemplate buttonHaver={TeachersButtonHaver} columns={teacherColumns} rows={teacherRows} />
                        </StyledPaper>
                        {/* No Speed Dial, as teachers are managed via Subjects */}
                    </>
                )}
            </>
        );
    };

    // --- DETAILS SECTION ---
    const ClassDetailsSection = () => {
        const numberOfSubjects = subjectsList?.length || 0;
        const numberOfStudents = sclassStudents?.length || 0;
        const classIncharge = sclassDetails?.classIncharge?.name || "Not Assigned";

        return (
            <DetailsContainer>
                <HeaderCard>
                    <ClassIconWrapper>
                        <ClassIcon sx={{ fontSize: '3rem', color: 'white' }} />
                    </ClassIconWrapper>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: brandDark,
                                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                                mb: 1
                            }}
                        >
                            {sclassDetails && sclassDetails.sclassName}
                        </Typography>
                        <Typography sx={{ color: '#666', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            Class Overview & Statistics
                        </Typography>
                    </Box>
                </HeaderCard>

                {/* UPDATED Grid to fit 3 items */}
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}> 
                        <StatsCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px', sm: '16px', md: '20px' }, width: '100%' }}>
                                <StatsIconBox color={brandPrimary}>
                                    <MenuBookIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'white' }} />
                                </StatsIconBox>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: brandDark, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' } }}>
                                        {numberOfSubjects}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}>
                                        Total Subjects
                                    </Typography>
                                </Box>
                            </Box>
                        </StatsCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <StatsCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px', sm: '16px', md: '20px' }, width: '100%' }}>
                                <StatsIconBox color="#10b981">
                                    <PeopleIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'white' }} />
                                </StatsIconBox>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: brandDark, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' } }}>
                                        {numberOfStudents}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}>
                                        Total Students
                                    </Typography>
                                </Box>
                            </Box>
                        </StatsCard>
                    </Grid>

                    {/* ADDED CLASS INCHARGE CARD */}
                    <Grid item xs={12} md={4}>
                        <StatsCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px', sm: '16px', md: '20px' }, width: '100%' }}>
                                <StatsIconBox color="#f59e0b">
                                    <SchoolIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'white' }} />
                                </StatsIconBox>
                                <Box sx={{ flex: 1, minWidth: 0 }}> {/* Added minWidth to prevent overflow */}
                                    <Typography 
                                        variant="h3" 
                                        sx={{ 
                                            fontWeight: 700, 
                                            color: brandDark, 
                                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, // Adjusted size
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        title={classIncharge}
                                    >
                                        {classIncharge}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}>
                                        Class Incharge
                                    </Typography>
                                </Box>
                            </Box>
                        </StatsCard>
                    </Grid>
                </Grid>

                {(getresponse || response) && (
                    <QuickActionsCard>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: brandDark, mb: 2 }}>
                            Quick Actions
                        </Typography>
                        <Grid container spacing={2}>
                            {response && (
                                <Grid item xs={12} sm={6}>
                                    <ActionButton onClick={() => navigate("/Admin/addsubject/" + classID)}>
                                        <PostAddIcon />
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Add Subjects</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>Add subjects to this class</Typography>
                                        </Box>
                                    </ActionButton>
                                </Grid>
                            )}
                            {getresponse && (
                                <Grid item xs={12} sm={6}>
                                    <ActionButton onClick={() => navigate("/Admin/class/addstudents/" + classID)}>
                                        <PersonAddAlt1Icon />
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Add Students</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>Enroll students in this class</Typography>
                                        </Box>
                                    </ActionButton>
                                </Grid>
                            )}
                        </Grid>
                    </QuickActionsCard>
                )}
            </DetailsContainer>
        );
    };

    // Combined loading state
    const totalLoading = loading || teacherLoading;

    return (
        <>
            {totalLoading ? (
                <LoadingContainer>
                    <CircularProgress size={50} thickness={4} sx={{ color: brandPrimary }} />
                    <Typography sx={{ mt: 2, color: '#666', fontWeight: 500 }}>
                        Loading class details...
                    </Typography>
                </LoadingContainer>
            ) : (
                <Box sx={{ width: '100%' }}>
                    <TabContext value={value}>
                        <StyledTabBar>
                            <Container maxWidth="xl">
                                <TabList
                                    onChange={handleChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{
                                        '& .MuiTab-root': {
                                            color: '#666',
                                            fontWeight: 600,
                                            fontSize: { xs: 0, sm: '0.875rem' },
                                            minHeight: { xs: '48px', sm: '56px' },
                                            minWidth: { xs: 0, sm: 'auto' },
                                            padding: { xs: '0 12px', sm: '0 16px' },
                                            '&.Mui-selected': {
                                                color: brandPrimary,
                                            }
                                        },
                                        '& .MuiTab-icon': {
                                            fontSize: { xs: '1.5rem', sm: '1.25rem' }
                                        },
                                        '& .MuiTab-iconPositionStart': {
                                            marginRight: { xs: 0, sm: '8px' }
                                        },
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: brandPrimary,
                                            height: '3px',
                                        }
                                    }}
                                >
                                    <Tab icon={<ClassIcon />} iconPosition="start" label="Details" value="1" />
                                    <Tab icon={<MenuBookIcon />} iconPosition="start" label="Subjects" value="2" />
                                    <Tab icon={<PeopleIcon />} iconPosition="start" label="Students" value="3" />
                                    <Tab icon={<SchoolIcon />} iconPosition="start" label="Teachers" value="4" />
                                </TabList>
                            </Container>
                        </StyledTabBar>
                        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <ClassDetailsSection />
                            </TabPanel>
                            <TabPanel value="2" sx={{ p: 0 }}>
                                <ClassSubjectsSection />
                            </TabPanel>
                            <TabPanel value="3" sx={{ p: 0 }}>
                                <ClassStudentsSection />
                            </TabPanel>
                            <TabPanel value="4" sx={{ p: 0 }}>
                                <ClassTeachersSection />
                            </TabPanel>
                        </Container>
                    </TabContext>
                </Box>
            )}
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default ClassDetails;

// Styled Components
const StyledTabBar = styled(Box)`
  background: white;
  border-bottom: 1px solid rgba(33, 118, 255, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const LoadingContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const DetailsContainer = styled(Box)`
  width: 100%;
`;

const HeaderCard = styled(Card)`
  padding: 24px;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(33, 118, 255, 0.2) !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(33, 118, 255, 0.1) !important;
  text-align: center;

  @media (min-width: 600px) {
    flex-direction: row;
    text-align: left;
    gap: 24px;
  }

  @media (max-width: 600px) {
    padding: 20px;
    gap: 16px;
  }
`;

const ClassIconWrapper = styled(Box)`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(33, 118, 255, 0.3);

  @media (max-width: 600px) {
    width: 70px;
    height: 70px;
  }
`;

const StatsCard = styled(Card)`
  padding: 24px;
  border-radius: 12px !important;
  border: 1px solid rgba(33, 118, 255, 0.15) !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s ease !important;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(33, 118, 255, 0.15) !important;
  }

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }

  @media (max-width: 600px) {
    padding: 20px;
    gap: 12px;
  }
`;

const StatsIconBox = styled(Box)`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px ${props => props.color}40;
  flex-shrink: 0; // Prevents icon from shrinking

  @media (max-width: 600px) {
    width: 50px;
    height: 50px;
  }
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
  margin-top: 12px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  @media (min-width: 600px) {
    margin-left: auto;
    margin-top: 0;
    width: auto;
  }
`;

const QuickActionsCard = styled(Card)`
  padding: 24px;
  border-radius: 12px !important;
  border: 1px solid rgba(33, 118, 255, 0.15) !important;
  margin-top: 24px;
  background: linear-gradient(135deg, rgba(33, 118, 255, 0.03) 0%, rgba(255, 255, 255, 1) 100%) !important;

  @media (max-width: 600px) {
    padding: 20px;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  background: white;
  border: 2px solid rgba(33, 118, 255, 0.2);
  padding: 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;

  svg {
    font-size: 2rem;
    color: ${brandPrimary};
    flex-shrink: 0; // Prevents icon from shrinking
  }

  &:hover {
    border-color: ${brandPrimary};
    background: rgba(33, 118, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 118, 255, 0.15);
  }

  @media (max-width: 600px) {
    padding: 14px;
    gap: 12px;
  }
`;

const SectionHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 600px) {
    margin-bottom: 20px;
  }
`;

const StyledPaper = styled(Paper)`
  border-radius: 12px !important;
  overflow: hidden;
  border: 1px solid rgba(33, 118, 255, 0.15) !important;
  
  .MuiTable-root {
    @media (max-width: 900px) {
      min-width: 100%;
    }
  }

  .MuiTableCell-root {
    @media (max-width: 900px) {
      padding: 12px 8px;
      font-size: 0.85rem;
    }
  }

  .MuiTableHead-root .MuiTableCell-head {
    @media (max-width: 900px) {
      font-size: 0.75rem;
      font-weight: 700;
    }
  }
`;

const EmptyStateBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
  text-align: center;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px dashed rgba(33, 118, 255, 0.25);

  @media (max-width: 600px) {
    padding: 40px 20px;
    min-height: 250px;
  }
`;

const EmptyIcon = styled(Box)`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d9e7ff 0%, #ccdeff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    border: 2px dashed rgba(33, 118, 255, 0.25);
  }

  @media (max-width: 600px) {
    width: 70px;
    height: 70px;
  }
`;

const ButtonGroup = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 900px) {
    justify-content: center;
    gap: 6px;
    
    button, a {
      flex: 1 1 auto;
      min-width: fit-content;
      font-size: 0.75rem;
      padding: 5px 10px;
    }
  }
`;

const StyledViewButton = styled.button`
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @media (max-width: 600px) {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
`;