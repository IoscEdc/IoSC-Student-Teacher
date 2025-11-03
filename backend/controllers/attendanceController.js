const mongoose = require('mongoose');
const AttendanceService = require('../services/AttendanceService');
const BulkManagementService = require('../services/BulkManagementService');
const SummaryService = require('../services/SummaryService');
const ValidationService = require('../services/ValidationService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { 
    ValidationError, 
    AuthorizationError, 
    AttendanceAuthorizationError,
    NotFoundError 
} = require('../utils/errors');
const logger = require('../utils/logger');
const attendanceErrorMonitoringService = require('../services/AttendanceErrorMonitoringService');

/**
 * Get students for attendance marking
 */
const getClassStudentsForAttendance = asyncHandler(async (req, res) => {
    console.log('req',req);
    const { classId } = req.params;
    const { subjectId } = req.query;
    const teacherId = req.user.id;

    if (!subjectId) {
        throw new ValidationError('Subject ID is required', { field: 'subjectId' });
    }

    logger.attendance('get_students_for_attendance', {
        classId,
        subjectId,
        teacherId,
        userRole: req.user.role
    });

    const students = await AttendanceService.getClassStudentsForAttendance(
        classId, 
        subjectId, 
        teacherId,
        req.user.role
    );

    res.status(200).json({
        success: true,
        data: students,
        message: 'Students retrieved successfully'
    });
});

/**
 * Mark attendance for multiple students
 */
const markAttendance = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { classId, subjectId, date, session, studentAttendance } = req.body;
    const teacherId = req.user.id;

    console.log('req',req);

    // Validate required fields
    const missingFields = [];
    if (!classId) missingFields.push('classId');
    if (!subjectId) missingFields.push('subjectId');
    if (!date) missingFields.push('date');
    if (!session) missingFields.push('session');
    if (!studentAttendance) missingFields.push('studentAttendance');

    if (missingFields.length > 0) {
        throw new ValidationError('Missing required fields', { 
            missingFields,
            providedFields: Object.keys(req.body)
        });
    }

    const attendanceData = {
        classId,
        subjectId,
        teacherId,
        date,
        session,
        studentAttendance,
        userRole: req.user.role
    };

    const auditInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    };

    logger.attendance('mark_attendance_start', {
        classId,
        subjectId,
        teacherId,
        date,
        session,
        studentCount: studentAttendance.length
    });

    try {
        const result = await AttendanceService.bulkMarkAttendance(attendanceData, auditInfo);
        const responseTime = Date.now() - startTime;

        // Record successful operation for monitoring
        attendanceErrorMonitoringService.recordSuccessfulOperation('marking', {
            classId,
            subjectId,
            teacherId,
            studentCount: studentAttendance.length,
            successCount: result.successCount,
            failureCount: result.failureCount
        }, responseTime);

        logger.attendance('mark_attendance_complete', {
            classId,
            subjectId,
            teacherId,
            successCount: result.successCount,
            failureCount: result.failureCount,
            responseTime
        });

        res.status(200).json({
            success: true,
            data: result,
            message: `Attendance marked successfully. ${result.successCount} students processed, ${result.failureCount} failed.`
        });
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Track the error with attendance monitoring
        attendanceErrorMonitoringService.trackAttendanceError(error, {
            operation: 'marking',
            classId,
            subjectId,
            teacherId,
            date,
            session,
            studentCount: studentAttendance.length,
            userRole: req.user.role,
            userId: req.user.id,
            responseTime
        });

        throw error; // Re-throw to be handled by error middleware
    }
});

/**
 * Update existing attendance record
 */
const updateAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBy = req.user.id;

    if (!id) {
        throw new ValidationError('Attendance record ID is required', { field: 'id' });
    }

    const auditInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: updateData.reason || 'Manual update'
    };

    logger.attendance('update_attendance_start', {
        recordId: id,
        updatedBy,
        updateFields: Object.keys(updateData)
    });

    const updatedRecord = await AttendanceService.updateAttendance(
        id, 
        updateData, 
        updatedBy, 
        auditInfo
    );

    logger.attendance('update_attendance_complete', {
        recordId: id,
        updatedBy,
        success: true
    });

    res.status(200).json({
        success: true,
        data: updatedRecord,
        message: 'Attendance updated successfully'
    });
});

/**
 * Get attendance records with filtering
 */
const getAttendanceRecords = async (req, res) => {

    console.log('req',req);
    try {
        const filters = {
            classId: req.query.classId,
            subjectId: req.query.subjectId,
            teacherId: req.query.teacherId,
            studentId: req.query.studentId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            status: req.query.status,
            session: req.query.session,
            schoolId: req.query.schoolId
        };

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            sortBy: req.query.sortBy || 'date',
            sortOrder: req.query.sortOrder || 'desc',
            populate: req.query.populate !== 'false'
        };

        const result = await AttendanceService.getAttendanceByFilters(filters, options);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Attendance records retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete attendance record (admin only)
 */
const deleteAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const deletedBy = req.user.id;

    if (!id) {
        throw new ValidationError('Attendance record ID is required', { field: 'id' });
    }

    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can delete attendance records', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'delete_attendance'
        });
    }

    const auditInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    };

    logger.security('attendance_deletion_attempt', {
        recordId: id,
        deletedBy,
        reason,
        userRole: req.user.role
    });

    await AttendanceService.deleteAttendance(id, deletedBy, reason, auditInfo);

    logger.security('attendance_deletion_success', {
        recordId: id,
        deletedBy,
        reason
    });

    res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully'
    });
});

/**
 * Get session summary
 */
const getSessionSummary = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;
        const { date, session } = req.query;

        if (!date || !session) {
            return res.status(400).json({
                success: false,
                message: 'Date and session are required'
            });
        }

        const summary = await AttendanceService.getSessionSummary(classId, subjectId, date, session);

        res.status(200).json({
            success: true,
            data: summary,
            message: 'Session summary retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Bulk Management Endpoints

/**
 * Assign students to classes based on university ID patterns
 */
const bulkAssignStudents = async (req, res) => {
    try {
        const { pattern, targetClassId, subjectIds, schoolId } = req.body;
        const performedBy = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can perform bulk student assignments'
            });
        }

        if (!pattern || !targetClassId || !schoolId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pattern, targetClassId, schoolId'
            });
        }

        const assignmentData = {
            pattern,
            targetClassId,
            subjectIds: subjectIds || [],
            schoolId,
            performedBy
        };

        const auditInfo = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };

        const result = await BulkManagementService.assignStudentsByPattern(assignmentData, auditInfo);

        res.status(200).json({
            success: true,
            data: result,
            message: `Bulk assignment completed. ${result.successCount} students assigned, ${result.failureCount} failed.`
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Bulk mark attendance for multiple students
 */
const bulkMarkAttendance = asyncHandler(async (req, res) => {
    const { attendanceRecords } = req.body;
    const teacherId = req.user.id;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        throw new ValidationError('attendanceRecords array is required', {
            field: 'attendanceRecords',
            expectedType: 'array',
            receivedType: typeof attendanceRecords
        });
    }

    if (attendanceRecords.length === 0) {
        throw new ValidationError('attendanceRecords array cannot be empty', {
            field: 'attendanceRecords',
            length: 0
        });
    }

    const auditInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    };

    logger.attendance('bulk_mark_attendance_start', {
        teacherId,
        recordCount: attendanceRecords.length,
        userRole: req.user.role
    });

    const results = [];
    let totalSuccess = 0;
    let totalFailure = 0;

    // Process each attendance record
    for (const record of attendanceRecords) {
        try {
            const attendanceData = {
                ...record,
                teacherId
            };

            const result = await AttendanceService.bulkMarkAttendance(attendanceData, auditInfo);
            results.push({
                classId: record.classId,
                subjectId: record.subjectId,
                date: record.date,
                session: record.session,
                result
            });

            totalSuccess += result.successCount;
            totalFailure += result.failureCount;

        } catch (error) {
            logger.error('Bulk attendance record processing failed', {
                record,
                error: error.message,
                teacherId
            });

            results.push({
                classId: record.classId,
                subjectId: record.subjectId,
                date: record.date,
                session: record.session,
                error: error.message
            });
            totalFailure += record.studentAttendance ? record.studentAttendance.length : 0;
        }
    }

    logger.attendance('bulk_mark_attendance_complete', {
        teacherId,
        totalRecordsProcessed: attendanceRecords.length,
        totalStudentsSuccess: totalSuccess,
        totalStudentsFailure: totalFailure
    });

    res.status(200).json({
        success: true,
        data: {
            results,
            summary: {
                totalRecordsProcessed: attendanceRecords.length,
                totalStudentsSuccess: totalSuccess,
                totalStudentsFailure: totalFailure
            }
        },
        message: `Bulk attendance marking completed. ${totalSuccess} students marked successfully, ${totalFailure} failed.`
    });
});

/**
 * Transfer students between classes
 */
const bulkTransferStudents = async (req, res) => {
    try {
        const { studentIds, fromClassId, toClassId, subjectIds, migrateAttendance } = req.body;
        const performedBy = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can perform student transfers'
            });
        }

        if (!studentIds || !fromClassId || !toClassId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: studentIds, fromClassId, toClassId'
            });
        }

        const transferData = {
            studentIds,
            fromClassId,
            toClassId,
            subjectIds: subjectIds || [],
            migrateAttendance: migrateAttendance || false,
            performedBy
        };

        const auditInfo = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };

        const result = await BulkManagementService.transferStudentAssignments(transferData, auditInfo);

        res.status(200).json({
            success: true,
            data: result,
            message: `Student transfer completed. ${result.successCount} students transferred, ${result.failureCount} failed.`
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Reassign teacher to new subjects and classes
 */
const reassignTeacher = async (req, res) => {
    try {
        const { teacherId, newAssignments } = req.body;
        const performedBy = req.user.id;

        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can reassign teachers'
            });
        }

        if (!teacherId || !newAssignments) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: teacherId, newAssignments'
            });
        }

        const reassignmentData = {
            teacherId,
            newAssignments,
            performedBy
        };

        const auditInfo = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };

        const result = await BulkManagementService.reassignTeacher(reassignmentData, auditInfo);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Teacher reassignment completed successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get bulk operation statistics
 */
const getBulkOperationStats = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { startDate, endDate } = req.query;

        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view bulk operation statistics'
            });
        }

        const stats = await BulkManagementService.getBulkOperationStats(
            schoolId,
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null
        );

        res.status(200).json({
            success: true,
            data: stats,
            message: 'Bulk operation statistics retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Summary and Analytics Endpoints

/**
 * Get student attendance summary
 */
const getStudentSummary = async (req, res) => {
    console.log('req',req);
    try {
        const { studentId } = req.params;
        
        // Validate studentId format
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }

        const filters = {
            subjectId: req.query.subjectId,
            classId: req.query.classId
        };

        // Validate filter ObjectIds if provided
        if (filters.subjectId && !mongoose.Types.ObjectId.isValid(filters.subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }

        if (filters.classId && !mongoose.Types.ObjectId.isValid(filters.classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }

        const summary = await SummaryService.getStudentAttendanceSummary(studentId, filters);

        // If no summary data exists, return empty array with success
        if (!summary || summary.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No attendance data found for this student. Attendance records will appear here once teachers start marking attendance.'
            });
        }

        res.status(200).json({
            success: true,
            data: summary,
            message: 'Student attendance summary retrieved successfully'
        });

    } catch (error) {
        console.error('Error in getStudentSummary:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format provided'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while retrieving student attendance summary'
        });
    }
};

/**
 * Get class attendance summary
 */
const getClassSummary = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;
        const options = {
            includeStudentDetails: req.query.includeStudentDetails !== 'false',
            sortBy: req.query.sortBy || 'attendancePercentage',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const summary = await SummaryService.getClassAttendanceSummary(classId, subjectId, options);

        res.status(200).json({
            success: true,
            data: summary,
            message: 'Class attendance summary retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get school-wide attendance analytics
 */
const getSchoolAnalytics = async (req, res) => {
    try {
        // 1. Get schoolId from req.params.id (to match your route)
        const { id: schoolId } = req.params;

        // 2. Get all filters from req.query
        const {
            startDate,
            endDate,
            classId,
            subjectId,
            teacherId,
            attendanceStatus, // This is the name from your frontend filter state
            includeClassBreakdown,
            includeSubjectBreakdown
        } = req.query;

        // 3. Build the options object
        const options = {
            startDate: startDate,
            endDate: endDate,
            includeClassBreakdown: includeClassBreakdown !== 'false',
            includeSubjectBreakdown: includeSubjectBreakdown !== 'false'
        };

        // 4. Add optional filters *only if they exist*
        if (classId) options.classId = classId;
        if (subjectId) options.subjectId = subjectId;
        if (teacherId) options.teacherId = teacherId;
        if (attendanceStatus && attendanceStatus !== 'all') {
            options.status = attendanceStatus;
        }

        // 5. Check if user is admin (already handled by authorizeRoles, but good for safety)
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view school-wide analytics'
            });
        }

        // 6. Pass BOTH schoolId and options to the service
        //    (Your SummaryService must accept schoolId as the first argument)
        const analytics = await SummaryService.getSchoolAnalytics(schoolId, options);

        res.status(200).json({
            success: true,
            data: analytics, // The frontend expects response.data.data
            message: 'School analytics retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error in getSchoolAnalytics:', error); // Better logging
        res.status(400).json({
            success: false,
            message: 'Failed to get school analytics: ' + error.message
        });
    }
};

/**
 * Get attendance trends for analytics
 */
const getAttendanceTrends = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;
        const dateRange = {
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const trends = await SummaryService.getAttendanceTrends(studentId, subjectId, dateRange);

        res.status(200).json({
            success: true,
            data: trends,
            message: 'Attendance trends retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get low attendance alerts
 */
const getLowAttendanceAlerts = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId, threshold } = req.query;

        const alerts = await SummaryService.getLowAttendanceAlerts(
            classId,
            subjectId || null,
            threshold ? parseInt(threshold) : 75
        );

        res.status(200).json({
            success: true,
            data: alerts,
            message: 'Low attendance alerts retrieved successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get session options for a class and subject
 */
const getSessionOptions = asyncHandler(async (req, res) => {
    const { classId, subjectId } = req.query;

    if (!classId || !subjectId) {
        throw new ValidationError('Class ID and Subject ID are required', { 
            fields: ['classId', 'subjectId'] 
        });
    }

    logger.attendance('get_session_options', {
        classId,
        subjectId,
        teacherId: req.user.id,
        userRole: req.user.role
    });

    // Get session configurations for the class and subject
    const SessionConfiguration = require('../models/sessionConfigurationSchema');
    const sessionConfigs = await SessionConfiguration.find({
        classId: classId,
        subjectId: subjectId
    });

    // Transform session configs into session options
    const sessionOptions = [];
    
    sessionConfigs.forEach(config => {
        if (config.sessionType === 'lecture') {
            // Generate lecture options based on sessions per week
            for (let i = 1; i <= config.sessionsPerWeek; i++) {
                sessionOptions.push({
                    value: `Lecture ${i}`,
                    label: `Lecture ${i}`,
                    type: 'lecture',
                    duration: config.sessionDuration
                });
            }
        } else {
            // Add other session types
            const sessionName = config.sessionType.charAt(0).toUpperCase() + config.sessionType.slice(1);
            sessionOptions.push({
                value: sessionName,
                label: sessionName,
                type: config.sessionType,
                duration: config.sessionDuration
            });
        }
    });

    res.status(200).json({
        success: true,
        data: sessionOptions,
        message: 'Session options retrieved successfully'
    });
});

module.exports = {
    // Basic attendance operations
    getClassStudentsForAttendance,
    markAttendance,
    updateAttendance,
    getAttendanceRecords,
    deleteAttendance,
    getSessionSummary,
    getSessionOptions,
    
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
};