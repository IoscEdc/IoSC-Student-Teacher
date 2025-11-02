const router = require('express').Router();

const { getAllAdmins, adminLogIn, getAdminDetail, adminForgotPassword} = require('../controllers/admin-controller.js');

// Import attendance routes
const attendanceRoutes = require('./attendanceRoutes');
const attendanceFallback = require('./attendanceFallback');

const { sclassCreate,classList, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents } = require('../controllers/class-controller.js');
const { complainCreate, complainList } = require('../controllers/complain-controller.js');
const { noticeCreate, noticeList, getTeacherNotices, getNoticeDetail, deleteNotices, deleteNotice, updateNotice, deleteTeacherNotices } = require('../controllers/notice-controller.js');
const { authenticateTeacher, authenticateToken, authenticateAdmin, authenticateTeacherOrAdmin } = require('../middleware/auth.js');
const {
    studentRegister,
    studentLogIn,
    getStudents,
    getStudentDetail,
    deleteStudents,
    deleteStudent,
    updateStudent,
    studentAttendance,
    deleteStudentsByClass,
    updateExamResult,
    clearAllStudentsAttendanceBySubject,
    clearAllStudentsAttendance,
    removeStudentAttendanceBySubject,
    forgotPassword,
    resetPassword,
    verifyEmailStudent,
    removeStudentAttendance } = require('../controllers/student-controller.js');
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects } = require('../controllers/subject-controller.js');
const { teacherRegister,getTeachersByClass, teacherLogIn, teacherForgotPassword, teacherResetPassword, getTeachers, getTeacherDetail, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject,verifyEmailTeacher, teacherAttendance } = require('../controllers/teacher-controller.js');
const { getTimeTable , putTimeTable , getBatch , postBatch , deleteBatch , getCalendar , postCalendar , putCalendar , deleteCalendar } = require('../controllers/timetable-controller.js');

// Admin
router.post('/AdminLogin', adminLogIn);
router.post('/AdminForgotPassword', adminForgotPassword);
router.get("/Admin/:id", getAdminDetail)

// Student
router.post('/StudentReg', studentRegister);
router.post('/StudentLogin', studentLogIn)
router.post('/StudentForgotPassword', forgotPassword);
router.post('/StudentResetPassword/:token', resetPassword);
router.get('/api/student/verify/:token', verifyEmailStudent);
router.get("/Students/:id", getStudents)
router.get("/Student/:id", getStudentDetail)
router.delete("/Students/school/:id", deleteStudents) // Renamed for clarity
router.delete("/Students/class/:id", deleteStudentsByClass)
router.delete("/Student/:id", deleteStudent)
router.put("/Student/:id", updateStudent)
router.put('/UpdateExamResult/:id', updateExamResult)
router.put('/StudentAttendance/:id', studentAttendance)
router.put('/RemoveAllStudentsSubAtten/:id', clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', clearAllStudentsAttendance);
router.put('/RemoveStudentSubAtten/:id', removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', removeStudentAttendance)

// Teacher
router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn);
router.post('/TeacherForgotPassword', teacherForgotPassword);
router.post('/TeacherResetPassword/:token', teacherResetPassword);
router.get("/Teachers", getTeachers)
router.get("/Teacher/:id", getTeacherDetail) // FIXED: Added /:id
router.get("/teachers/class/:id", getTeachersByClass)
router.delete("/Teachers/:id", deleteTeachers)
router.delete("/TeachersClass/:id", deleteTeachersByClass)
router.delete("/Teacher/:id", deleteTeacher)
router.put("/TeacherSubject", updateTeacherSubject)
router.get('/api/teacher/verify/:token', verifyEmailTeacher);
router.post('/TeacherAttendance/:id', teacherAttendance)

// Notice
router.get('/NoticeList/:school', noticeList);
router.get('/NoticeList', noticeList);
router.get('/Notice/:id', getNoticeDetail);
router.post('/NoticeCreate', authenticateTeacherOrAdmin, noticeCreate);
router.get('/TeacherNotices', authenticateTeacherOrAdmin, getTeacherNotices);
router.put('/Notice/:id', authenticateTeacherOrAdmin, updateNotice);
router.delete('/Notice/:id', authenticateTeacherOrAdmin, deleteNotice);
router.delete('/TeacherNotices', authenticateTeacherOrAdmin, deleteTeacherNotices);
router.delete("/Notices/:id", deleteNotices)

// Complain
router.post('/ComplainCreate', complainCreate); // Consider adding auth middleware
router.get('/ComplainList/:id', complainList);

// Sclass
router.get('/schools', getAllAdmins); // Consider renaming for clarity
router.post('/SclassCreate', sclassCreate);
router.get('/SclassList/:id', sclassList);
router.get("/Sclass/:id", getSclassDetail)
router.get('/Sclasses/school/:id', classList);
router.get("/Sclass/Students/:id", getSclassStudents)
router.delete("/Sclasses/:id", deleteSclasses)
router.delete("/Sclass/:id", deleteSclass)

// TimeTable
router.get('/TimeTable/:batch', getTimeTable);
router.put('/TimeTable/:batch', putTimeTable);
router.get('/batches' ,getBatch);
router.post('/batches' , postBatch);
router.delete('/batches/:batch' , deleteBatch);

// Calendar
router.get('/Calendar' , getCalendar) // FIXED: Spelling
router.post('/Calendar' , postCalendar) // FIXED: Spelling
router.put('/Calendar' , putCalendar); // FIXED: Spelling
router.delete('/Calendar/:id' , deleteCalendar) // FIXED: Spelling

// Subject
router.post('/SubjectCreate', subjectCreate);
router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);
router.get("/Subject/:id", getSubjectDetail)
router.delete("/Subject/:id", deleteSubject)
router.delete("/Subjects/:id", deleteSubjects)
router.delete("/SubjectsClass/:id", deleteSubjectsByClass)

// Attendance (Delegated Routes - Good!)
router.use('/attendance', attendanceRoutes);
router.use('/attendance-fallback', attendanceFallback); // For testing, likely removable later

module.exports = router;