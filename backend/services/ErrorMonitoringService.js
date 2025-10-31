/**
 * Error Monitoring Service
 * Provides comprehensive error tracking, analysis, and alerting capabilities
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class ErrorMonitoringService {
    constructor() {
        this.errorStats = new Map();
        this.alertThresholds = {
            errorRate: 0.1, // 10% error rate threshold
            criticalErrors: 5, // 5 critical errors in time window
            timeWindow: 5 * 60 * 1000 // 5 minutes
        };
        this.recentErrors = [];
        this.maxRecentErrors = 1000;
    }

    /**
     * Track an error occurrence
     * @param {Error} error - The error that occurred
     * @param {Object} context - Additional context information
     */
    trackError(error, context = {}) {
        const errorInfo = {
            timestamp: new Date(),
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.errorCode || error.code,
            statusCode: error.statusCode,
            context,
            severity: this.determineSeverity(error)
        };

        // Add to recent errors
        this.recentErrors.unshift(errorInfo);
        if (this.recentErrors.length > this.maxRecentErrors) {
            this.recentErrors.pop();
        }

        // Update error statistics
        this.updateErrorStats(errorInfo);

        // Check for alert conditions
        this.checkAlertConditions(errorInfo);

        // Log the error
        this.logError(errorInfo);
    }

    /**
     * Determine error severity level
     * @param {Error} error - The error to analyze
     * @returns {string} Severity level
     */
    determineSeverity(error) {
        if (error.statusCode >= 500) {
            return 'critical';
        } else if (error.name === 'ValidationError' || error.errorCode === 'VALIDATION_ERROR') {
            return 'info';
        } else if (error.statusCode >= 400) {
            return 'warning';
        } else {
            return 'error';
        }
    }

    /**
     * Update error statistics
     * @param {Object} errorInfo - Error information
     */
    updateErrorStats(errorInfo) {
        const key = `${errorInfo.name}_${errorInfo.code}`;
        
        if (!this.errorStats.has(key)) {
            this.errorStats.set(key, {
                count: 0,
                firstOccurrence: errorInfo.timestamp,
                lastOccurrence: errorInfo.timestamp,
                severity: errorInfo.severity,
                contexts: []
            });
        }

        const stats = this.errorStats.get(key);
        stats.count++;
        stats.lastOccurrence = errorInfo.timestamp;
        
        // Store unique contexts (limited to prevent memory issues)
        const contextKey = JSON.stringify(errorInfo.context);
        if (!stats.contexts.includes(contextKey) && stats.contexts.length < 10) {
            stats.contexts.push(contextKey);
        }
    }

    /**
     * Check if alert conditions are met
     * @param {Object} errorInfo - Error information
     */
    checkAlertConditions(errorInfo) {
        const now = new Date();
        const timeWindow = this.alertThresholds.timeWindow;

        // Check critical error threshold
        if (errorInfo.severity === 'critical') {
            const recentCriticalErrors = this.recentErrors.filter(e => 
                e.severity === 'critical' && 
                (now - e.timestamp) <= timeWindow
            );

            if (recentCriticalErrors.length >= this.alertThresholds.criticalErrors) {
                this.sendAlert('critical_error_threshold', {
                    count: recentCriticalErrors.length,
                    timeWindow: timeWindow / 1000 / 60,
                    errors: recentCriticalErrors.slice(0, 5)
                });
            }
        }

        // Check error rate threshold
        const recentErrors = this.recentErrors.filter(e => 
            (now - e.timestamp) <= timeWindow
        );

        if (recentErrors.length > 0) {
            const errorRate = recentErrors.length / (timeWindow / 1000 / 60); // errors per minute
            if (errorRate >= this.alertThresholds.errorRate * 60) { // convert to per minute
                this.sendAlert('high_error_rate', {
                    errorRate: errorRate.toFixed(2),
                    timeWindow: timeWindow / 1000 / 60,
                    totalErrors: recentErrors.length
                });
            }
        }
    }

    /**
     * Send alert notification
     * @param {string} alertType - Type of alert
     * @param {Object} data - Alert data
     */
    sendAlert(alertType, data) {
        const alert = {
            type: alertType,
            timestamp: new Date(),
            data,
            severity: 'high'
        };

        logger.error(`ALERT: ${alertType}`, alert);

        // In production, this would integrate with alerting systems like:
        // - Email notifications
        // - Slack/Teams webhooks
        // - PagerDuty
        // - SMS alerts
        
        // For now, we'll just log and could extend to send notifications
        this.notifyAdministrators(alert);
    }

    /**
     * Notify administrators of critical issues
     * @param {Object} alert - Alert information
     */
    notifyAdministrators(alert) {
        // This would integrate with notification systems
        logger.security('administrator_alert', {
            alert,
            notificationSent: true,
            recipients: ['admin@school.edu'] // Would come from config
        });
    }

    /**
     * Log error with appropriate level
     * @param {Object} errorInfo - Error information
     */
    logError(errorInfo) {
        const logData = {
            error: errorInfo,
            stats: this.getErrorStats(errorInfo.name, errorInfo.code)
        };

        switch (errorInfo.severity) {
            case 'critical':
                logger.error('Critical Error Tracked', logData);
                break;
            case 'error':
                logger.error('Error Tracked', logData);
                break;
            case 'warning':
                logger.warn('Warning Tracked', logData);
                break;
            case 'info':
                logger.info('Info Error Tracked', logData);
                break;
            default:
                logger.error('Unknown Severity Error Tracked', logData);
        }
    }

    /**
     * Get error statistics for a specific error type
     * @param {string} name - Error name
     * @param {string} code - Error code
     * @returns {Object} Error statistics
     */
    getErrorStats(name, code) {
        const key = `${name}_${code}`;
        return this.errorStats.get(key) || null;
    }

    /**
     * Get comprehensive error analytics
     * @param {Object} options - Analytics options
     * @returns {Object} Error analytics data
     */
    getErrorAnalytics(options = {}) {
        const {
            timeRange = 24 * 60 * 60 * 1000, // 24 hours
            includeDetails = false
        } = options;

        const now = new Date();
        const cutoffTime = new Date(now - timeRange);

        const recentErrors = this.recentErrors.filter(e => e.timestamp >= cutoffTime);

        const analytics = {
            summary: {
                totalErrors: recentErrors.length,
                timeRange: timeRange / 1000 / 60 / 60, // hours
                errorRate: recentErrors.length / (timeRange / 1000 / 60 / 60), // per hour
                uniqueErrorTypes: new Set(recentErrors.map(e => `${e.name}_${e.code}`)).size
            },
            severityBreakdown: {
                critical: recentErrors.filter(e => e.severity === 'critical').length,
                error: recentErrors.filter(e => e.severity === 'error').length,
                warning: recentErrors.filter(e => e.severity === 'warning').length,
                info: recentErrors.filter(e => e.severity === 'info').length
            },
            topErrors: this.getTopErrors(recentErrors),
            trends: this.getErrorTrends(recentErrors),
            contexts: this.getErrorContexts(recentErrors)
        };

        if (includeDetails) {
            analytics.recentErrors = recentErrors.slice(0, 50);
        }

        return analytics;
    }

    /**
     * Get top occurring errors
     * @param {Array} errors - Array of error objects
     * @returns {Array} Top errors by frequency
     */
    getTopErrors(errors) {
        const errorCounts = {};
        
        errors.forEach(error => {
            const key = `${error.name}_${error.code}`;
            if (!errorCounts[key]) {
                errorCounts[key] = {
                    name: error.name,
                    code: error.code,
                    count: 0,
                    severity: error.severity,
                    lastOccurrence: error.timestamp
                };
            }
            errorCounts[key].count++;
            if (error.timestamp > errorCounts[key].lastOccurrence) {
                errorCounts[key].lastOccurrence = error.timestamp;
            }
        });

        return Object.values(errorCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Get error trends over time
     * @param {Array} errors - Array of error objects
     * @returns {Array} Error trends by hour
     */
    getErrorTrends(errors) {
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
     * Get error contexts analysis
     * @param {Array} errors - Array of error objects
     * @returns {Object} Context analysis
     */
    getErrorContexts(errors) {
        const contexts = {
            userRoles: {},
            endpoints: {},
            userAgents: {},
            ipAddresses: {}
        };

        errors.forEach(error => {
            const ctx = error.context;
            
            if (ctx.userRole) {
                contexts.userRoles[ctx.userRole] = (contexts.userRoles[ctx.userRole] || 0) + 1;
            }
            
            if (ctx.endpoint) {
                contexts.endpoints[ctx.endpoint] = (contexts.endpoints[ctx.endpoint] || 0) + 1;
            }
            
            if (ctx.userAgent) {
                const browser = this.extractBrowser(ctx.userAgent);
                contexts.userAgents[browser] = (contexts.userAgents[browser] || 0) + 1;
            }
            
            if (ctx.ipAddress) {
                contexts.ipAddresses[ctx.ipAddress] = (contexts.ipAddresses[ctx.ipAddress] || 0) + 1;
            }
        });

        return contexts;
    }

    /**
     * Extract browser information from user agent
     * @param {string} userAgent - User agent string
     * @returns {string} Browser name
     */
    extractBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
    }

    /**
     * Clear old error data to prevent memory issues
     */
    cleanup() {
        const cutoffTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
        
        // Clean recent errors
        this.recentErrors = this.recentErrors.filter(e => e.timestamp >= cutoffTime);
        
        // Clean error stats
        for (const [key, stats] of this.errorStats.entries()) {
            if (stats.lastOccurrence < cutoffTime) {
                this.errorStats.delete(key);
            }
        }

        logger.info('Error monitoring cleanup completed', {
            recentErrorsCount: this.recentErrors.length,
            errorStatsCount: this.errorStats.size
        });
    }

    /**
     * Get health status of the error monitoring system
     * @returns {Object} Health status
     */
    getHealthStatus() {
        const now = new Date();
        const recentErrors = this.recentErrors.filter(e => 
            (now - e.timestamp) <= this.alertThresholds.timeWindow
        );

        const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
        
        return {
            status: criticalErrors.length > 0 ? 'critical' : 
                   recentErrors.length > 10 ? 'warning' : 'healthy',
            recentErrorCount: recentErrors.length,
            criticalErrorCount: criticalErrors.length,
            memoryUsage: {
                recentErrors: this.recentErrors.length,
                errorStats: this.errorStats.size
            },
            lastCleanup: this.lastCleanup || 'Never'
        };
    }
}

// Create singleton instance
const errorMonitoringService = new ErrorMonitoringService();

// Schedule cleanup every hour
setInterval(() => {
    errorMonitoringService.cleanup();
    errorMonitoringService.lastCleanup = new Date();
}, 60 * 60 * 1000);

module.exports = errorMonitoringService;