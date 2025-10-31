/**
 * Attendance-specific error handling middleware
 * Provides enhanced error responses for attendance operations
 */

const AttendanceErrorHandler = require('../utils/attendanceErrorHandler');
const { formatErrorResponse } = require('../utils/errorResponses');
const logger = require('../utils/logger');

/**
 * Middleware to handle attendance-specific errors
 * Should be used specifically for attendance routes
 */
const attendanceErrorHandler = (err, req, res, next) => {
    // Determine the type of attendance operation based on the route
    const operation = determineAttendanceOperation(req);
    
    // Extract attendance context from request
    const context = extractAttendanceContext(req, err);
    
    let errorResponse;

    // Handle different types of attendance operations
    switch (operation) {
        case 'marking':
            errorResponse = AttendanceErrorHandler.handleAttendanceMarkingError(err, context);
            break;
        case 'bulk':
            errorResponse = AttendanceErrorHandler.handleBulkAttendanceError(err, context);
            break;
        case 'editing':
            errorResponse = AttendanceErrorHandler.handleAttendanceEditError(err, context);
            break;
        case 'analytics':
            errorResponse = AttendanceErrorHandler.handleAttendanceAnalyticsError(err, context);
            break;
        default:
            errorResponse = AttendanceErrorHandler.handleGenericAttendanceError(err, context);
    }

    // Add contextual help based on user role
    if (req.user) {
        const help = AttendanceErrorHandler.getAttendanceHelp(req.user.role, operation);
        errorResponse.help = help;
    }

    // Log the attendance error with full context
    logger.attendance('error_handled', {
        operation,
        context,
        error: err.message,
        userRole: req.user?.role,
        userId: req.user?.id,
        statusCode: err.statusCode || 500
    });

    // Send the enhanced error response
    res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Determine the type of attendance operation based on the request
 * @param {Object} req - Express request object
 * @returns {string} Operation type
 */
function determineAttendanceOperation(req) {
    const path = req.path.toLowerCase();
    const method = req.method.toLowerCase();

    if (path.includes('/bulk')) {
        return 'bulk';
    }
    
    if (path.includes('/analytics') || path.includes('/reports') || path.includes('/summary')) {
        return 'analytics';
    }
    
    if (method === 'put' && path.includes('/attendance/')) {
        return 'editing';
    }
    
    if (method === 'post' && path.includes('/mark')) {
        return 'marking';
    }
    
    if (method === 'get' && path.includes('/students')) {
        return 'student_retrieval';
    }
    
    return 'generic';
}

/**
 * Extract attendance-specific context from the request and error
 * @param {Object} req - Express request object
 * @param {Error} err - The error object
 * @returns {Object} Attendance context
 */
function extractAttendanceContext(req, err) {
    const context = {
        method: req.method,
        path: req.path,
        userRole: req.user?.role,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    };

    // Extract from URL parameters
    if (req.params) {
        context.classId = req.params.classId;
        context.subjectId = req.params.subjectId;
        context.studentId = req.params.studentId;
        context.recordId = req.params.id;
    }

    // Extract from request body
    if (req.body) {
        context.classId = context.classId || req.body.classId;
        context.subjectId = context.subjectId || req.body.subjectId;
        context.teacherId = req.body.teacherId || req.user?.id;
        context.date = req.body.date;
        context.session = req.body.session;
        
        // For bulk operations
        if (req.body.attendanceRecords) {
            context.totalRecords = req.body.attendanceRecords.length;
        }
        if (req.body.studentAttendance) {
            context.totalRecords = req.body.studentAttendance.length;
        }
    }

    // Extract from query parameters
    if (req.query) {
        context.dateRange = req.query.dateRange;
        context.reportType = req.query.reportType;
        context.filters = req.query.filters;
    }

    // Extract from error details if available
    if (err && err.details) {
        Object.assign(context, err.details);
    }

    return context;
}

/**
 * Middleware to add request ID for error tracking
 */
const addRequestId = (req, res, next) => {
    req.id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
};

/**
 * Middleware to validate attendance operation permissions
 */
const validateAttendancePermissions = (req, res, next) => {
    const operation = determineAttendanceOperation(req);
    const userRole = req.user?.role;

    // Define role-based permissions for attendance operations
    const permissions = {
        marking: ['Teacher', 'Admin'],
        editing: ['Teacher', 'Admin'],
        bulk: ['Admin'],
        analytics: ['Admin', 'Teacher'],
        student_retrieval: ['Teacher', 'Admin'],
        generic: ['Teacher', 'Admin', 'Student']
    };

    const allowedRoles = permissions[operation] || permissions.generic;

    if (!allowedRoles.includes(userRole)) {
        const error = new Error(`Role ${userRole} not authorized for ${operation} operation`);
        error.statusCode = 403;
        error.errorCode = 'ATTENDANCE_OPERATION_UNAUTHORIZED';
        return next(error);
    }

    next();
};

/**
 * Middleware to log attendance operations for monitoring
 */
const logAttendanceOperation = (req, res, next) => {
    const operation = determineAttendanceOperation(req);
    const context = extractAttendanceContext(req, null);

    logger.attendance('operation_started', {
        operation,
        context,
        requestId: req.id
    });

    // Override res.json to log successful operations
    const originalJson = res.json;
    res.json = function(data) {
        if (data.success !== false) {
            logger.attendance('operation_completed', {
                operation,
                context,
                requestId: req.id,
                statusCode: res.statusCode
            });
        }
        return originalJson.call(this, data);
    };

    next();
};

module.exports = {
    attendanceErrorHandler,
    addRequestId,
    validateAttendancePermissions,
    logAttendanceOperation
};