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
import SideBar from './SideBar';
import AdminProfile from './AdminProfile';
import AdminHomePage from './AdminHomePage';

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
    
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            
            {/* App Bar */}
            <AppBar 
                open={open}
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.background.default 
                        : '#fff',
                    color: theme.palette.text.primary,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    position: 'fixed',
                    height: 64
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
                            fontWeight: 600,
                            fontSize: '1.25rem'
                        }}
                    >
                        Admin Dashboard
                    </Typography>
                    <AccountMenu />
                </Toolbar>
            </AppBar>
            
            {/* Sidebar */}
            <Drawer 
                variant="permanent" 
                open={open}
                sx={{
                    borderRight: 'none',
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.background.paper 
                        : '#f8fafc'
                }}
            >
                <Toolbar sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    px: 2,
                    minHeight: '64px !important'
                }}>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <Box sx={{ overflow: 'auto' }}>
                    <SideBar open={open} />
                </Box>
            </Drawer>
            
            {/* Main Content */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.background.default 
                        : '#f9fafb',
                    minHeight: '100vh',
                    pt: '80px'
                }}
            >
                <Routes>
                    <Route path="/" element={<AdminHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Admin/dashboard" element={<AdminHomePage />} />
                    <Route path="/Admin/profile" element={<AdminProfile />} />
                    <Route path="/Admin/complains" element={<SeeComplains />} />

                    {/* Notice */}
                    <Route path="/Admin/addnotice" element={<AddNotice />} />
                    <Route path="/Admin/notices" element={<ShowNotices />} />

                    {/* Subject */}
                    <Route path="/Admin/subjects" element={<ShowSubjects />} />
                    <Route path="/Admin/subjects/subject/:classID/:subjectID" element={<ViewSubject />} />
                    <Route path="/Admin/subjects/chooseclass" element={<ChooseClass situation="Subject" />} />

                    <Route path="/Admin/addsubject/:id" element={<SubjectForm />} />
                    <Route path="/Admin/class/subject/:classID/:subjectID" element={<ViewSubject />} />

                    <Route path="/Admin/subject/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
                    <Route path="/Admin/subject/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />

                    {/* Class */}
                    <Route path="/Admin/addclass" element={<AddClass />} />
                    <Route path="/Admin/classes" element={<ShowClasses />} />
                    <Route path="/Admin/classes/class/:id" element={<ClassDetails />} />
                    <Route path="/Admin/class/addstudents/:id" element={<AddStudent situation="Class" />} />

                    {/* Student */}
                    <Route path="/Admin/addstudents" element={<AddStudent situation="Student" />} />
                    <Route path="/Admin/students" element={<ShowStudents />} />
                    <Route path="/Admin/students/student/:id" element={<ViewStudent />} />
                    <Route path="/Admin/students/student/attendance/:id" element={<StudentAttendance situation="Student" />} />
                    <Route path="/Admin/students/student/marks/:id" element={<StudentExamMarks situation="Student" />} />

                    {/* Teacher */}
                    <Route path="/Admin/teachers" element={<ShowTeachers />} />
                    <Route path="/Admin/teachers/teacher/:id" element={<TeacherDetails />} />
                    <Route path="/Admin/teachers/chooseclass" element={<ChooseClass situation="Teacher" />} />
                    <Route path="/Admin/teachers/choosesubject/:id" element={<ChooseSubject situation="Norm" />} />
                    <Route path="/Admin/teachers/choosesubject/:classID/:teacherID" element={<ChooseSubject situation="Teacher" />} />
                    <Route path="/Admin/teachers/addteacher/:id" element={<AddTeacher />} />

                    {/* Time Table */}
                    <Route path='/Admin/timetable' element={<AdminTimeTable />} />
                    <Route path='/Admin/calender' element={<AdminCalender />} />

                    {/* Attendance Management */}
                    <Route path="/Admin/attendance/analytics" element={<AttendanceAnalytics />} />
                    <Route path="/Admin/attendance/bulk-management" element={<BulkStudentManager />} />
                    <Route path="/Admin/attendance/teacher-assignments" element={<TeacherAssignmentManager />} />
                    <Route path="/Admin/attendance/reports" element={<AttendanceReports />} />
                    <Route path="/Admin/attendance/audit-logs" element={<AuditLogViewer />} />
                    <Route path="/Admin/attendance/mark" element={<AdminAttendanceMarking />} />
                    <Route path="/Admin/attendance/simple" element={<SimpleAttendanceMarking />} />
                    <Route path="/Admin/attendance/debug" element={<AttendanceDebugger />} />
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

// const AdminDashboard = () => {
//     const [open, setOpen] = useState(false);
//     const toggleDrawer = () => {
//         setOpen(!open);
//     };

//     return (
//         <>
//             <Box sx={{ display: 'flex' }}>
//                 <CssBaseline />
//                 <AppBar open={open} position='absolute'>
//                     <Toolbar sx={{ pr: '24px' }}>
//                         <IconButton
//                             edge="start"
//                             color="inherit"
//                             aria-label="open drawer"
//                             onClick={toggleDrawer}
//                             sx={{
//                                 marginRight: '36px',
//                                 ...(open && { display: 'none' }),
//                             }}
//                         >
//                             <MenuIcon />
//                         </IconButton>
//                         <Typography
//                             component="h1"
//                             variant="h6"
//                             color="inherit"
//                             noWrap
//                             sx={{ flexGrow: 1 }}
//                         >
//                             Admin Dashboard
//                         </Typography>
//                         <AccountMenu />
//                     </Toolbar>
//                 </AppBar>
//                 <Drawer variant="permanent" open={open} sx={open ? styles.drawerStyled : styles.hideDrawer}>
//                     <Toolbar sx={styles.toolBarStyled}>
//                         <IconButton onClick={toggleDrawer}>
//                             <ChevronLeftIcon />
//                         </IconButton>
//                     </Toolbar>
//                     <Divider />
//                     <List component="nav">
//                         <SideBar />
//                     </List>
//                 </Drawer>
//                 <Box component="main" sx={styles.boxStyled}>
//                     <Toolbar />
//                     <Routes>
//                         <Route path="/" element={<AdminHomePage />} />
//                         <Route path='*' element={<Navigate to="/" />} />
//                         <Route path="/Admin/dashboard" element={<AdminHomePage />} />
//                         <Route path="/Admin/profile" element={<AdminProfile />} />
//                         <Route path="/Admin/complains" element={<SeeComplains />} />

//                         {/* Notice */}
//                         <Route path="/Admin/addnotice" element={<AddNotice />} />
//                         <Route path="/Admin/notices" element={<ShowNotices />} />

//                         {/* Subject */}
//                         <Route path="/Admin/subjects" element={<ShowSubjects />} />
//                         <Route path="/Admin/subjects/subject/:classID/:subjectID" element={<ViewSubject />} />
//                         <Route path="/Admin/subjects/chooseclass" element={<ChooseClass situation="Subject" />} />

//                         <Route path="/Admin/addsubject/:id" element={<SubjectForm />} />
//                         <Route path="/Admin/class/subject/:classID/:subjectID" element={<ViewSubject />} />

//                         <Route path="/Admin/subject/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
//                         <Route path="/Admin/subject/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />

//                         {/* Class */}
//                         <Route path="/Admin/addclass" element={<AddClass />} />
//                         <Route path="/Admin/classes" element={<ShowClasses />} />
//                         <Route path="/Admin/classes/class/:id" element={<ClassDetails />} />
//                         <Route path="/Admin/class/addstudents/:id" element={<AddStudent situation="Class" />} />

//                         {/* Student */}
//                         <Route path="/Admin/addstudents" element={<AddStudent situation="Student" />} />
//                         <Route path="/Admin/students" element={<ShowStudents />} />
//                         <Route path="/Admin/students/student/:id" element={<ViewStudent />} />
//                         <Route path="/Admin/students/student/attendance/:id" element={<StudentAttendance situation="Student" />} />
//                         <Route path="/Admin/students/student/marks/:id" element={<StudentExamMarks situation="Student" />} />

//                         {/* Teacher */}
//                         <Route path="/Admin/teachers" element={<ShowTeachers />} />
//                         <Route path="/Admin/teachers/teacher/:id" element={<TeacherDetails />} />
//                         <Route path="/Admin/teachers/chooseclass" element={<ChooseClass situation="Teacher" />} />
//                         <Route path="/Admin/teachers/choosesubject/:id" element={<ChooseSubject situation="Norm" />} />
//                         <Route path="/Admin/teachers/choosesubject/:classID/:teacherID" element={<ChooseSubject situation="Teacher" />} />
//                         <Route path="/Admin/teachers/addteacher/:id" element={<AddTeacher />} />

//                         <Route path="/logout" element={<Logout />} />
//                     </Routes>
//                 </Box>
//             </Box>
//         </>
//     );
// }

// export default AdminDashboard

// const styles = {
//     boxStyled: {
//         backgroundColor: (theme) =>
//             theme.palette.mode === 'light'
//                 ? theme.palette.grey[100]
//                 : theme.palette.grey[900],
//         flexGrow: 1,
//         height: '100vh',
//         overflow: 'auto',
//     },
//     toolBarStyled: {
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'flex-end',
//         px: [1],
//     },
//     drawerStyled: {
//         display: "flex"
//     },
//     hideDrawer: {
//         display: 'flex',
//         '@media (max-width: 600px)': {
//             display: 'none',
//         },
//     },
// }