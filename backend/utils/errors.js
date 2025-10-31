/**
 * Custom Error Classes for Attendance System
 * Provides standardized error handling with proper error codes and user-friendly messages
 */

/**
 * Base Application Error class
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                name: this.name,
                message: this.message,
                code: this.errorCode,
                statusCode: this.statusCode,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}

/**
 * Validation Error - 400 Bad Request
 */
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

/**
 * Authentication Error - 401 Unauthorized
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required', details = null) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}

/**
 * Authorization Error - 403 Forbidden
 */
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions', details = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}

/**
 * Not Found Error - 404 Not Found
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource', details = null) {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', details);
    }
}

/**
 * Conflict Error - 409 Conflict
 */
class ConflictError extends AppError {
    constructor(message, details = null) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}

/**
 * Database Error - 500 Internal Server Error
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', details = null) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

/**
 * External Service Error - 502 Bad Gateway
 */
class ExternalServiceError extends AppError {
    constructor(service, message = 'External service unavailable', details = null) {
        super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
    }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', details = null) {
        super(message, 429, 'RATE_LIMIT_ERROR', details);
    }
}

/**
 * Attendance-specific error classes
 */

/**
 * Attendance Authorization Error
 */
class AttendanceAuthorizationError extends AuthorizationError {
    constructor(teacherId, classId, subjectId) {
        const details = { teacherId, classId, subjectId };
        super('Teacher not authorized to mark attendance for this class/subject', details);
        this.errorCode = 'ATTENDANCE_UNAUTHORIZED';
    }
}

/**
 * Attendance Already Marked Error
 */
class AttendanceAlreadyMarkedError extends ConflictError {
    constructor(classId, subjectId, date, session) {
        const details = { classId, subjectId, date, session };
        super('Attendance already marked for this class, subject, date, and session', details);
        this.errorCode = 'ATTENDANCE_ALREADY_MARKED';
    }
}

/**
 * Student Not Enrolled Error
 */
class StudentNotEnrolledError extends ValidationError {
    constructor(studentId, classId) {
        const details = { studentId, classId };
        super('Student is not enrolled in the specified class', details);
        this.errorCode = 'STUDENT_NOT_ENROLLED';
    }
}

/**
 * Invalid Session Error
 */
class InvalidSessionError extends ValidationError {
    constructor(session, validSessions = []) {
        const details = { providedSession: session, validSessions };
        super('Invalid session specified', details);
        this.errorCode = 'INVALID_SESSION';
    }
}

/**
 * Attendance Edit Window Expired Error
 */
class AttendanceEditWindowExpiredError extends AuthorizationError {
    constructor(recordDate, windowHours = 24) {
        const details = { recordDate, windowHours };
        super(`Attendance can only be edited within ${windowHours} hours of marking`, details);
        this.errorCode = 'EDIT_WINDOW_EXPIRED';
    }
}

/**
 * Bulk Operation Error
 */
class BulkOperationError extends AppError {
    constructor(operation, successCount, failureCount, failures = []) {
        const message = `Bulk ${operation} completed with ${failureCount} failures out of ${successCount + failureCount} total operations`;
        const details = { operation, successCount, failureCount, failures };
        super(message, 207, 'BULK_OPERATION_ERROR', details); // 207 Multi-Status
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    ExternalServiceError,
    RateLimitError,
    AttendanceAuthorizationError,
    AttendanceAlreadyMarkedError,
    StudentNotEnrolledError,
    InvalidSessionError,
    AttendanceEditWindowExpiredError,
    BulkOperationError
};