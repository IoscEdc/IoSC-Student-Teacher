/**
 * Attendance-specific error handling utilities
 * Provides specialized error handling for attendance operations
 */

const { 
    AppError,
    ValidationError,
    AttendanceAuthorizationError,
    AttendanceAlreadyMarkedError,
    StudentNotEnrolledError,
    InvalidSessionError,
    AttendanceEditWindowExpiredError,
    BulkOperationError
} = require('./errors');
const logger = require('./logger');
const errorMonitoringService = require('../services/ErrorMonitoringService');

/**
 * Enhanced error handler specifically for attendance operations
 */
class AttendanceErrorHandler {
    /**
     * Handle attendance marking errors with context-aware responses
     * @param {Error} error - The error that occurred
     * @param {Object} context - Attendance operation context
     * @returns {Object} Enhanced error response
     */
    static handleAttendanceMarkingError(error, context = {}) {
        const { teacherId, classId, subjectId, date, session, studentId } = context;
        
        // Track attendance-specific error
        errorMonitoringService.trackError(error, {
            ...context,
            operation: 'attendance_marking',
            errorCategory: 'attendance'
        });

        // Log attendance-specific error
        logger.attendance('marking_error', {
            error: error.message,
            context,
            severity: error.statusCode >= 500 ? 'critical' : 'warning'
        });

        // Provide context-specific error handling
        if (error instanceof AttendanceAuthorizationError) {
            return {
                ...error.toJSON(),
                suggestions: [
                    'Verify you are assigned to teach this class and subject',
                    'Contact your administrator to update your teaching assignments',
                    'Check if you selected the correct class and subject'
                ],
                recoveryActions: [
                    {
                        type: 'navigate',
                        label: 'View My Classes',
                        action: '/teacher/classes'
                    },
                    {
                        type: 'contact',
                        label: 'Request Access',
                        action: `mailto:admin@school.edu?subject=Access Request for Class ${classId}`
                    }
                ]
            };
        }

        if (error instanceof AttendanceAlreadyMarkedError) {
            return {
                ...error.toJSON(),
                suggestions: [
                    'Use the "Edit Attendance" feature to make changes',
                    'Check the attendance history to view existing records',
                    'Contact administration if you need to override existing attendance'
                ],
                recoveryActions: [
                    {
                        type: 'navigate',
                        label: 'Edit Attendance',
                        action: `/attendance/edit/${classId}/${subjectId}?date=${date}&session=${session}`
                    },
                    {
                        type: 'navigate',
                        label: 'View History',
                        action: `/attendance/history/${classId}/${subjectId}`
                    }
                ]
            };
        }

        if (error instanceof StudentNotEnrolledError) {
            return {
                ...error.toJSON(),
                suggestions: [
                    'Verify the student is in the correct class',
                    'Contact administration to update student enrollment',
                    'Check if the student has been transferred to another class'
                ],
                recoveryActions: [
                    {
                        type: 'contact',
                        label: 'Report Enrollment Issue',
                        action: `mailto:admin@school.edu?subject=Student Enrollment Issue - ${studentId}`
                    }
                ]
            };
        }

        // Default error handling
        return this.handleGenericAttendanceError(error, context);
    }

    /**
     * Handle bulk attendance operation errors
     * @param {Error} error - The error that occurred
     * @param {Object} context - Bulk operation context
     * @returns {Object} Enhanced error response
     */
    static handleBulkAttendanceError(error, context = {}) {
        const { operation, totalRecords, successCount, failureCount } = context;

        // Track bulk operation error
        errorMonitoringService.trackError(error, {
            ...context,
            operation: 'bulk_attendance',
            errorCategory: 'attendance_bulk'
        });

        logger.attendance('bulk_operation_error', {
            error: error.message,
            context,
            severity: failureCount > successCount ? 'critical' : 'warning'
        });

        if (error instanceof BulkOperationError) {
            return {
                ...error.toJSON(),
                suggestions: [
                    `${successCount} out of ${totalRecords} records processed successfully`,
                    'Review the failed records and retry individual operations',
                    'Check for data validation issues in failed records'
                ],
                recoveryActions: [
                    {
                        type: 'retry',
                        label: 'Retry Failed Records',
                        action: 'retry_failed'
                    },
                    {
                        type: 'download',
                        label: 'Download Error Report',
                        action: 'download_error_report'
                    }
                ]
            };
        }

        return this.handleGenericAttendanceError(error, context);
    }

    /**
     * Handle attendance editing errors
     * @param {Error} error - The error that occurred
     * @param {Object} context - Edit operation context
     * @returns {Object} Enhanced error response
     */
    static handleAttendanceEditError(error, context = {}) {
        const { recordId, originalDate, editAttemptDate } = context;

        // Track attendance edit error
        errorMonitoringService.trackError(error, {
            ...context,
            operation: 'attendance_edit',
            errorCategory: 'attendance'
        });

        logger.attendance('edit_error', {
            error: error.message,
            context,
            severity: 'warning'
        });

        if (error instanceof AttendanceEditWindowExpiredError) {
            const hoursSinceMarking = Math.floor((new Date(editAttemptDate) - new Date(originalDate)) / (1000 * 60 * 60));
            
            return {
                ...error.toJSON(),
                suggestions: [
                    `Attendance was marked ${hoursSinceMarking} hours ago`,
                    'Contact your administrator for special permission to edit',
                    'Use the comment feature to note any corrections needed'
                ],
                recoveryActions: [
                    {
                        type: 'contact',
                        label: 'Request Edit Permission',
                        action: `mailto:admin@school.edu?subject=Edit Permission Request - Record ${recordId}`
                    },
                    {
                        type: 'navigate',
                        label: 'Add Comment',
                        action: `/attendance/comment/${recordId}`
                    }
                ]
            };
        }

        return this.handleGenericAttendanceError(error, context);
    }

    /**
     * Handle attendance analytics and reporting errors
     * @param {Error} error - The error that occurred
     * @param {Object} context - Analytics operation context
     * @returns {Object} Enhanced error response
     */
    static handleAttendanceAnalyticsError(error, context = {}) {
        const { reportType, dateRange, filters } = context;

        // Track analytics error
        errorMonitoringService.trackError(error, {
            ...context,
            operation: 'attendance_analytics',
            errorCategory: 'attendance_reporting'
        });

        logger.attendance('analytics_error', {
            error: error.message,
            context,
            severity: 'info'
        });

        return {
            ...error.toJSON(),
            suggestions: [
                'Try reducing the date range for your report',
                'Remove some filters to simplify the query',
                'Contact support if you need help with complex reports'
            ],
            recoveryActions: [
                {
                    type: 'retry',
                    label: 'Retry with Smaller Range',
                    action: 'reduce_date_range'
                },
                {
                    type: 'navigate',
                    label: 'Basic Reports',
                    action: '/attendance/reports/basic'
                }
            ]
        };
    }

    /**
     * Handle generic attendance errors
     * @param {Error} error - The error that occurred
     * @param {Object} context - Operation context
     * @returns {Object} Enhanced error response
     */
    static handleGenericAttendanceError(error, context = {}) {
        // Track generic attendance error
        errorMonitoringService.trackError(error, {
            ...context,
            operation: 'attendance_generic',
            errorCategory: 'attendance'
        });

        logger.attendance('generic_error', {
            error: error.message,
            context,
            severity: error.statusCode >= 500 ? 'critical' : 'warning'
        });

        return {
            success: false,
            error: {
                code: error.errorCode || 'ATTENDANCE_ERROR',
                message: error.message || 'An attendance operation failed',
                suggestions: [
                    'Try refreshing the page and attempting the operation again',
                    'Check your internet connection',
                    'Contact support if the problem persists'
                ],
                recoveryActions: [
                    {
                        type: 'retry',
                        label: 'Try Again',
                        action: 'retry'
                    },
                    {
                        type: 'navigate',
                        label: 'Go to Dashboard',
                        action: '/dashboard'
                    }
                ],
                timestamp: new Date().toISOString(),
                context: process.env.NODE_ENV === 'development' ? context : undefined
            }
        };
    }

    /**
     * Get attendance operation help based on user role and operation
     * @param {string} userRole - User's role (Admin, Teacher, Student)
     * @param {string} operation - Current operation
     * @returns {Object} Contextual help information
     */
    static getAttendanceHelp(userRole, operation) {
        const helpContent = {
            Teacher: {
                'mark-attendance': {
                    title: 'Marking Attendance',
                    tips: [
                        'Select the correct class and subject before marking attendance',
                        'Choose the appropriate session (Lecture 1, Lecture 2, etc.)',
                        'You can mark students as Present, Absent, Late, or Excused',
                        'Save your changes before navigating away',
                        'Use bulk select/deselect for efficiency'
                    ],
                    commonIssues: [
                        {
                            issue: 'Cannot see my classes',
                            solution: 'Contact admin to verify your teaching assignments'
                        },
                        {
                            issue: 'Attendance already marked',
                            solution: 'Use the Edit Attendance feature to make changes'
                        }
                    ]
                },
                'edit-attendance': {
                    title: 'Editing Attendance',
                    tips: [
                        'You can only edit attendance within 24 hours of marking',
                        'Changes will be logged for audit purposes',
                        'Contact administration for edits beyond the time limit'
                    ],
                    commonIssues: [
                        {
                            issue: 'Edit window expired',
                            solution: 'Contact admin for special permission'
                        }
                    ]
                }
            },
            Student: {
                'view-attendance': {
                    title: 'Viewing Your Attendance',
                    tips: [
                        'Your attendance is updated in real-time after each class',
                        'Check your attendance percentage regularly',
                        'Contact your teacher if you notice any discrepancies'
                    ],
                    commonIssues: [
                        {
                            issue: 'Attendance not showing',
                            solution: 'Wait for teacher to mark attendance or contact them'
                        }
                    ]
                }
            },
            Admin: {
                'manage-attendance': {
                    title: 'Managing Attendance System',
                    tips: [
                        'Monitor attendance patterns across all classes',
                        'Use bulk operations for efficient management',
                        'Review audit logs for attendance changes',
                        'Set up alerts for low attendance patterns'
                    ],
                    commonIssues: [
                        {
                            issue: 'Bulk operations failing',
                            solution: 'Check data format and reduce batch size'
                        }
                    ]
                }
            }
        };

        return helpContent[userRole]?.[operation] || {
            title: 'Attendance Help',
            tips: ['Contact support if you need assistance'],
            commonIssues: []
        };
    }

    /**
     * Generate attendance error summary for monitoring
     * @param {Array} errors - Array of attendance errors
     * @returns {Object} Error summary
     */
    static generateAttendanceErrorSummary(errors) {
        const summary = {
            totalErrors: errors.length,
            errorsByType: {},
            errorsByOperation: {},
            criticalErrors: 0,
            trends: {
                hourly: {},
                daily: {}
            }
        };

        errors.forEach(error => {
            // Count by error type
            const errorType = error.errorCode || error.name;
            summary.errorsByType[errorType] = (summary.errorsByType[errorType] || 0) + 1;

            // Count by operation
            const operation = error.context?.operation || 'unknown';
            summary.errorsByOperation[operation] = (summary.errorsByOperation[operation] || 0) + 1;

            // Count critical errors
            if (error.severity === 'critical' || error.statusCode >= 500) {
                summary.criticalErrors++;
            }

            // Track trends
            const errorDate = new Date(error.timestamp);
            const hour = errorDate.getHours();
            const day = errorDate.toDateString();
            
            summary.trends.hourly[hour] = (summary.trends.hourly[hour] || 0) + 1;
            summary.trends.daily[day] = (summary.trends.daily[day] || 0) + 1;
        });

        return summary;
    }
}

module.exports = AttendanceErrorHandler;