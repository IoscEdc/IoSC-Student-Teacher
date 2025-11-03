import { useState } from 'react';
import {
    CssBaseline,
    Box,
    Toolbar,
    Typography,
    Divider,
    IconButton,
    useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppBar, Drawer } from '../../components/styles';
import Logout from '../Logout';
import AccountMenu from '../../components/AccountMenu';

// Student Routes
import StudentSideBar from './StudentSideBar';
import StudentHomePage from './StudentHomePage';
import StudentTimeTable from './StudentTimeTable';
import StudentCalender from './StudentCalender';
import StudentProfile from './StudentProfile';
import StudentSubjects from './StudentSubjects';
import ViewStdAttendance from './ViewStdAttendance';
import StudentComplain from './StudentComplain';
import StudentNotices from './StudentNotices';
import StudentAttendanceDetail from './StudentAttendanceDetail';
import AttendanceDashboard from '../../components/attendance/AttendanceDashboardSimple';
import StudentPortalDebugger from '../../components/attendance/StudentPortalDebugger';
import StudentPortalValidator from '../../components/attendance/StudentPortalValidator';
import StudentNotes from './StudentNotes';
import StudentAssignments from './StudentAssignments';

const StudentDashboard = () => {
    const [open, setOpen] = useState(false);
    const theme = useTheme(); 

    const brandDark = '#0f2b6e';
    const brandPrimary = '#2176FF';
    
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', marginTop: 7, marginLeft: 7 }}>
            <CssBaseline />
            
            {/* App Bar - EXACT COPY from Admin */}
            <AppBar 
                open={open}
                position="fixed" 
                sx={{
                    backgroundColor: brandDark,
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderBottom: 'none',
                    height: 64,
                }}
            >
                <Toolbar sx={{ px: 3 }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        sx={{
                            marginRight: 3,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{ 
                            flexGrow: 1,
                            fontWeight: 700,
                            fontSize: '1.35rem',
                            letterSpacing: '0.5px'
                        }}
                    >
                        Student Dashboard
                    </Typography>
                    <AccountMenu />
                </Toolbar>
            </AppBar>
            
            {/* Sidebar - EXACT COPY from Admin */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: open ? 240 : 72,
                    zIndex: 1300,
                    overflowY: 'auto',
                }}
            >
                <Drawer
                    variant="permanent"
                    open={open}
                    PaperProps={{
                        sx: {
                            width: open ? 240 : 72,
                            height: '100vh',
                            overflowY: 'auto',
                            backgroundColor: brandDark,
                            color: theme.palette.common.white,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        },
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: open ? 240 : 72,
                            borderRight: 'none',
                        },

                        // === EXACT COPY OF SUBHEADER FIX ===
                        '& .MuiList-root': {
                            backgroundColor: 'transparent',
                        },
                        '& .MuiListSubheader-root': {
                            backgroundColor: 'transparent',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 600,
                            paddingTop: '16px',
                            paddingLeft: open ? '24px' : '16px',
                            paddingBottom: '8px',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '1px',
                            ...(!open && {
                                display: 'none',
                            }),
                        },
                        // === END OF FIX ===

                        '& .MuiListItemIcon-root': {
                            color: 'rgba(255, 255, 255, 0.8)', 
                            minWidth: '40px',
                        },
                        '& .MuiListItemText-primary': {
                            color: 'rgba(255, 255, 255, 0.9)', 
                            fontWeight: 500,
                        },
                        '& .Mui-selected, & .Mui-selected:hover': {
                            backgroundColor: brandPrimary,
                            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                                color: theme.palette.common.white,
                            },
                        },
                        '& .MuiListItem-root:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                    }}
                >
                    {/* Toolbar with Chevron - EXACT COPY */}
                    <Toolbar sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        px: 2,
                        minHeight: '64px !important'
                    }}>
                        <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
                            {open ? <ChevronLeftIcon /> : <MenuIcon />}
                        </IconButton>
                    </Toolbar>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

                    <Box 
                        sx={{ 
                            overflow: 'auto',
                            ...(!open && {
                                '& .MuiListItemText-root': {
                                    display: 'none',
                                },
                                '& .MuiListItemButton-root': {
                                    justifyContent: 'center',
                                    paddingLeft: 0,
                                    paddingRight: 0,
                                },
                                '& .MuiListItemIcon-root': {
                                    minWidth: 0,
                                    margin: 0,
                                },
                            }),
                        }}
                    >
                        <StudentSideBar open={open} />
                    </Box>
                </Drawer>
            </Box>
            
            {/* Main Content - EXACT COPY from Admin */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, sm: 3 },
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.background.default 
                        : '#f4f7fa',
                    minHeight: '100vh',
                    pt: '88px' 
                }}
            >
                <Routes>
                    <Route path="/" element={<StudentHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Student/dashboard" element={<StudentHomePage />} />
                    <Route path="/Student/profile" element={<StudentProfile />} />

                    <Route path="/Student/subjects" element={<StudentSubjects />} />
                    <Route path="/Student/attendance" element={<ViewStdAttendance />} />
                    <Route path="/Student/notices" element={<StudentNotices />} />
                    <Route path="/Student/attendance-dashboard" element={<AttendanceDashboard />} />
                    <Route path="/Student/attendance-detail" element={<StudentAttendanceDetail />} />
                    <Route path="/Student/attendance-debug" element={<StudentPortalDebugger />} />
                    <Route path="/Student/attendance-validator" element={<StudentPortalValidator />} />
                    <Route path="/Student/complain" element={<StudentComplain />} />

                    <Route path='/Student/timetable' element={<StudentTimeTable />} />
                    <Route path='/Student/calender' element={<StudentCalender />} />

                    <Route path="/Student/notes" element={<StudentNotes />} />
                    <Route path="/Student/assignments" element={<StudentAssignments />} />

                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Box>
        </Box>
    );
}

export default StudentDashboard;