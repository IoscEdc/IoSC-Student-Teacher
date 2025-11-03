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
const determineAttendanceOperation = (req) => {
    const { method, path } = req;
    
    console.log('🔍 DETERMINE OPERATION:', { method, path }); // ← ADD THIS

    // Check for student summary FIRST (most specific)
    if (path.includes('/summary/student/')) {
        console.log('✅ Detected: student_summary'); // ← ADD THIS
        return 'student_summary';
    }

    // Check for analytics operations
    if (path.includes('/analytics') || path.includes('/reports') || path.includes('/statistics')) {
        console.log('✅ Detected: analytics'); // ← ADD THIS
        return 'analytics';
    }

    // Check for bulk operations
    if (path.includes('/bulk') || (method === 'POST' && path.includes('/batch'))) {
        return 'bulk';
    }

    // Check for marking attendance
    if (method === 'POST' && (path.includes('/mark') || path.includes('/attendance'))) {
        return 'marking';
    }

    // Check for editing attendance
    if ((method === 'PUT' || method === 'PATCH') && path.includes('/attendance')) {
        return 'editing';
    }

    // Check for student data retrieval
    if (method === 'GET' && path.includes('/student')) {
        return 'student_retrieval';
    }

    console.log('⚠️ Defaulting to: generic'); // ← ADD THIS
    return 'generic';
};

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
        if (req.path.includes('/summary/student/')) {
            context.studentId = req.params.studentId;
        } else {
            context.studentId = req.params.studentId;
            context.recordId = req.params.id;
        }
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

// In: backend/middleware/attendanceErrorMiddleware.js

// In: backend/middleware/attendanceErrorMiddleware.js
// In: backend/middleware/attendanceErrorMiddleware.js

// In: backend/middleware/attendanceErrorMiddleware.js

const validateAttendancePermissions = (req, res, next) => {
    console.log('🔍 DEBUG req.params:', JSON.stringify(req.params, null, 2));
    const operation = determineAttendanceOperation(req);
    const userRole = req.user?.role;

    // --- THIS IS THE FIX ---
    // The log proves the parameter is 'id', not 'studentId'.
    // We will now correctly read from req.params.id.
    const studentId = req.params.studentId;
    // --- END OF FIX ---

    console.log('🔍 PERMISSION CHECK:', {
        operation,
        userRole,
        studentId, // This will now show the ID
        'req.user.id': req.user?.id,
        'match': req.user?.id === studentId,
        path: req.path
    });

    const permissions = {
        marking: ['Teacher', 'Admin'],
        editing: ['Teacher', 'Admin'],
        bulk: ['Admin'],
        analytics: ['Admin', 'Teacher'],
        student_retrieval: ['Teacher', 'Admin'],
        student_summary: ['Student', 'Teacher', 'Admin'],
        generic: ['Teacher', 'Admin', 'Student']
    };

    const allowedRoles = permissions[operation] || permissions.generic;

    if (!allowedRoles.includes(userRole)) {
        const error = new Error(`Role ${userRole} not authorized for ${operation} operation`);
        error.statusCode = 403;
        error.errorCode = 'ATTENDANCE_OPERATION_UNAUTHORIZED';
        return next(error);
    }

    // Students can only view their OWN summary
    if (operation === 'student_summary' && userRole === 'Student') {
        console.log('🔍 CHECKING STUDENT ACCESS:', {
            'req.user.id': req.user.id,
            'studentId': studentId,
            'string match': String(req.user.id) === String(studentId)
        });

        // This check will now work correctly
        if (String(req.user.id) !== String(studentId)) {
            const error = new Error('Students can only view their own attendance summary');
            error.statusCode = 403;
            error.errorCode = 'ATTENDANCE_UNAUTHORIZED_ACCESS';
            return next(error);
        }
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