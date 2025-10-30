/**
 * Attendance Error Monitoring Controller
 * Provides endpoints for monitoring attendance system errors and performance
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const { AuthorizationError, ValidationError } = require('../utils/errors');
const attendanceErrorMonitoringService = require('../services/AttendanceErrorMonitoringService');
const logger = require('../utils/logger');

/**
 * Get attendance error analytics dashboard data
 */
const getAttendanceErrorAnalytics = asyncHandler(async (req, res) => {
    // Check if user is admin or teacher
    if (!['Admin', 'Teacher'].includes(req.user.role)) {
        throw new AuthorizationError('Only administrators and teachers can view attendance error analytics', {
            requiredRole: ['Admin', 'Teacher'],
            userRole: req.user.role,
            action: 'view_attendance_error_analytics'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 24 * 60 * 60 * 1000, // 24 hours default
        operation: req.query.operation || null
    };

    logger.security('attendance_error_analytics_accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange: options.timeRange,
        operation: options.operation
    });

    const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics(options);

    res.status(200).json({
        success: true,
        data: analytics,
        message: 'Attendance error analytics retrieved successfully'
    });
});

/**
 * Get attendance system health status
 */
const getAttendanceHealthStatus = asyncHandler(async (req, res) => {
    // Check if user is admin or teacher
    if (!['Admin', 'Teacher'].includes(req.user.role)) {
        throw new AuthorizationError('Only administrators and teachers can view attendance health status', {
            requiredRole: ['Admin', 'Teacher'],
            userRole: req.user.role,
            action: 'view_attendance_health'
        });
    }

    const healthStatus = attendanceErrorMonitoringService.getAttendanceHealthStatus();

    logger.info('Attendance health status accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        healthStatus: healthStatus.status
    });

    res.status(200).json({
        success: true,
        data: healthStatus,
        message: 'Attendance health status retrieved successfully'
    });
});

/**
 * Get attendance operation performance metrics
 */
const getAttendancePerformanceMetrics = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view detailed performance metrics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_attendance_performance'
        });
    }

    const { operation } = req.query;
    const metrics = attendanceErrorMonitoringService.attendanceMetrics;

    let responseData = {
        operationCounts: metrics.operationCounts,
        performanceMetrics: metrics.performanceMetrics,
        userImpact: metrics.userImpact
    };

    // Filter by operation if specified
    if (operation && metrics.operationCounts[operation]) {
        responseData = {
            operationCounts: { [operation]: metrics.operationCounts[operation] },
            performanceMetrics: { [operation]: metrics.performanceMetrics[operation] },
            userImpact: metrics.userImpact
        };
    }

    logger.info('Attendance performance metrics accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        operation
    });

    res.status(200).json({
        success: true,
        data: responseData,
        message: 'Attendance performance metrics retrieved successfully'
    });
});

/**
 * Get attendance error trends and patterns
 */
const getAttendanceErrorTrends = asyncHandler(async (req, res) => {
    // Check if user is admin or teacher
    if (!['Admin', 'Teacher'].includes(req.user.role)) {
        throw new AuthorizationError('Only administrators and teachers can view error trends', {
            requiredRole: ['Admin', 'Teacher'],
            userRole: req.user.role,
            action: 'view_attendance_error_trends'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 7 * 24 * 60 * 60 * 1000, // 7 days default
        operation: req.query.operation || null
    };

    const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics(options);
    
    const trends = {
        errorTrends: analytics.trends,
        topErrors: analytics.topErrors,
        operationBreakdown: analytics.errorsByOperation,
        severityDistribution: analytics.errorsBySeverity,
        recommendations: analytics.recommendations
    };

    res.status(200).json({
        success: true,
        data: trends,
        message: 'Attendance error trends retrieved successfully'
    });
});

/**
 * Get attendance error impact analysis
 */
const getAttendanceErrorImpact = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view error impact analysis', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_attendance_error_impact'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 24 * 60 * 60 * 1000, // 24 hours default
    };

    const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics(options);
    
    const impactAnalysis = {
        summary: analytics.summary,
        impactAnalysis: analytics.impactAnalysis,
        userRoleBreakdown: analytics.errorsByUserRole,
        businessImpact: {
            affectedOperations: analytics.summary.operations,
            totalErrors: analytics.summary.totalErrors,
            criticalIssues: analytics.errorsBySeverity.critical,
            recommendations: analytics.recommendations
        }
    };

    logger.security('attendance_error_impact_accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange: options.timeRange
    });

    res.status(200).json({
        success: true,
        data: impactAnalysis,
        message: 'Attendance error impact analysis retrieved successfully'
    });
});

/**
 * Trigger manual cleanup of attendance error data
 */
const triggerAttendanceCleanup = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can trigger cleanup', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'trigger_attendance_cleanup'
        });
    }

    logger.security('attendance_manual_cleanup_triggered', {
        userId: req.user.id,
        userRole: req.user.role,
        timestamp: new Date()
    });

    attendanceErrorMonitoringService.cleanup();

    res.status(200).json({
        success: true,
        message: 'Attendance error monitoring cleanup completed successfully'
    });
});

/**
 * Update attendance alert thresholds
 */
const updateAttendanceAlertThresholds = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can update alert thresholds', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'update_attendance_alert_thresholds'
        });
    }

    const { 
        markingFailureRate, 
        bulkOperationFailureRate, 
        consecutiveFailures, 
        responseTimeThreshold 
    } = req.body;

    // Validate thresholds
    if (markingFailureRate !== undefined && (markingFailureRate < 0 || markingFailureRate > 1)) {
        throw new ValidationError('Marking failure rate must be between 0 and 1', {
            field: 'markingFailureRate',
            value: markingFailureRate,
            validRange: '0-1'
        });
    }

    if (bulkOperationFailureRate !== undefined && (bulkOperationFailureRate < 0 || bulkOperationFailureRate > 1)) {
        throw new ValidationError('Bulk operation failure rate must be between 0 and 1', {
            field: 'bulkOperationFailureRate',
            value: bulkOperationFailureRate,
            validRange: '0-1'
        });
    }

    if (consecutiveFailures !== undefined && consecutiveFailures < 1) {
        throw new ValidationError('Consecutive failures threshold must be at least 1', {
            field: 'consecutiveFailures',
            value: consecutiveFailures,
            minimum: 1
        });
    }

    if (responseTimeThreshold !== undefined && responseTimeThreshold < 1000) {
        throw new ValidationError('Response time threshold must be at least 1000ms', {
            field: 'responseTimeThreshold',
            value: responseTimeThreshold,
            minimum: 1000
        });
    }

    // Update thresholds
    const oldThresholds = { ...attendanceErrorMonitoringService.alertThresholds };
    
    if (markingFailureRate !== undefined) {
        attendanceErrorMonitoringService.alertThresholds.markingFailureRate = markingFailureRate;
    }
    if (bulkOperationFailureRate !== undefined) {
        attendanceErrorMonitoringService.alertThresholds.bulkOperationFailureRate = bulkOperationFailureRate;
    }
    if (consecutiveFailures !== undefined) {
        attendanceErrorMonitoringService.alertThresholds.consecutiveFailures = consecutiveFailures;
    }
    if (responseTimeThreshold !== undefined) {
        attendanceErrorMonitoringService.alertThresholds.responseTimeThreshold = responseTimeThreshold;
    }

    logger.security('attendance_alert_thresholds_updated', {
        userId: req.user.id,
        userRole: req.user.role,
        oldThresholds,
        newThresholds: attendanceErrorMonitoringService.alertThresholds
    });

    res.status(200).json({
        success: true,
        data: attendanceErrorMonitoringService.alertThresholds,
        message: 'Attendance alert thresholds updated successfully'
    });
});

/**
 * Get attendance monitoring configuration
 */
const getAttendanceMonitoringConfig = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view monitoring configuration', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_attendance_monitoring_config'
        });
    }

    const config = {
        alertThresholds: attendanceErrorMonitoringService.alertThresholds,
        maxStoredErrors: attendanceErrorMonitoringService.maxStoredErrors,
        currentStats: {
            attendanceErrorsCount: attendanceErrorMonitoringService.attendanceErrors.length,
            operationTypes: Object.keys(attendanceErrorMonitoringService.attendanceMetrics.operationCounts)
        }
    };

    res.status(200).json({
        success: true,
        data: config,
        message: 'Attendance monitoring configuration retrieved successfully'
    });
});

/**
 * Export attendance error data for external analysis
 */
const exportAttendanceErrorData = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can export attendance error data', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'export_attendance_error_data'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 7 * 24 * 60 * 60 * 1000, // 7 days default
        format: req.query.format || 'json', // json, csv
        operation: req.query.operation || null
    };

    if (!['json', 'csv'].includes(options.format)) {
        throw new ValidationError('Invalid export format', {
            field: 'format',
            value: options.format,
            validValues: ['json', 'csv']
        });
    }

    logger.security('attendance_error_data_exported', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange: options.timeRange,
        format: options.format,
        operation: options.operation
    });

    const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics(options);

    if (options.format === 'csv') {
        // Convert to CSV format
        const csvData = convertAttendanceAnalyticsToCSV(analytics);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-error-analytics.csv');
        res.send(csvData);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-error-analytics.json');
        res.json({
            success: true,
            data: analytics,
            exportedAt: new Date(),
            exportedBy: req.user.id,
            options
        });
    }
});

/**
 * Convert attendance analytics data to CSV format
 * @param {Object} analytics - Analytics data
 * @returns {string} CSV formatted data
 */
function convertAttendanceAnalyticsToCSV(analytics) {
    const rows = [];
    
    // Header
    rows.push('Operation,Error Count,Error Rate,Average Response Time,Status');
    
    // Operation health data
    Object.entries(analytics.errorsByOperation).forEach(([operation, data]) => {
        const errorRate = data.count || 0;
        rows.push(`${operation},${data.count},${errorRate}%,N/A,${errorRate > 10 ? 'Warning' : 'Healthy'}`);
    });
    
    return rows.join('\n');
}

module.exports = {
    getAttendanceErrorAnalytics,
    getAttendanceHealthStatus,
    getAttendancePerformanceMetrics,
    getAttendanceErrorTrends,
    getAttendanceErrorImpact,
    triggerAttendanceCleanup,
    updateAttendanceAlertThresholds,
    getAttendanceMonitoringConfig,
    exportAttendanceErrorData
};