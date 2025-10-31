/**
 * Attendance Error Monitoring Service
 * Specialized monitoring for attendance system errors and performance
 */

const logger = require('../utils/logger');
const errorMonitoringService = require('./ErrorMonitoringService');
const AttendanceErrorHandler = require('../utils/attendanceErrorHandler');

class AttendanceErrorMonitoringService {
    constructor() {
        this.attendanceErrors = [];
        this.attendanceMetrics = {
            operationCounts: {},
            errorRates: {},
            performanceMetrics: {},
            userImpact: {}
        };
        this.alertThresholds = {
            markingFailureRate: 0.05, // 5% failure rate for marking operations
            bulkOperationFailureRate: 0.1, // 10% failure rate for bulk operations
            consecutiveFailures: 3, // 3 consecutive failures for same operation
            responseTimeThreshold: 5000 // 5 seconds
        };
        this.maxStoredErrors = 500;
    }

    /**
     * Track attendance-specific error
     * @param {Error} error - The error that occurred
     * @param {Object} context - Attendance operation context
     */
    trackAttendanceError(error, context = {}) {
        const attendanceError = {
            timestamp: new Date(),
            error: {
                name: error.name,
                message: error.message,
                code: error.errorCode || error.code,
                statusCode: error.statusCode,
                stack: error.stack
            },
            context: {
                operation: context.operation || 'unknown',
                userRole: context.userRole,
                userId: context.userId,
                classId: context.classId,
                subjectId: context.subjectId,
                teacherId: context.teacherId,
                studentId: context.studentId,
                sessionInfo: {
                    date: context.date,
                    session: context.session
                },
                bulkInfo: context.totalRecords ? {
                    totalRecords: context.totalRecords,
                    successCount: context.successCount,
                    failureCount: context.failureCount
                } : null
            },
            severity: this.determineSeverity(error, context),
            impact: this.assessUserImpact(error, context)
        };

        // Store the error
        this.attendanceErrors.unshift(attendanceError);
        if (this.attendanceErrors.length > this.maxStoredErrors) {
            this.attendanceErrors.pop();
        }

        // Update metrics
        this.updateAttendanceMetrics(attendanceError);

        // Check for alert conditions
        this.checkAttendanceAlerts(attendanceError);

        // Log the error
        logger.attendance('error_tracked', {
            error: attendanceError.error,
            context: attendanceError.context,
            severity: attendanceError.severity,
            impact: attendanceError.impact
        });

        // Also track in general error monitoring
        errorMonitoringService.trackError(error, {
            ...context,
            category: 'attendance',
            subcategory: context.operation
        });
    }

    /**
     * Determine severity level for attendance errors
     * @param {Error} error - The error object
     * @param {Object} context - Error context
     * @returns {string} Severity level
     */
    determineSeverity(error, context) {
        // Critical: System-wide failures or bulk operation failures
        if (error.statusCode >= 500 || 
            (context.operation === 'bulk' && context.failureCount > context.successCount)) {
            return 'critical';
        }

        // High: Authorization failures or data integrity issues
        if (error.name === 'AttendanceAuthorizationError' || 
            error.name === 'AttendanceAlreadyMarkedError' ||
            error.statusCode === 403) {
            return 'high';
        }

        // Medium: Validation errors or not found errors
        if (error.name === 'ValidationError' || 
            error.name === 'NotFoundError' ||
            error.statusCode === 404 || error.statusCode === 400) {
            return 'medium';
        }

        // Low: Client errors or minor issues
        return 'low';
    }

    /**
     * Assess user impact of the error
     * @param {Error} error - The error object
     * @param {Object} context - Error context
     * @returns {Object} Impact assessment
     */
    assessUserImpact(error, context) {
        const impact = {
            level: 'low',
            affectedUsers: 1,
            affectedOperations: [context.operation],
            businessImpact: 'minimal'
        };

        // High impact for bulk operations or system errors
        if (context.operation === 'bulk' || error.statusCode >= 500) {
            impact.level = 'high';
            impact.affectedUsers = context.totalRecords || 10;
            impact.businessImpact = 'significant';
        }

        // Medium impact for authorization or marking errors
        if (error.name === 'AttendanceAuthorizationError' || 
            context.operation === 'marking') {
            impact.level = 'medium';
            impact.businessImpact = 'moderate';
        }

        return impact;
    }

    /**
     * Update attendance-specific metrics
     * @param {Object} attendanceError - The attendance error object
     */
    updateAttendanceMetrics(attendanceError) {
        const operation = attendanceError.context.operation;
        const now = new Date();
        const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

        // Update operation counts
        if (!this.attendanceMetrics.operationCounts[operation]) {
            this.attendanceMetrics.operationCounts[operation] = { total: 0, errors: 0 };
        }
        this.attendanceMetrics.operationCounts[operation].errors++;

        // Update error rates by hour
        if (!this.attendanceMetrics.errorRates[hourKey]) {
            this.attendanceMetrics.errorRates[hourKey] = {};
        }
        if (!this.attendanceMetrics.errorRates[hourKey][operation]) {
            this.attendanceMetrics.errorRates[hourKey][operation] = 0;
        }
        this.attendanceMetrics.errorRates[hourKey][operation]++;

        // Update user impact metrics
        const userRole = attendanceError.context.userRole;
        if (!this.attendanceMetrics.userImpact[userRole]) {
            this.attendanceMetrics.userImpact[userRole] = { errorCount: 0, operations: {} };
        }
        this.attendanceMetrics.userImpact[userRole].errorCount++;
        if (!this.attendanceMetrics.userImpact[userRole].operations[operation]) {
            this.attendanceMetrics.userImpact[userRole].operations[operation] = 0;
        }
        this.attendanceMetrics.userImpact[userRole].operations[operation]++;
    }

    /**
     * Check for attendance-specific alert conditions
     * @param {Object} attendanceError - The attendance error object
     */
    checkAttendanceAlerts(attendanceError) {
        const operation = attendanceError.context.operation;
        const now = new Date();
        const recentWindow = 15 * 60 * 1000; // 15 minutes

        // Get recent errors for this operation
        const recentErrors = this.attendanceErrors.filter(e => 
            e.context.operation === operation &&
            (now - e.timestamp) <= recentWindow
        );

        // Check for consecutive failures
        if (recentErrors.length >= this.alertThresholds.consecutiveFailures) {
            this.sendAttendanceAlert('consecutive_failures', {
                operation,
                failureCount: recentErrors.length,
                timeWindow: recentWindow / 1000 / 60,
                errors: recentErrors.slice(0, 3)
            });
        }

        // Check operation-specific failure rates
        const operationMetrics = this.attendanceMetrics.operationCounts[operation];
        if (operationMetrics && operationMetrics.total > 10) {
            const failureRate = operationMetrics.errors / operationMetrics.total;
            const threshold = operation === 'bulk' ? 
                this.alertThresholds.bulkOperationFailureRate : 
                this.alertThresholds.markingFailureRate;

            if (failureRate > threshold) {
                this.sendAttendanceAlert('high_failure_rate', {
                    operation,
                    failureRate: (failureRate * 100).toFixed(2),
                    threshold: (threshold * 100).toFixed(2),
                    totalOperations: operationMetrics.total,
                    totalErrors: operationMetrics.errors
                });
            }
        }
    }

    /**
     * Send attendance-specific alert
     * @param {string} alertType - Type of alert
     * @param {Object} data - Alert data
     */
    sendAttendanceAlert(alertType, data) {
        const alert = {
            type: `attendance_${alertType}`,
            timestamp: new Date(),
            data,
            severity: 'high',
            category: 'attendance'
        };

        logger.error(`ATTENDANCE ALERT: ${alertType}`, alert);

        // Send notification (would integrate with notification systems)
        this.notifyAttendanceAdministrators(alert);
    }

    /**
     * Notify administrators of attendance issues
     * @param {Object} alert - Alert information
     */
    notifyAttendanceAdministrators(alert) {
        logger.security('attendance_administrator_alert', {
            alert,
            notificationSent: true,
            recipients: ['admin@school.edu', 'attendance-admin@school.edu']
        });

        // In production, this would integrate with:
        // - Email notifications to attendance administrators
        // - Slack/Teams webhooks for immediate alerts
        // - Dashboard notifications
        // - SMS for critical issues
    }

    /**
     * Record successful attendance operation for metrics
     * @param {string} operation - Operation type
     * @param {Object} context - Operation context
     * @param {number} responseTime - Response time in milliseconds
     */
    recordSuccessfulOperation(operation, context = {}, responseTime = 0) {
        // Update operation counts
        if (!this.attendanceMetrics.operationCounts[operation]) {
            this.attendanceMetrics.operationCounts[operation] = { total: 0, errors: 0 };
        }
        this.attendanceMetrics.operationCounts[operation].total++;

        // Update performance metrics
        if (!this.attendanceMetrics.performanceMetrics[operation]) {
            this.attendanceMetrics.performanceMetrics[operation] = {
                totalTime: 0,
                operationCount: 0,
                averageTime: 0,
                maxTime: 0
            };
        }

        const perfMetrics = this.attendanceMetrics.performanceMetrics[operation];
        perfMetrics.totalTime += responseTime;
        perfMetrics.operationCount++;
        perfMetrics.averageTime = perfMetrics.totalTime / perfMetrics.operationCount;
        perfMetrics.maxTime = Math.max(perfMetrics.maxTime, responseTime);

        // Check for performance alerts
        if (responseTime > this.alertThresholds.responseTimeThreshold) {
            this.sendAttendanceAlert('slow_response', {
                operation,
                responseTime,
                threshold: this.alertThresholds.responseTimeThreshold,
                context
            });
        }

        logger.attendance('operation_success', {
            operation,
            responseTime,
            context
        });
    }

    /**
     * Get attendance error analytics
     * @param {Object} options - Analytics options
     * @returns {Object} Attendance error analytics
     */
    getAttendanceErrorAnalytics(options = {}) {
        const {
            timeRange = 24 * 60 * 60 * 1000, // 24 hours
            operation = null
        } = options;

        const now = new Date();
        const cutoffTime = new Date(now - timeRange);

        let filteredErrors = this.attendanceErrors.filter(e => e.timestamp >= cutoffTime);
        
        if (operation) {
            filteredErrors = filteredErrors.filter(e => e.context.operation === operation);
        }

        const analytics = {
            summary: {
                totalErrors: filteredErrors.length,
                timeRange: timeRange / 1000 / 60 / 60, // hours
                operations: [...new Set(filteredErrors.map(e => e.context.operation))]
            },
            errorsByOperation: this.groupErrorsByOperation(filteredErrors),
            errorsBySeverity: this.groupErrorsBySeverity(filteredErrors),
            errorsByUserRole: this.groupErrorsByUserRole(filteredErrors),
            impactAnalysis: this.analyzeErrorImpact(filteredErrors),
            trends: this.getAttendanceErrorTrends(filteredErrors),
            topErrors: this.getTopAttendanceErrors(filteredErrors),
            recommendations: this.generateRecommendations(filteredErrors)
        };

        return analytics;
    }

    /**
     * Group errors by operation type
     * @param {Array} errors - Array of error objects
     * @returns {Object} Errors grouped by operation
     */
    groupErrorsByOperation(errors) {
        const grouped = {};
        errors.forEach(error => {
            const operation = error.context.operation;
            if (!grouped[operation]) {
                grouped[operation] = { count: 0, errors: [] };
            }
            grouped[operation].count++;
            grouped[operation].errors.push(error);
        });
        return grouped;
    }

    /**
     * Group errors by severity level
     * @param {Array} errors - Array of error objects
     * @returns {Object} Errors grouped by severity
     */
    groupErrorsBySeverity(errors) {
        const grouped = { critical: 0, high: 0, medium: 0, low: 0 };
        errors.forEach(error => {
            grouped[error.severity]++;
        });
        return grouped;
    }

    /**
     * Group errors by user role
     * @param {Array} errors - Array of error objects
     * @returns {Object} Errors grouped by user role
     */
    groupErrorsByUserRole(errors) {
        const grouped = {};
        errors.forEach(error => {
            const role = error.context.userRole || 'unknown';
            grouped[role] = (grouped[role] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Analyze error impact
     * @param {Array} errors - Array of error objects
     * @returns {Object} Impact analysis
     */
    analyzeErrorImpact(errors) {
        const impact = {
            totalAffectedUsers: 0,
            highImpactErrors: 0,
            businessImpact: { minimal: 0, moderate: 0, significant: 0 }
        };

        errors.forEach(error => {
            impact.totalAffectedUsers += error.impact.affectedUsers;
            if (error.impact.level === 'high') {
                impact.highImpactErrors++;
            }
            impact.businessImpact[error.impact.businessImpact]++;
        });

        return impact;
    }

    /**
     * Get attendance error trends
     * @param {Array} errors - Array of error objects
     * @returns {Array} Error trends by hour
     */
    getAttendanceErrorTrends(errors) {
        const hourlyTrends = {};
        
        errors.forEach(error => {
            const hour = new Date(error.timestamp).getHours();
            if (!hourlyTrends[hour]) {
                hourlyTrends[hour] = 0;
            }
            hourlyTrends[hour]++;
        });

        return Object.entries(hourlyTrends)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => a.hour - b.hour);
    }

    /**
     * Get top attendance errors
     * @param {Array} errors - Array of error objects
     * @returns {Array} Top errors by frequency
     */
    getTopAttendanceErrors(errors) {
        const errorCounts = {};
        
        errors.forEach(error => {
            const key = `${error.error.name}_${error.error.code}`;
            if (!errorCounts[key]) {
                errorCounts[key] = {
                    name: error.error.name,
                    code: error.error.code,
                    count: 0,
                    operations: new Set(),
                    lastOccurrence: error.timestamp
                };
            }
            errorCounts[key].count++;
            errorCounts[key].operations.add(error.context.operation);
            if (error.timestamp > errorCounts[key].lastOccurrence) {
                errorCounts[key].lastOccurrence = error.timestamp;
            }
        });

        return Object.values(errorCounts)
            .map(error => ({
                ...error,
                operations: Array.from(error.operations)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Generate recommendations based on error patterns
     * @param {Array} errors - Array of error objects
     * @returns {Array} Recommendations
     */
    generateRecommendations(errors) {
        const recommendations = [];
        const errorsByOperation = this.groupErrorsByOperation(errors);

        // Check for high error rates in specific operations
        Object.entries(errorsByOperation).forEach(([operation, data]) => {
            if (data.count > 5) {
                recommendations.push({
                    type: 'high_error_rate',
                    operation,
                    message: `High error rate detected in ${operation} operations (${data.count} errors)`,
                    action: `Review ${operation} implementation and add additional validation`
                });
            }
        });

        // Check for authorization issues
        const authErrors = errors.filter(e => e.error.name === 'AttendanceAuthorizationError');
        if (authErrors.length > 3) {
            recommendations.push({
                type: 'authorization_issues',
                message: `Multiple authorization errors detected (${authErrors.length} errors)`,
                action: 'Review teacher assignments and permissions'
            });
        }

        // Check for validation issues
        const validationErrors = errors.filter(e => e.error.name === 'ValidationError');
        if (validationErrors.length > 5) {
            recommendations.push({
                type: 'validation_issues',
                message: `Multiple validation errors detected (${validationErrors.length} errors)`,
                action: 'Improve client-side validation and user guidance'
            });
        }

        return recommendations;
    }

    /**
     * Clean up old attendance error data
     */
    cleanup() {
        const cutoffTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
        
        // Clean attendance errors
        this.attendanceErrors = this.attendanceErrors.filter(e => e.timestamp >= cutoffTime);
        
        logger.info('Attendance error monitoring cleanup completed', {
            attendanceErrorsCount: this.attendanceErrors.length
        });
    }

    /**
     * Get health status of attendance operations
     * @returns {Object} Health status
     */
    getAttendanceHealthStatus() {
        const now = new Date();
        const recentWindow = 15 * 60 * 1000; // 15 minutes
        const recentErrors = this.attendanceErrors.filter(e => 
            (now - e.timestamp) <= recentWindow
        );

        const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
        const highImpactErrors = recentErrors.filter(e => e.impact.level === 'high');
        
        let status = 'healthy';
        if (criticalErrors.length > 0) {
            status = 'critical';
        } else if (highImpactErrors.length > 2) {
            status = 'warning';
        } else if (recentErrors.length > 10) {
            status = 'degraded';
        }

        return {
            status,
            recentErrorCount: recentErrors.length,
            criticalErrorCount: criticalErrors.length,
            highImpactErrorCount: highImpactErrors.length,
            operationHealth: this.getOperationHealth(),
            lastCleanup: this.lastCleanup || 'Never'
        };
    }

    /**
     * Get health status for each operation type
     * @returns {Object} Operation health status
     */
    getOperationHealth() {
        const health = {};
        
        Object.entries(this.attendanceMetrics.operationCounts).forEach(([operation, metrics]) => {
            const errorRate = metrics.total > 0 ? metrics.errors / metrics.total : 0;
            const perfMetrics = this.attendanceMetrics.performanceMetrics[operation];
            
            health[operation] = {
                errorRate: (errorRate * 100).toFixed(2),
                totalOperations: metrics.total,
                totalErrors: metrics.errors,
                averageResponseTime: perfMetrics ? perfMetrics.averageTime : 0,
                status: errorRate > 0.1 ? 'warning' : 'healthy'
            };
        });
        
        return health;
    }
}

// Create singleton instance
const attendanceErrorMonitoringService = new AttendanceErrorMonitoringService();

// Schedule cleanup every hour
setInterval(() => {
    attendanceErrorMonitoringService.cleanup();
    attendanceErrorMonitoringService.lastCleanup = new Date();
}, 60 * 60 * 1000);

module.exports = attendanceErrorMonitoringService;