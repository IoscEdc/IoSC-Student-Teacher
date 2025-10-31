import { useState } from 'react';
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
} from '@mui/material';
import TeacherUploadNotes from './TeacherUploadNotes';
import TeacherUploadAssignment from './TeacherUploadAssignment';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import TeacherSideBar from './TeacherSideBar';
import { Navigate, Route, Routes } from 'react-router-dom';
import Logout from '../Logout'
import AccountMenu from '../../components/AccountMenu';
import { AppBar, Drawer } from '../../components/styles';
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
    const [open, setOpen] = useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <AppBar open={open} position='absolute'>
                    <Toolbar sx={{ pr: '24px' }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={toggleDrawer}
                            sx={{
                                marginRight: '36px',
                                ...(open && { display: 'none' }),
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            sx={{ flexGrow: 1 }}
                        >
                            Teacher Dashboard
                        </Typography>
                        <AccountMenu />
                    </Toolbar>
                </AppBar>
                <Drawer variant="permanent" open={open} sx={open ? styles.drawerStyled : styles.hideDrawer}>
                    <Toolbar sx={styles.toolBarStyled}>
                        <IconButton onClick={toggleDrawer}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Toolbar>
                    <Divider />
                    <List component="nav">
                        <TeacherSideBar />
                    </List>
                </Drawer>
                <Box component="main" sx={styles.boxStyled}>
                    <Toolbar />
                    <Routes>
                        <Route path="/" element={<TeacherHomePage />} />
                        <Route path='*' element={<Navigate to="/" />} />
                        <Route path="/Teacher/dashboard" element={<TeacherHomePage />} />
                        <Route path="/Teacher/profile" element={<TeacherProfile />} />

                        <Route path="/Teacher/complain" element={<TeacherComplain />} />
                        <Route path="/Teacher/notices" element={<TeacherNotices />} />

                        <Route path="/Teacher/class" element={<TeacherClassDetails />} />
                        <Route path="/Teacher/class/student/:id" element={<TeacherViewStudent />} />

                        {/* Legacy individual attendance route - maintained for backward compatibility */}
                        <Route path="/Teacher/class/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
                        <Route path="/Teacher/class/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />
                          
                        <Route path="/Teacher/upload-notes" element={<TeacherUploadNotes />} />
                        <Route path="/Teacher/upload-assignment" element={<TeacherUploadAssignment />} />


                        {/* New attendance interface routes */}
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
        </>
    );
}

export default TeacherDashboard

const styles = {
    boxStyled: {
        backgroundColor: (theme) =>
            theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    toolBarStyled: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: [1],
    },
    drawerStyled: {
        display: "flex"
    },
    hideDrawer: {
        display: 'flex',
        '@media (max-width: 600px)': {
            display: 'none',
        },
    },
}