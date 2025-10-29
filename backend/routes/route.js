const router = require('express').Router();

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const { adminRegister, adminLogIn, getAdminDetail, adminForgotPassword} = require('../controllers/admin-controller.js');

const { sclassCreate, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents } = require('../controllers/class-controller.js');
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
    removeStudentAttendance } = require('../controllers/student-controller.js');
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects } = require('../controllers/subject-controller.js');
const { teacherRegister, teacherLogIn, teacherForgotPassword, teacherResetPassword, getTeachers, getTeacherDetail, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject, teacherAttendance } = require('../controllers/teacher-controller.js');
const { getTimeTable , putTimeTable , getBatch , postBatch , deleteBatch , getCalendar , postCalendar , putCalendar , deleteCalendar } = require('../controllers/timetable-controller.js');

// Admin (registration disabled)
// router.post('/AdminReg', adminRegister); // Disabled - admins created by system administrators only
router.post('/AdminLogin', adminLogIn);
router.post('/AdminForgotPassword', adminForgotPassword);

router.get("/Admin/:id", getAdminDetail)
// router.delete("/Admin/:id", deleteAdmin)

// router.put("/Admin/:id", updateAdmin)

// Student

router.post('/StudentReg', studentRegister);
router.post('/StudentLogin', studentLogIn)
router.post('/StudentForgotPassword', forgotPassword);
router.post('/StudentResetPassword/:token', resetPassword);

router.get("/Students/:id", getStudents)
router.get("/Student/:id", getStudentDetail)

router.delete("/Students/:id", deleteStudents)
router.delete("/StudentsClass/:id", deleteStudentsByClass)
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

router.get("/Teachers/:id", getTeachers)
router.get("/Teacher/:id", getTeacherDetail)

router.delete("/Teachers/:id", deleteTeachers)
router.delete("/TeachersClass/:id", deleteTeachersByClass)
router.delete("/Teacher/:id", deleteTeacher)

router.put("/TeacherSubject", updateTeacherSubject)

router.post('/TeacherAttendance/:id', teacherAttendance)

// Notice

// Public routes (Students and Teachers can view)
router.get('/NoticeList/:school', noticeList); // Get notices by school
router.get('/NoticeList', noticeList); // Get all notices
router.get('/Notice/:id', getNoticeDetail); // Get single notice

// Teacher and Admin routes (require teacher or admin authentication)
router.post('/NoticeCreate', authenticateTeacherOrAdmin, noticeCreate); // Create notice
router.get('/TeacherNotices', authenticateTeacherOrAdmin, getTeacherNotices); // Get teacher's/admin's notices
router.put('/Notice/:id', authenticateTeacherOrAdmin, updateNotice); // Update notice
router.delete('/Notice/:id', authenticateTeacherOrAdmin, deleteNotice); // Delete notice
router.delete('/TeacherNotices', authenticateTeacherOrAdmin, deleteTeacherNotices); // Delete all teacher/admin notices

// Admin routes
router.delete("/Notices/:id", deleteNotices) // Delete all notices (admin)

// Complain

router.post('/ComplainCreate', complainCreate);

router.get('/ComplainList/:id', complainList);

// Sclass

router.post('/SclassCreate', sclassCreate);

router.get('/SclassList/:id', sclassList);
router.get("/Sclass/:id", getSclassDetail)

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
router.get('/Calender' , getCalendar)
router.post('/Calender' , postCalendar)
router.put('/Calender' , putCalendar);
router.delete('/Calender/:id' , deleteCalendar)

// Subject
router.post('/SubjectCreate', subjectCreate);

router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);
router.get("/Subject/:id", getSubjectDetail)

router.delete("/Subject/:id", deleteSubject)
router.delete("/Subjects/:id", deleteSubjects)
router.delete("/SubjectsClass/:id", deleteSubjectsByClass)


module.exports = router;