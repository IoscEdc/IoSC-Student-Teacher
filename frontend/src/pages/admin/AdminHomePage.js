import { Container, Grid, Paper, Box, Typography, Divider } from '@mui/material';
import SeeNotice from '../../components/SeeNotice';
import Students from "../../assets/img1.png";
import Classes from "../../assets/img2.png";
import Teachers from "../../assets/img3.png";
import Fees from "../../assets/img4.png";
import CountUp from 'react-countup';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getAllSclasses } from '../../redux/sclassRelated/sclassHandle';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';
// IMPORTED: Added an icon for the new notice header
import AnnouncementIcon from '@mui/icons-material/Announcement';

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const { studentsList } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { teachersList } = useSelector((state) => state.teacher);

    const { currentUser } = useSelector(state => state.user);

    const adminID = currentUser._id;

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));
    }, [adminID, dispatch]);

    const numberOfStudents = studentsList && studentsList.length;
    const numberOfClasses = sclassesList && sclassesList.length;
    const numberOfTeachers = teachersList && teachersList.count;

    // --- Brand Colors (consistent with other pages) ---
    const brandDark = '#0f2b6e';
    const brandPrimary = '#2176FF';

    // --- Reusable Card Style (No longer needed, styles are inline) ---
    // const DashboardCardStyle = { ... };

    return (
        // UPDATED: Fixed container padding. Removed 'pl' and adjusted 'pt'.
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 4 }, pb: { xs: 6, sm: 8 } }}>
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {[
                    { label: 'Total Students', value: numberOfStudents, img: Students, duration: 2.5 },
                    { label: 'Total Classes', value: numberOfClasses, img: Classes, duration: 5 },
                    { label: 'Total Teachers', value: numberOfTeachers, img: Teachers, duration: 2.5 },
                ].map((card, index) => (
                    // UPDATED: Grid set to xs={6} for 2-column mobile layout
                    <Grid item xs={6} sm={6} md={4} key={index}>
                        <Paper
                            sx={{
                                // UPDATED: Responsive padding
                                p: { xs: 1.5, sm: 3 },
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                // UPDATED: Responsive height
                                minHeight: { xs: 160, sm: 200 },
                                borderRadius: 3,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: '0 12px 30px rgba(33, 118, 255, 0.2)',
                                },
                            }}
                        >
                            {/* UPDATED: Responsive image box */}
                            <Box sx={{ width: { xs: 48, sm: 70 }, height: { xs: 48, sm: 70 }, mb: 1.5 }}>
                                <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: brandDark,
                                    fontWeight: 600,
                                    mb: 1,
                                    // UPDATED: Responsive font size
                                    fontSize: { xs: '0.85rem', sm: '1.1rem' },
                                    textAlign: 'center',
                                }}
                            >
                                {card.label}
                            </Typography>
                            <Typography
                                variant="h4"
                                sx={{
                                    color: brandPrimary,
                                    fontWeight: 700,
                                    // UPDATED: Responsive font size
                                    fontSize: { xs: '1.4rem', sm: '2rem' },
                                    textAlign: 'center',
                                }}
                            >
                                <CountUp start={0} end={card.value || 0} duration={card.duration} prefix={card.prefix || ''} />
                            </Typography>
                        </Paper>
                    </Grid>
                ))}

                {/* Notice Section */}
                <Grid item xs={12}>
                    <Paper
                        sx={{
                            p: { xs: 2, sm: 3 },
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            borderRadius: 3,
                        }}
                    >
                        {/* --- NEW NOTICE HEADER --- */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AnnouncementIcon sx={{ color: brandDark, mr: 1.5, fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                            <Typography variant="h6" sx={{ color: brandDark, fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                Announcements
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2.5 }} />
                        {/* --- END OF NEW HEADER --- */}
                        
                        <SeeNotice />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminHomePage;