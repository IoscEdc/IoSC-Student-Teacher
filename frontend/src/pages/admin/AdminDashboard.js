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
import { AppBar, Drawer } from '../../components/styles'; // Using your custom styled AppBar/Drawer
import Logout from '../Logout';
import SideBar from './SideBar';
import AdminProfile from './AdminProfile';
import AdminHomePage from './AdminHomePage';

// (All your other route imports remain the same)
import AddStudent from './studentRelated/AddStudent';
import SeeComplains from './studentRelated/SeeComplains';
import ShowStudents from './studentRelated/ShowStudents';
import StudentAttendance from './studentRelated/StudentAttendance';
import StudentExamMarks from './studentRelated/StudentExamMarks';
import ViewStudent from './studentRelated/ViewStudent';

import AddNotice from './noticeRelated/AddNotice';
import ShowNotices from './noticeRelated/ShowNotices';

import ShowSubjects from './subjectRelated/ShowSubjects';
import SubjectForm from './subjectRelated/SubjectForm';
import ViewSubject from './subjectRelated/ViewSubject';

import AddTeacher from './teacherRelated/AddTeacher';
import ChooseClass from './teacherRelated/ChooseClass';
import ChooseSubject from './teacherRelated/ChooseSubject';
import ShowTeachers from './teacherRelated/ShowTeachers';
import TeacherDetails from './teacherRelated/TeacherDetails';

import AddClass from './classRelated/AddClass';
import ClassDetails from './classRelated/ClassDetails';
import ShowClasses from './classRelated/ShowClasses';
import AccountMenu from '../../components/AccountMenu';

import AdminTimeTable from './AdminTimeTable';
import AdminCalender from './AdminCalender';

import {
    AttendanceAnalytics,
    BulkStudentManager,
    TeacherAssignmentManager,
    AttendanceReports,
    AuditLogViewer
} from './attendanceRelated';
import AttendanceDebugger from '../../components/attendance/AttendanceDebugger';
import SimpleAttendanceMarking from '../../components/attendance/SimpleAttendanceMarking';
import FixedAttendanceMarking from '../../components/attendance/FixedAttendanceMarking';
import AdminAttendanceMarking from '../../components/attendance/AdminAttendanceMarking';
import AttendanceNavigation from '../../components/attendance/AttendanceNavigation';
import AttendanceSystemTest from '../../components/attendance/AttendanceSystemTest';
import AuthTest from '../../components/attendance/AuthTest';
import SimpleTest from '../../components/attendance/SimpleTest';
import MinimalAdminAttendance from '../../components/attendance/MinimalAdminAttendance';

const AdminDashboard = () => {
    const [open, setOpen] = useState(false);
    const theme = useTheme(); 

    const brandDark = '#0f2b6e';
    const brandPrimary = '#2176FF';
    
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', marginTop: 7, marginLeft: 7}}>
            <CssBaseline />
            
            {/* App Bar (No changes) */}
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
                        Admin Dashboard
                    </Typography>
                    <AccountMenu />
                </Toolbar>
            </AppBar>
            
            {/* Sidebar */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: open ? 240 : 72,
                    zIndex: 1300,
                    overflowY: 'auto', // enables independent scrolling
                }}
                >
                <Drawer
                    variant="permanent"
                    open={open}
                    PaperProps={{
                    sx: {
                        width: open ? 240 : 72,
                        height: '100vh',
                        overflowY: 'auto', // ensures drawer scrolls independently
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


                        // === THIS IS THE FIX FOR SUBHEADERS ===
                        '& .MuiList-root': {
                            backgroundColor: 'transparent', // Ensure list bg is not white
                        },
                        '& .MuiListSubheader-root': {
                            backgroundColor: 'transparent', // Make their background transparent
                            color: 'rgba(255, 255, 255, 0.7)', // Light text color
                            fontWeight: 600,
                            paddingTop: '16px',
                            paddingLeft: open ? '24px' : '16px',
                            paddingBottom: '8px',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '1px',
                            // Hide subheader text when drawer is closed
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
                    {/* ... (Toolbar with Chevron icon is unchanged) ... */}
                    <Toolbar sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        px: 2,
                        minHeight: '64px !important'
                    }}>
                        <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
                            {open?<ChevronLeftIcon />:<MenuIcon />}
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
                        <SideBar open={open} />
                    </Box>
                </Drawer>
            </Box>
            
            {/* Main Content (No changes) */}
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
                    {/* (All your routes remain unchanged) */}
                    <Route path="/" element={<AdminHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Admin/dashboard" element={<AdminHomePage />} />
                    <Route path="/Admin/profile" element={<AdminProfile />} />
                    <Route path="/Admin/complains" element={<SeeComplains />} />
                    <Route path="/Admin/addnotice" element={<AddNotice />} />
                    <Route path="/Admin/notices" element={<ShowNotices />} />
                    <Route path="/Admin/subjects" element={<ShowSubjects />} />
                    <Route path="/Admin/subjects/subject/:classID/:subjectID" element={<ViewSubject />} />
                    <Route path="/Admin/subjects/chooseclass" element={<ChooseClass situation="Subject" />} />
                    <Route path="/Admin/addsubject/:id" element={<SubjectForm />} />
                    <Route path="/Admin/class/subject/:classID/:subjectID" element={<ViewSubject />} />
                    <Route path="/Admin/subject/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
                    <Route path="/Admin/subject/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />
                    <Route path="/Admin/addclass" element={<AddClass />} />
                    <Route path="/Admin/classes" element={<ShowClasses />} />
                    <Route path="/Admin/classes/class/:id" element={<ClassDetails />} />
                    <Route path="/Admin/class/addstudents/:id" element={<AddStudent situation="Class" />} />
                    <Route path="/Admin/addstudents" element={<AddStudent situation="Student" />} />
                    <Route path="/Admin/students" element={<ShowStudents />} />
                    <Route path="/Admin/students/student/:id" element={<ViewStudent />} />
                    <Route path="/Admin/students/student/attendance/:id" element={<StudentAttendance situation="Student" />} />
                    <Route path="/Admin/students/student/marks/:id" element={<StudentExamMarks situation="Student" />} />
                    <Route path="/Admin/teachers" element={<ShowTeachers />} />
                    <Route path="/Admin/teachers/teacher/:id" element={<TeacherDetails />} />
                    <Route path="/Admin/teachers/chooseclass" element={<ChooseClass situation="Teacher" />} />
                    <Route path="/Admin/teachers/choosesubject/:id" element={<ChooseSubject situation="Norm" />} />
                    <Route path="/Admin/teachers/choosesubject/:classID/:teacherID" element={<ChooseSubject situation="Teacher" />} />
                    <Route path="/Admin/teachers/addteacher/:id" element={<AddTeacher />} />
                    <Route path='/Admin/timetable' element={<AdminTimeTable />} />
                    <Route path='/Admin/calender' element={<AdminCalender />} />
                    <Route path="/Admin/attendance/analytics" element={<AttendanceAnalytics />} />
                    <Route path="/Admin/attendance/bulk-management" element={<BulkStudentManager />} />
                    <Route path="/Admin/attendance/teacher-assignments" element={<TeacherAssignmentManager />} />
                    <Route path="/Admin/attendance/reports" element={<AttendanceReports />} />
                    <Route path="/Admin/attendance/audit-logs" element={<AuditLogViewer />} />
                    <Route path="/Admin/attendance/mark" element={<AdminAttendanceMarking />} />
                    <Route path="/Admin/attendance/simple" element={<SimpleAttendanceMarking />} />
_                  <Route path="/Admin/attendance/debug" element={<AttendanceDebugger />} />
                    <Route path="/Admin/attendance/test" element={<AttendanceSystemTest />} />
                    <Route path="/Admin/attendance/auth-test" element={<AuthTest />} />
                    <Route path="/Admin/attendance/simple-test" element={<SimpleTest />} />
                    <Route path="/Admin/attendance/minimal" element={<MinimalAdminAttendance />} />
                    <Route path="/Admin/attendance" element={<AttendanceNavigation />} />
                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Box>
        </Box>
    );
}

export default AdminDashboard;