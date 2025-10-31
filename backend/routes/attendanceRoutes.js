const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { 
    attendanceErrorHandler, 
    addRequestId, 
    validateAttendancePermissions, 
    logAttendanceOperation 
} = require('../middleware/attendanceErrorMiddleware');
const {
    cacheStudentSummary,
    cacheClassSummary,
    cacheSchoolAnalytics,
    cacheClassStudents,
    cacheTeacherAssignments,
    cacheAttendanceTrends,
    cacheLowAttendanceAlerts,
    invalidateAttendanceCaches,
    invalidateBulkCaches,
    invalidateAssignmentCaches
} = require('../middleware/cacheMiddleware');
const {
    // Basic attendance operations
    getClassStudentsForAttendance,
    markAttendance,
    updateAttendance,
    getAttendanceRecords,
    deleteAttendance,
    getSessionSummary,
    
    // Bulk operations
    bulkAssignStudents,
    bulkMarkAttendance,
    bulkTransferStudents,
    reassignTeacher,
    getBulkOperationStats,
    
    // Summary and analytics
    getStudentSummary,
    getClassSummary,
    getSchoolAnalytics,
    getAttendanceTrends,
    getLowAttendanceAlerts
} = require('../controllers/attendanceController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply attendance-specific middleware
router.use(addRequestId);
router.use(validateAttendancePermissions);
router.use(logAttendanceOperation);

// Basic Attendance Routes

/**
 * GET /api/attendance/class/:classId/students
 * Get all students in a class for attendance marking
 * Query params: subjectId (required)
 * Auth: Teacher (must be assigned to class/subject)
 */
router.get('/class/:classId/students', authorizeRoles('Teacher', 'Admin'), cacheClassStudents, getClassStudentsForAttendance);

/**
 * POST /api/attendance/mark
 * Mark attendance for multiple students in a session
 * Body: { classId, subjectId, date, session, studentAttendance }
 * Auth: Teacher (must be assigned to class/subject)
 */
router.post('/mark', authorizeRoles('Teacher', 'Admin'), invalidateAttendanceCaches, markAttendance);

/**
 * PUT /api/attendance/:id
 * Update existing attendance record
 * Body: { status, reason? }
 * Auth: Teacher (original marker) or Admin
 */
router.put('/:id', authorizeRoles('Teacher', 'Admin'), invalidateAttendanceCaches, updateAttendance);

/**
 * GET /api/attendance/records
 * Get attendance records with filtering options
 * Query params: classId?, subjectId?, teacherId?, studentId?, startDate?, endDate?, status?, session?, page?, limit?, sortBy?, sortOrder?
 * Auth: Teacher (own records), Student (own records), Admin (all records)
 */
router.get('/records', authorizeRoles('Teacher', 'Student', 'Admin'), getAttendanceRecords);

/**
 * DELETE /api/attendance/:id
 * Delete attendance record (admin only)
 * Body: { reason }
 * Auth: Admin only
 */
router.delete('/:id', authorizeRoles('Admin'), deleteAttendance);

/**
 * GET /api/attendance/session-summary/:classId/:subjectId
 * Get attendance summary for a specific session
 * Query params: date (required), session (required)
 * Auth: Teacher (assigned to class/subject), Admin
 */
router.get('/session-summary/:classId/:subjectId', authorizeRoles('Teacher', 'Admin'), getSessionSummary);

/**
 * GET /api/attendance/session-options
 * Get available session options for a class and subject
 * Query params: classId (required), subjectId (required)
 * Auth: Teacher, Admin
 */
router.get('/session-options', authorizeRoles('Teacher', 'Admin'), require('../controllers/attendanceController').getSessionOptions);

// Bulk Operation Routes

/**
 * POST /api/attendance/bulk/assign-students
 * Assign students to classes based on university ID patterns
 * Body: { pattern, targetClassId, subjectIds?, schoolId }
 * Auth: Admin only
 */
router.post('/bulk/assign-students', authorizeRoles('Admin'), invalidateBulkCaches, bulkAssignStudents);

/**
 * POST /api/attendance/bulk/mark
 * Mark attendance for multiple classes/sessions in bulk
 * Body: { attendanceRecords: [{ classId, subjectId, date, session, studentAttendance }] }
 * Auth: Teacher (must be assigned to all classes/subjects)
 */
router.post('/bulk/mark', authorizeRoles('Teacher', 'Admin'), invalidateBulkCaches, bulkMarkAttendance);

/**
 * PUT /api/attendance/bulk/transfer
 * Transfer students between classes with optional attendance migration
 * Body: { studentIds, fromClassId, toClassId, subjectIds?, migrateAttendance? }
 * Auth: Admin only
 */
router.put('/bulk/transfer', authorizeRoles('Admin'), invalidateBulkCaches, bulkTransferStudents);

/**
 * PUT /api/attendance/bulk/reassign-teacher
 * Reassign teacher to new subjects and classes
 * Body: { teacherId, newAssignments: [{ subjectId, classId }] }
 * Auth: Admin only
 */
router.put('/bulk/reassign-teacher', authorizeRoles('Admin'), invalidateAssignmentCaches, reassignTeacher);

/**
 * GET /api/attendance/bulk/stats/:schoolId
 * Get bulk operation statistics for a school
 * Query params: startDate?, endDate?
 * Auth: Admin only
 */
router.get('/bulk/stats/:schoolId', authorizeRoles('Admin'), getBulkOperationStats);

// Summary and Analytics Routes

/**
 * GET /api/attendance/summary/student/:studentId
 * Get attendance summary for a specific student
 * Query params: subjectId?, classId?
 * Auth: Student (own data), Teacher (assigned students), Admin
 */
router.get('/summary/student/:studentId', authorizeRoles('Student', 'Teacher', 'Admin'), cacheStudentSummary, getStudentSummary);

/**
 * GET /api/attendance/summary/class/:classId/subject/:subjectId
 * Get attendance summary for a class and subject
 * Query params: includeStudentDetails?, sortBy?, sortOrder?
 * Auth: Teacher (assigned to class/subject), Admin
 */
router.get('/summary/class/:classId/subject/:subjectId', authorizeRoles('Teacher', 'Admin'), cacheClassSummary, getClassSummary);

/**
 * GET /api/attendance/analytics/trends/:studentId/:subjectId
 * Get attendance trends for analytics
 * Query params: startDate?, endDate?
 * Auth: Student (own data), Teacher (assigned students), Admin
 */
router.get('/analytics/trends/:studentId/:subjectId', authorizeRoles('Student', 'Teacher', 'Admin'), cacheAttendanceTrends, getAttendanceTrends);

/**
 * GET /api/attendance/analytics/school/:schoolId
 * Get school-wide attendance analytics
 * Query params: startDate?, endDate?, includeClassBreakdown?, includeSubjectBreakdown?
 * Auth: Admin only
 */
router.get('/analytics/school/:schoolId', authorizeRoles('Admin'), cacheSchoolAnalytics, getSchoolAnalytics);

/**
 * GET /api/attendance/analytics/alerts/:classId
 * Get low attendance alerts for a class
 * Query params: subjectId?, threshold?
 * Auth: Teacher (assigned to class), Admin
 */
router.get('/analytics/alerts/:classId', authorizeRoles('Teacher', 'Admin'), cacheLowAttendanceAlerts, getLowAttendanceAlerts);

// Apply attendance-specific error handler (must be last)
router.use(attendanceErrorHandler);

module.exports = router;