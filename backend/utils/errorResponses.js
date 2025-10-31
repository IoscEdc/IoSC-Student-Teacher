/**
 * User-friendly error messages and recovery suggestions
 * Provides helpful guidance for different error scenarios
 */

const errorMessages = {
    // Authentication & Authorization
    AUTHENTICATION_ERROR: {
        message: 'Please log in to access this feature',
        userMessage: 'You need to be logged in to perform this action.',
        suggestions: [
            'Please log in with your credentials',
            'If you were logged in, your session may have expired',
            'Contact support if you continue having login issues'
        ]
    },

    AUTHORIZATION_ERROR: {
        message: 'You do not have permission to perform this action',
        userMessage: 'Access denied. You don\'t have the required permissions.',
        suggestions: [
            'Contact your administrator to request access',
            'Ensure you are logged in with the correct account',
            'Check if your role has the necessary permissions'
        ]
    },

    TOKEN_EXPIRED: {
        message: 'Your session has expired',
        userMessage: 'Your login session has expired. Please log in again.',
        suggestions: [
            'Click the login button to sign in again',
            'Your data has been saved and will be available after login'
        ]
    },

    INVALID_TOKEN: {
        message: 'Invalid authentication token',
        userMessage: 'There was an issue with your login. Please sign in again.',
        suggestions: [
            'Log out and log back in',
            'Clear your browser cache and cookies',
            'Contact support if the problem persists'
        ]
    },

    // Attendance-specific errors
    ATTENDANCE_UNAUTHORIZED: {
        message: 'You are not authorized to mark attendance for this class/subject',
        userMessage: 'You cannot mark attendance for this class or subject.',
        suggestions: [
            'Verify you are assigned to teach this class and subject',
            'Contact your administrator to update your teaching assignments',
            'Check if you selected the correct class and subject'
        ]
    },

    ATTENDANCE_ALREADY_MARKED: {
        message: 'Attendance has already been marked for this session',
        userMessage: 'Attendance for this class session has already been recorded.',
        suggestions: [
            'Use the "Edit Attendance" feature to make changes',
            'Check the attendance history to view existing records',
            'Contact administration if you need to override existing attendance'
        ]
    },

    STUDENT_NOT_ENROLLED: {
        message: 'Student is not enrolled in this class',
        userMessage: 'This student is not enrolled in the selected class.',
        suggestions: [
            'Verify the student is in the correct class',
            'Contact administration to update student enrollment',
            'Check if the student has been transferred to another class'
        ]
    },

    INVALID_SESSION: {
        message: 'Invalid session specified',
        userMessage: 'The session you selected is not valid for this class.',
        suggestions: [
            'Select a valid session from the dropdown',
            'Check the class schedule for available sessions',
            'Contact administration if sessions are missing'
        ]
    },

    EDIT_WINDOW_EXPIRED: {
        message: 'Attendance edit window has expired',
        userMessage: 'You can no longer edit this attendance record.',
        suggestions: [
            'Attendance can only be edited within 24 hours of marking',
            'Contact your administrator for special permission to edit',
            'Use the comment feature to note any corrections needed'
        ]
    },

    // Validation errors
    VALIDATION_ERROR: {
        message: 'The information provided is not valid',
        userMessage: 'Please check the information you entered and try again.',
        suggestions: [
            'Ensure all required fields are filled out',
            'Check that dates are in the correct format',
            'Verify that all selections are valid'
        ]
    },

    INVALID_ID: {
        message: 'Invalid ID provided',
        userMessage: 'The ID you provided is not valid.',
        suggestions: [
            'Check that you copied the ID correctly',
            'Ensure the resource you\'re looking for exists',
            'Try refreshing the page and selecting the item again'
        ]
    },

    DUPLICATE_FIELD: {
        message: 'This value already exists',
        userMessage: 'The information you entered already exists in the system.',
        suggestions: [
            'Use a different value for this field',
            'Check if the record already exists',
            'Contact support if you believe this is an error'
        ]
    },

    // Database and system errors
    DATABASE_ERROR: {
        message: 'Database operation failed',
        userMessage: 'We\'re experiencing technical difficulties. Please try again.',
        suggestions: [
            'Wait a moment and try your request again',
            'Check your internet connection',
            'Contact support if the problem continues'
        ]
    },

    OPERATION_TIMEOUT: {
        message: 'Operation took too long to complete',
        userMessage: 'The request is taking longer than expected.',
        suggestions: [
            'Try again with a smaller amount of data',
            'Check your internet connection',
            'Contact support if timeouts persist'
        ]
    },

    RATE_LIMIT_ERROR: {
        message: 'Too many requests',
        userMessage: 'You\'re making requests too quickly. Please slow down.',
        suggestions: [
            'Wait a few minutes before trying again',
            'Avoid clicking buttons multiple times',
            'Contact support if you need higher rate limits'
        ]
    },

    // Generic errors
    NOT_FOUND_ERROR: {
        message: 'The requested resource was not found',
        userMessage: 'We couldn\'t find what you\'re looking for.',
        suggestions: [
            'Check that the URL is correct',
            'The item may have been deleted or moved',
            'Try searching for the item again'
        ]
    },

    INTERNAL_SERVER_ERROR: {
        message: 'An unexpected error occurred',
        userMessage: 'Something went wrong on our end. We\'re working to fix it.',
        suggestions: [
            'Try refreshing the page',
            'Wait a few minutes and try again',
            'Contact support if the problem persists'
        ]
    },

    EXTERNAL_SERVICE_ERROR: {
        message: 'External service is unavailable',
        userMessage: 'A service we depend on is currently unavailable.',
        suggestions: [
            'Try again in a few minutes',
            'Some features may be temporarily limited',
            'Contact support if the issue continues'
        ]
    }
};

/**
 * Get user-friendly error response
 * @param {string} errorCode - The error code
 * @param {Object} details - Additional error details
 * @returns {Object} User-friendly error response
 */
function getUserFriendlyError(errorCode, details = {}) {
    const errorInfo = errorMessages[errorCode] || errorMessages.INTERNAL_SERVER_ERROR;
    
    return {
        message: errorInfo.userMessage,
        suggestions: errorInfo.suggestions,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        supportContact: {
            email: process.env.SUPPORT_EMAIL || 'support@school.edu',
            phone: process.env.SUPPORT_PHONE || 'Contact your administrator'
        }
    };
}

/**
 * Get recovery actions for specific error types
 * @param {string} errorCode - The error code
 * @param {Object} context - Context information (user role, current action, etc.)
 * @returns {Array} Array of recovery actions
 */
function getRecoveryActions(errorCode, context = {}) {
    const actions = [];

    switch (errorCode) {
        case 'ATTENDANCE_UNAUTHORIZED':
            actions.push({
                type: 'navigate',
                label: 'View My Classes',
                action: '/teacher/classes'
            });
            actions.push({
                type: 'contact',
                label: 'Request Access',
                action: 'mailto:admin@school.edu?subject=Access Request'
            });
            break;

        case 'ATTENDANCE_ALREADY_MARKED':
            actions.push({
                type: 'navigate',
                label: 'Edit Attendance',
                action: `/attendance/edit/${context.classId}/${context.subjectId}`
            });
            actions.push({
                type: 'navigate',
                label: 'View History',
                action: `/attendance/history/${context.classId}/${context.subjectId}`
            });
            break;

        case 'AUTHENTICATION_ERROR':
        case 'TOKEN_EXPIRED':
            actions.push({
                type: 'navigate',
                label: 'Login',
                action: '/login'
            });
            break;

        case 'VALIDATION_ERROR':
            actions.push({
                type: 'retry',
                label: 'Try Again',
                action: 'retry'
            });
            break;

        case 'DATABASE_ERROR':
        case 'INTERNAL_SERVER_ERROR':
            actions.push({
                type: 'retry',
                label: 'Retry',
                action: 'retry'
            });
            actions.push({
                type: 'navigate',
                label: 'Go Home',
                action: '/'
            });
            break;

        default:
            actions.push({
                type: 'retry',
                label: 'Try Again',
                action: 'retry'
            });
    }

    return actions;
}

/**
 * Format error for API response
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, req = {}) {
    const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
    const userFriendlyError = getUserFriendlyError(errorCode, error.details);
    const recoveryActions = getRecoveryActions(errorCode, {
        userRole: req.user?.role,
        currentPath: req.path,
        ...error.details
    });

    return {
        success: false,
        error: {
            code: errorCode,
            message: userFriendlyError.message,
            suggestions: userFriendlyError.suggestions,
            recoveryActions,
            support: userFriendlyError.supportContact,
            timestamp: new Date().toISOString(),
            requestId: req.id || generateRequestId()
        }
    };
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get contextual help based on user role and current action
 * @param {string} userRole - User's role (Admin, Teacher, Student)
 * @param {string} action - Current action being performed
 * @returns {Object} Contextual help information
 */
function getContextualHelp(userRole, action) {
    const helpContent = {
        Teacher: {
            'mark-attendance': {
                title: 'Marking Attendance',
                tips: [
                    'Select the correct class and subject before marking attendance',
                    'Choose the appropriate session (Lecture 1, Lecture 2, etc.)',
                    'You can mark students as Present, Absent, Late, or Excused',
                    'Save your changes before navigating away'
                ]
            },
            'edit-attendance': {
                title: 'Editing Attendance',
                tips: [
                    'You can only edit attendance within 24 hours of marking',
                    'Changes will be logged for audit purposes',
                    'Contact administration for edits beyond the time limit'
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
                ]
            }
        },
        Admin: {
            'manage-attendance': {
                title: 'Managing Attendance System',
                tips: [
                    'Monitor attendance patterns across all classes',
                    'Use bulk operations for efficient management',
                    'Review audit logs for attendance changes'
                ]
            }
        }
    };

    return helpContent[userRole]?.[action] || {
        title: 'Help',
        tips: ['Contact support if you need assistance']
    };
}

module.exports = {
    errorMessages,
    getUserFriendlyError,
    getRecoveryActions,
    formatErrorResponse,
    getContextualHelp,
    generateRequestId
};