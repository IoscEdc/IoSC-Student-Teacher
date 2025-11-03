import { useEffect } from "react";
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    styled,
} from '@mui/material';
import { BlueButton, GreenButton } from "../../components/buttonStyles";
import TableTemplate from "../../components/TableTemplate";
import { Groups, History } from "@mui/icons-material"; 
import { getClassDetails, getClassStudents, getSubjectDetails } from "../../redux/sclassRelated/sclassHandle";

// --- Styled Components ---
const HeaderCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    background: 'linear-gradient(135deg, #0f2b6e 0%, #2176FF 100%)',
    color: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(33, 118, 255, 0.3)',
}));

const InfoBox = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
});

const InfoLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
    textTransform: 'uppercase',
}));

const InfoValue = styled(Typography)(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'white',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.25rem',
    },
}));

const ActionsBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
        justifyContent: 'flex-start',
        marginTop: theme.spacing(2),
        flexWrap: 'wrap',
    },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.12)',
}));

const TeacherClassDetails = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { classId } = useParams(); 
    
    const { sclassStudents, sclassDetails, loading, error, getresponse } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);

    // Get the assignment for this class
    const assignment = currentUser.assignedSubjects?.find(
        (item) => item.classId?._id === classId
    );

    const subjectID = assignment?.subjectId?._id;
    const subjectName = assignment?.subjectId?.subName || '...';
    
    useEffect(() => {
        if (classId && subjectID) {
            dispatch(getClassDetails(classId, "Sclass"));
            dispatch(getSubjectDetails(subjectID, "Subject"));
            dispatch(getClassStudents(classId));
        }
    }, [dispatch, classId, subjectID]);

    const studentCount = sclassStudents?.length || 0;
    const className = sclassDetails?.sclassName || '...';

    // Navigation handlers with class and subject context
    const handleMarkAttendance = () => {
        if (classId && subjectID) {
            // Navigate to attendance marking with class and subject IDs
            navigate('/Teacher/attendance/mark', { 
                state: { 
                    classId, 
                    subjectId: subjectID,
                    className,
                    subjectName
                } 
            });
        } else {
            alert('Class or Subject information is missing');
        }
    };

    const handleViewHistory = () => {
        if (classId && subjectID) {
            // Navigate to attendance history with class and subject IDs
            navigate('/Teacher/attendance/history', { 
                state: { 
                    classId, 
                    subjectId: subjectID,
                    className,
                    subjectName
                } 
            });
        } else {
            alert('Class or Subject information is missing');
        }
    };

    const studentColumns = [
        { id: 'name', label: 'Name' },
        { id: 'rollNum', label: 'Roll Number' },
    ];

    const studentRows = sclassStudents && Array.isArray(sclassStudents) ? sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    }) : [];

    const StudentsButtonHaver = ({ row }) => {
        return null;
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Header Card */}
                    <HeaderCard elevation={4}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <InfoBox>
                                            <InfoLabel>Class</InfoLabel>
                                            <InfoValue>{className}</InfoValue>
                                        </InfoBox>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <InfoBox>
                                            <InfoLabel>Subject</InfoLabel>
                                            <InfoValue>{subjectName}</InfoValue>
                                        </InfoBox>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ActionsBox>
                                    <GreenButton
                                        variant="contained"
                                        startIcon={<Groups />}
                                        onClick={handleMarkAttendance}
                                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Mark Attendance
                                    </GreenButton>
                                    <BlueButton
                                        variant="contained"
                                        startIcon={<History />}
                                        onClick={handleViewHistory}
                                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                                    >
                                        View History
                                    </BlueButton>
                                </ActionsBox>
                            </Grid>
                        </Grid>
                    </HeaderCard>
                    
                    {/* Student Table */}
                    <StyledPaper>
                        <Typography 
                            variant="h5" 
                            gutterBottom 
                            sx={{ 
                                p: 2, 
                                pb: 0, 
                                fontWeight: 700, 
                                color: '#0f2b6e',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            Students List ({studentCount})
                        </Typography>
                        
                        {getresponse ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    No Students Found in this Class.
                                </Typography>
                            </Box>
                        ) : (
                            Array.isArray(sclassStudents) && sclassStudents.length > 0 ? (
                                <TableTemplate 
                                    buttonHaver={StudentsButtonHaver} 
                                    columns={studentColumns} 
                                    rows={studentRows} 
                                />
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No students found.
                                    </Typography>
                                </Box>
                            )
                        )}
                    </StyledPaper>
                </>
            )}
        </Box>
    );
};

export default TeacherClassDetails;