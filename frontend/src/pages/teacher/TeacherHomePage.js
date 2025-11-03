import React, { useEffect } from 'react';
// --- CLEANUP: Removed unused imports (LinearProgress, CheckCircleIcon, TrendingUpIcon)
import { Container, Grid, Paper, Box, Typography, Card, CardContent } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import CountUp from 'react-countup';
import styled from 'styled-components';
import SeeNotice from '../../components/SeeNotice';
import { getClassStudents } from '../../redux/sclassRelated/sclassHandle'; // --- CLEANUP: Removed getSubjectDetails (not used)
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
// --- EXAMPLE: You could import this if you add the 3rd stat back
// import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 

const TeacherHomePage = () => {
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);
    const { sclassStudents } = useSelector((state) => state.sclass);

    // --- 1. LOGIC (No Change) ---
    const primaryAssignment = currentUser.assignedSubjects?.[0];
    const classID = primaryAssignment?.classId?._id;
    const subjectID = primaryAssignment?.subjectId?._id;

    useEffect(() => {
        if (classID && subjectID) {
            // subjectDetails is not used, so this dispatch is optional
            // dispatch(getSubjectDetails(subjectID, "Subject")); 
            dispatch(getClassStudents(classID));
        }
    }, [dispatch, classID, subjectID]);

    // --- 2. DATA (No Change) ---
    const numberOfStudents = sclassStudents?.length || 0;
    const className = primaryAssignment?.classId?.sclassName || 'Not Assigned';
    const subjectName = primaryAssignment?.subjectId?.subName || 'Not Assigned';
    const classesAssigned = currentUser.assignedSubjects?.length || 0;

    // --- 3. DYNAMIC STATS ARRAY ---
    // You can add or remove items here, and the layout will adjust automatically.
    const stats = [
        {
            title: 'Total Students',
            value: numberOfStudents,
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            color: '#667eea',
            bgColor: 'rgba(102, 126, 234, 0.1)',
        },
        {
            title: 'Classes Assigned',
            value: classesAssigned,
            icon: <ClassIcon sx={{ fontSize: 40 }} />,
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)',
        },
        // --- EXAMPLE: Uncomment this block to see the grid adjust to 3 items ---
        // {
        //     title: 'Attendance (Mock)',
        //     value: 92,
        //     suffix: '%',
        //     icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
        //     color: '#10b981',
        //     bgColor: 'rgba(16, 185, 129, 0.1)',
        // },
    ];

    // --- 4. NEW: DYNAMIC LAYOUT LOGIC ---
    // This calculates the grid columns based on the number of stats.
    const statCount = stats.length;

    // Tablet (sm): Max 2 columns per row
    // - 1 stat: sm={12} (full width)
    // - 2+ stats: sm={6} (2 columns)
    const smItemsPerRow = Math.min(statCount, 2);
    const smColSize = smItemsPerRow > 0 ? Math.floor(12 / smItemsPerRow) : 12;

    // Desktop (md): Max 4 columns per row
    // - 1 stat: md={12} (full width)
    // - 2 stats: md={6} (2 columns)
    // - 3 stats: md={4} (3 columns)
    // - 4+ stats: md={3} (4 columns)
    const mdItemsPerRow = Math.min(statCount, 4);
    const mdColSize = mdItemsPerRow > 0 ? Math.floor(12 / mdItemsPerRow) : 12;

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, md: 3 } }}>
            {/* Welcome Header (No Change) */}
            <WelcomeCard elevation={0}>
                <Box sx={{ flex: 1 }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 700, 
                            color: '#0f2b6e',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                            mb: 1
                        }}
                    >
                        Welcome back, {currentUser?.name}! 👋
                    </Typography>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: '#64748b',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                    >
                        Here's what's happening with your classes today
                    </Typography>
                </Box>
                <Box sx={{ 
                    display: { xs: 'none', md: 'block' },
                    minWidth: '200px'
                }}>
                    <TeachingInfo>
                        <InfoItem>
                            <InfoLabel>Primary Class</InfoLabel> 
                            <InfoValue>{className}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                            <InfoLabel>Primary Subject</InfoLabel>
                            <InfoValue>{subjectName}</InfoValue>
                        </InfoItem>
                    </TeachingInfo>
                </Box>
            </WelcomeCard>

            {/* Stats Grid */}
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
                {stats.map((stat, index) => (
                    // --- 5. UPDATED: Using dynamic column sizes ---
                    <Grid item xs={12} sm={smColSize} md={mdColSize} key={index}>
                        <StatsCard elevation={0}>
                            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <IconWrapper sx={{ bgcolor: stat.bgColor }}>
                                        <Box sx={{ color: stat.color }}>
                                            {stat.icon}
                                        </Box>
                                    </IconWrapper>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: '#64748b',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                fontWeight: 500,
                                                mb: 1,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {stat.title}
                                        </Typography>
                                        <Typography 
                                            variant="h4" 
                                            sx={{ 
                                                fontWeight: 700,
                                                color: '#0f2b6e',
                                                fontSize: { xs: '1.5rem', sm: '2rem' }
                                            }}
                                        >
                                            <CountUp 
                                                start={0} 
                                                end={stat.value} 
                                                duration={2.5}
                                                suffix={stat.suffix || ''}
                                            />
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                ))}
            </Grid>

            {/* Mobile Class Info (No Change) */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
                <Card elevation={0} sx={{ 
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: '#64748b',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        mb: 0.5
                                    }}
                                >
                                    Primary Class
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: '#0f2b6e',
                                        fontWeight: 600
                                    }}
                                >
                                    {className}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: '#64748b',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        mb: 0.5
                                    }}
                                >
                                    Primary Subject
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: '#0f2b6e',
                                        fontWeight: 600
                                    }}
                                >
                                    {subjectName}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>

            {/* Notices Section (No Change) */}
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                <Grid item xs={12}>
                    <NoticeCard elevation={0}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <SeeNotice />
                        </CardContent>
                    </NoticeCard>
                </Grid>
            </Grid>
        </Container>
    );
};

// --- Styled Components (No Change) ---
// Your styled-components are already well-written and responsive.

const WelcomeCard = styled(Card)`
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 20px;
    padding: 20px; 
    margin-bottom: 24px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 24px;

    @media (min-width: 600px) {
        padding: 24px;
    }
`;

const TeachingInfo = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const InfoItem = styled(Box)`
    display: flex;
    flex-direction: column;
`;

const InfoLabel = styled(Typography)`
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const InfoValue = styled(Typography)`
    font-size: 1rem;
    color: #0f2b6e;
    font-weight: 700;
`;

const StatsCard = styled(Card)`
    border: 1px solid rgba(102, 126, 234, 0.15);
    border-radius: 16px;
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
    }

    @media (max-width: 600px) {
        border-radius: 12px;
    }
`;

const IconWrapper = styled(Box)`
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @media (max-width: 600px) {
        width: 48px;
        height: 48px;
        border-radius: 12px;

        svg {
            font-size: 28px !important;
        }
    }
`;

const NoticeCard = styled(Card)`
    border: 1px solid rgba(102, 126, 234, 0.15);
    border-radius: 16px;

    @media (max-width: 600px) {
        border-radius: 12px;
    }
`;

export default TeacherHomePage;