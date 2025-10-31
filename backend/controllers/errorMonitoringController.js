/**
 * Error Monitoring Controller
 * Provides endpoints for administrators to monitor system errors and health
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const { AuthorizationError, ValidationError } = require('../utils/errors');
const errorMonitoringService = require('../services/ErrorMonitoringService');
const logger = require('../utils/logger');

/**
 * Get error analytics dashboard data
 */
const getErrorAnalytics = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view error analytics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_error_analytics'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 24 * 60 * 60 * 1000, // 24 hours default
        includeDetails: req.query.includeDetails === 'true'
    };

    logger.security('error_analytics_accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange: options.timeRange,
        includeDetails: options.includeDetails
    });

    const analytics = errorMonitoringService.getErrorAnalytics(options);

    res.status(200).json({
        success: true,
        data: analytics,
        message: 'Error analytics retrieved successfully'
    });
});

/**
 * Get system health status
 */
const getHealthStatus = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view system health', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_system_health'
        });
    }

    const healthStatus = errorMonitoringService.getHealthStatus();

    logger.info('System health status accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        healthStatus: healthStatus.status
    });

    res.status(200).json({
        success: true,
        data: healthStatus,
        message: 'System health status retrieved successfully'
    });
});

/**
 * Get error statistics for a specific error type
 */
const getErrorStats = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view error statistics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_error_stats'
        });
    }

    const { errorName, errorCode } = req.params;

    if (!errorName || !errorCode) {
        throw new ValidationError('Error name and code are required', {
            missingFields: [
                !errorName ? 'errorName' : null,
                !errorCode ? 'errorCode' : null
            ].filter(Boolean)
        });
    }

    const stats = errorMonitoringService.getErrorStats(errorName, errorCode);

    if (!stats) {
        return res.status(404).json({
            success: false,
            message: 'No statistics found for the specified error type'
        });
    }

    logger.info('Error statistics accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        errorName,
        errorCode
    });

    res.status(200).json({
        success: true,
        data: stats,
        message: 'Error statistics retrieved successfully'
    });
});

/**
 * Trigger manual cleanup of error monitoring data
 */
const triggerCleanup = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can trigger cleanup', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'trigger_cleanup'
        });
    }

    logger.security('manual_cleanup_triggered', {
        userId: req.user.id,
        userRole: req.user.role,
        timestamp: new Date()
    });

    errorMonitoringService.cleanup();

    res.status(200).json({
        success: true,
        message: 'Error monitoring cleanup completed successfully'
    });
});

/**
 * Update alert thresholds
 */
const updateAlertThresholds = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can update alert thresholds', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'update_alert_thresholds'
        });
    }

    const { errorRate, criticalErrors, timeWindow } = req.body;

    // Validate thresholds
    if (errorRate !== undefined && (errorRate < 0 || errorRate > 1)) {
        throw new ValidationError('Error rate must be between 0 and 1', {
            field: 'errorRate',
            value: errorRate,
            validRange: '0-1'
        });
    }

    if (criticalErrors !== undefined && criticalErrors < 1) {
        throw new ValidationError('Critical errors threshold must be at least 1', {
            field: 'criticalErrors',
            value: criticalErrors,
            minimum: 1
        });
    }

    if (timeWindow !== undefined && timeWindow < 60000) { // 1 minute minimum
        throw new ValidationError('Time window must be at least 60000ms (1 minute)', {
            field: 'timeWindow',
            value: timeWindow,
            minimum: 60000
        });
    }

    // Update thresholds
    const oldThresholds = { ...errorMonitoringService.alertThresholds };
    
    if (errorRate !== undefined) {
        errorMonitoringService.alertThresholds.errorRate = errorRate;
    }
    if (criticalErrors !== undefined) {
        errorMonitoringService.alertThresholds.criticalErrors = criticalErrors;
    }
    if (timeWindow !== undefined) {
        errorMonitoringService.alertThresholds.timeWindow = timeWindow;
    }

    logger.security('alert_thresholds_updated', {
        userId: req.user.id,
        userRole: req.user.role,
        oldThresholds,
        newThresholds: errorMonitoringService.alertThresholds
    });

    res.status(200).json({
        success: true,
        data: errorMonitoringService.alertThresholds,
        message: 'Alert thresholds updated successfully'
    });
});

/**
 * Get error monitoring configuration
 */
const getConfiguration = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view monitoring configuration', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_monitoring_config'
        });
    }

    const config = {
        alertThresholds: errorMonitoringService.alertThresholds,
        maxRecentErrors: errorMonitoringService.maxRecentErrors,
        currentStats: {
            recentErrorsCount: errorMonitoringService.recentErrors.length,
            errorStatsCount: errorMonitoringService.errorStats.size
        }
    };

    res.status(200).json({
        success: true,
        data: config,
        message: 'Error monitoring configuration retrieved successfully'
    });
});

/**
 * Export error data for external analysis
 */
const exportErrorData = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can export error data', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'export_error_data'
        });
    }

    const options = {
        timeRange: req.query.timeRange ? parseInt(req.query.timeRange) : 24 * 60 * 60 * 1000,
        format: req.query.format || 'json', // json, csv
        includeDetails: req.query.includeDetails === 'true'
    };

    if (!['json', 'csv'].includes(options.format)) {
        throw new ValidationError('Invalid export format', {
            field: 'format',
            value: options.format,
            validValues: ['json', 'csv']
        });
    }

    logger.security('error_data_exported', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange: options.timeRange,
        format: options.format,
        includeDetails: options.includeDetails
    });

    const analytics = errorMonitoringService.getErrorAnalytics(options);

    if (options.format === 'csv') {
        // Convert to CSV format
        const csvData = convertToCSV(analytics);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=error-analytics.csv');
        res.send(csvData);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=error-analytics.json');
        res.json({
            success: true,
            data: analytics,
            exportedAt: new Date(),
            exportedBy: req.user.id
        });
    }
});

/**
 * Convert analytics data to CSV format
 * @param {Object} analytics - Analytics data
 * @returns {string} CSV formatted data
 */
function convertToCSV(analytics) {
    const rows = [];
    
    // Header
    rows.push('Error Type,Error Code,Count,Severity,Last Occurrence');
    
    // Top errors data
    analytics.topErrors.forEach(error => {
        rows.push(`${error.name},${error.code},${error.count},${error.severity},${error.lastOccurrence}`);
    });
    
    return rows.join('\n');
}

module.exports = {
    getErrorAnalytics,
    getHealthStatus,
    getErrorStats,
    triggerCleanup,
    updateAlertThresholds,
    getConfiguration,
    exportErrorData
};