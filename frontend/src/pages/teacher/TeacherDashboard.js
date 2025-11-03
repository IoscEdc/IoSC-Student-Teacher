import { useState } from 'react';
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    useTheme,
    Divider,
    IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppBar, Drawer } from '../../components/styles';
import Logout from '../Logout';
import TeacherSideBar from './TeacherSideBar';
import AccountMenu from '../../components/AccountMenu';

import TeacherUploadNotes from './TeacherUploadNotes';
import TeacherUploadAssignment from './TeacherUploadAssignment';
import StudentAttendance from '../admin/studentRelated/StudentAttendance';
import { AttendanceMarkingInterface, SimpleCheckboxTest, WorkingAttendanceMarking, BareMinimumTest } from '../../components/attendance';
import FreshAttendanceMarking from '../../components/attendance/FreshAttendanceMarking';
import DirectDOMTest from '../../components/attendance/DirectDOMTest';
import ExtensiveLoggingTest from '../../components/attendance/ExtensiveLoggingTest';
import PureReactTest from '../../components/attendance/PureReactTest';
import RadioButtonTest from '../../components/attendance/RadioButtonTest';
import AttendanceDebugger from '../../components/attendance/AttendanceDebugger';
import SimpleAttendanceMarking from '../../components/attendance/SimpleAttendanceMarking';
import FixedAttendanceMarking from '../../components/attendance/FixedAttendanceMarking';
import AttendanceNavigation from '../../components/attendance/AttendanceNavigation';
import DebugAttendanceMarking from '../../components/attendance/DebugAttendanceMarking';
import QuickAPITest from '../../components/attendance/QuickAPITest';
import ConnectionTest from '../../components/attendance/ConnectionTest';
import ImprovedTeacherAttendance from '../../components/attendance/ImprovedTeacherAttendance';
import AttendanceSystemTest from '../../components/attendance/AttendanceSystemTest';

import TeacherClassDetails from './TeacherClassDetails';
import TeacherComplain from './TeacherComplain';
import TeacherHomePage from './TeacherHomePage';
import TeacherProfile from './TeacherProfile';
import TeacherViewStudent from './TeacherViewStudent';
import TeacherNotices from './TeacherNotices';
import TeacherAttendanceHistory from './TeacherAttendanceHistory';
import StudentExamMarks from '../admin/studentRelated/StudentExamMarks';

const TeacherDashboard = () => {
    const [open, setOpen] = useState(false);
    const theme = useTheme(); 

    const brandDark = '#0f2b6e';
    const brandPrimary = '#2176FF';
    
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', marginTop: 7, marginLeft: 10}}>
            <CssBaseline />
            
            {/* App Bar */}
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
                        Teacher Dashboard
                    </Typography>
                    <AccountMenu />
                </Toolbar>
            </AppBar>
            
            {/* Sidebar */}
            {/* Sidebar */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    // --- 1. CHANGED WIDTH ---
                    width: open ? 260 : 80,
                    zIndex: 1300,
                    overflowY: 'auto',
                }}
            >
                <Drawer
                    variant="permanent"
                    open={open}
                    PaperProps={{
                        sx: {
                            // --- 2. CHANGED WIDTH ---
                            width: open ? 260 : 80,
                            height: '100vh',
                            overflowY: 'auto',
                            backgroundColor: brandDark,
                            color: theme.palette.common.white,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        },
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            // --- 3. CHANGED WIDTH ---
                            width: open ? 260 : 80,
                            borderRight: 'none',
                        },
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
                        <TeacherSideBar open={open} />
                    </Box>
                </Drawer>
            </Box>
            
            {/* Main Content */}
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
                    <Route path="/" element={<TeacherHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Teacher/dashboard" element={<TeacherHomePage />} />
                    <Route path="/Teacher/profile" element={<TeacherProfile />} />

                    <Route path="/Teacher/complain" element={<TeacherComplain />} />
                    <Route path="/Teacher/notices" element={<TeacherNotices />} />

                    <Route path="/Teacher/class/:classId" element={<TeacherClassDetails />}/>
                    <Route path="/Teacher/class/student/:id" element={<TeacherViewStudent />} />

                    <Route path="/Teacher/class/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
                    <Route path="/Teacher/class/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />
                      
                    <Route path="/Teacher/upload-notes" element={<TeacherUploadNotes />} />
                    <Route path="/Teacher/upload-assignment" element={<TeacherUploadAssignment />} />

                    <Route path="/Teacher/attendance/mark" element={<ImprovedTeacherAttendance />} />
                    <Route path="/Teacher/attendance/working" element={<WorkingAttendanceMarking situation="Subject" />} />
                    <Route path="/Teacher/attendance/fixed" element={<FixedAttendanceMarking situation="Subject" />} />
                    <Route path="/Teacher/attendance/original" element={<AttendanceMarkingInterface situation="Subject" />} />
                    <Route path="/Teacher/attendance/simple" element={<SimpleAttendanceMarking />} />
                    <Route path="/Teacher/attendance/history" element={<TeacherAttendanceHistory />} />
                    <Route path="/Teacher/attendance/debug" element={<AttendanceDebugger />} />
                    <Route path="/Teacher/attendance/debug-mark" element={<DebugAttendanceMarking />} />
                    <Route path="/Teacher/attendance" element={<AttendanceNavigation />} />
                    <Route path="/Teacher/attendance/test" element={<QuickAPITest />} />
                    <Route path="/Teacher/attendance/connection" element={<ConnectionTest />} />
                    <Route path="/Teacher/attendance/system-test" element={<AttendanceSystemTest />} />
                    <Route path="/Teacher/attendance/checkbox-test" element={<SimpleCheckboxTest />} />
                    <Route path="/Teacher/attendance/bare-minimum" element={<BareMinimumTest />} />
                    <Route path="/Teacher/attendance/pure-react" element={<PureReactTest />} />
                    <Route path="/Teacher/attendance/radio-test" element={<RadioButtonTest />} />
                    <Route path="/Teacher/attendance/dom-test" element={<DirectDOMTest />} />
                    <Route path="/Teacher/attendance/extensive-logging" element={<ExtensiveLoggingTest />} />

                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Box>
        </Box>
    );
}

export default TeacherDashboard;