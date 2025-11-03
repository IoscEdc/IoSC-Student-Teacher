import React, { useEffect, useState } from 'react'; // 'React' is needed for forwardRef
import { Container, Grid, Paper, Typography, Box, Card, CardContent, CircularProgress, Fade, alpha } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { calculateOverallAttendancePercentage } from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

// --- THIS IS THE FIX ---
// 1. Wrap the component in React.forwardRef
// 2. Add 'ref' as the second argument
const StatsCard = React.forwardRef(({ icon: Icon, label, value, gradient }, ref) => (
    <Card 
        ref={ref} // 3. Pass the ref to the root <Card> element
        sx={{ 
            height: '100%',
            background: gradient,
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }
        }}
    >
        <CardContent sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center', 
            p: { xs: 2, sm: 3 },
            height: '100%'
        }}>
            <Icon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.9, mb: 1 }} />
            <Typography variant="h3" fontWeight="800" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, mb: 0.5 }}>
                <CountUp start={0} end={value} duration={2.5} />
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                {label}
            </Typography>
        </CardContent>
    </Card>
));
// --- END OF FIX ---

const StudentHomePage = () => {
    // ... (The rest of your component logic is correct and remains unchanged) ...
    const dispatch = useDispatch();

    const { userDetails, currentUser, loading, response } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);

    const [subjectAttendance, setSubjectAttendance] = useState([]);

    const classID = currentUser?.sclassName 
        ? (typeof currentUser.sclassName === 'object' 
            ? currentUser.sclassName._id 
            : currentUser.sclassName)
        : null;

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(getUserDetails({ id: currentUser._id, address: "Student" }));
        }
        if (classID) {
            dispatch(getSubjectList(classID, "ClassSubjects"));
        }
    }, [dispatch, currentUser?._id, classID]);

    const numberOfSubjects = subjectsList && subjectsList.length;

    useEffect(() => {
        if (userDetails) {
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails])

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const overallAbsentPercentage = 100 - overallAttendancePercentage;

    const chartData = [
        { name: 'Present', value: overallAttendancePercentage },
        { name: 'Absent', value: overallAbsentPercentage }
    ];

    return (
        <>
            <Box sx={{ py: { xs: 1.5, sm: 3, md: 4 }, ml:{ xs: 2, md: 2 }, mr: { xs: 2, md: 2} }}>
                <Fade in timeout={600}>
                    <Box sx={{ mb: 3 }}>
                        <Typography 
                            variant="h4" 
                            component="h1"
                            sx={{ 
                                fontWeight: 700,
                                fontSize: { xs: '1.75rem', sm: '2.25rem' } 
                            }}
                            gutterBottom
                        >
                            Welcome back, {currentUser.name}! 👋
                        </Typography>
                        <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                        >
                            Here's what's happening today.
                        </Typography>
                    </Box>
                </Fade>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Fade in timeout={800}>
                            <StatsCard 
                                icon={AutoStoriesIcon}
                                label="Total Subjects"
                                value={numberOfSubjects || 0}
                                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            />
                        </Fade>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Fade in timeout={1000}>
                            <StatsCard 
                                icon={AssignmentTurnedInIcon}
                                label="Total Assignments"
                                value={15} 
                                gradient="linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)"
                            />
                        </Fade>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Fade in timeout={1200}>
                            <Paper sx={{
                                p: { xs: 2, sm: 3 },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}>
                                <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                                    Overall Attendance
                                </Typography>
                                <Box sx={{ 
                                    flexGrow: 1, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    minHeight: 150
                                }}>
                                    {loading ? (
                                        <CircularProgress />
                                    ) : (
                                        subjectAttendance.length > 0 ? (
                                            <CustomPieChart data={chartData} />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No Attendance Data Found
                                            </Typography>
                                        )
                                    )}
                                </Box>
                            </Paper>
                        </Fade>
                    </Grid>

                    <Grid item xs={12}>
                        <Fade in timeout={1400}>
                            <Paper sx={{
                                p: { xs: 2, sm: 3 },
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}>
                                <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                                    School Notices
                                </Typography>
                                <SeeNotice />
                            </Paper>
                        </Fade>
                    </Grid>
                </Grid>
            </Box>
        </>
    )
}

export default StudentHomePage;