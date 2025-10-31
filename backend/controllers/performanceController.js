/**
 * Performance Monitoring Controller
 * Provides endpoints for performance analytics and monitoring
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const { AuthorizationError, ValidationError } = require('../utils/errors');
const { dbPerformanceTracker, performanceMetrics } = require('../middleware/performanceMiddleware');
const { performanceMonitor } = require('../utils/performanceMonitor');
const { cacheManager } = require('../utils/cache');
const { queryOptimizer } = require('../utils/queryOptimizer');
const logger = require('../utils/logger');

/**
 * Get API performance analytics
 */
const getAPIPerformance = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view performance analytics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_performance_analytics'
        });
    }

    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : 60 * 60 * 1000; // 1 hour default

    if (timeRange < 60000 || timeRange > 7 * 24 * 60 * 60 * 1000) { // 1 minute to 7 days
        throw new ValidationError('Time range must be between 1 minute and 7 days', {
            field: 'timeRange',
            value: timeRange,
            validRange: '60000-604800000'
        });
    }

    logger.info('API performance analytics accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange
    });

    const metrics = performanceMetrics.getMetrics(timeRange);

    res.status(200).json({
        success: true,
        data: {
            ...metrics,
            timeRange: timeRange / 1000 / 60, // Convert to minutes for display
            generatedAt: new Date()
        },
        message: 'API performance analytics retrieved successfully'
    });
});

/**
 * Get database performance analytics
 */
const getDatabasePerformance = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view database performance', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_database_performance'
        });
    }

    logger.info('Database performance analytics accessed', {
        userId: req.user.id,
        userRole: req.user.role
    });

    const metrics = dbPerformanceTracker.getMetrics();

    res.status(200).json({
        success: true,
        data: {
            ...metrics,
            generatedAt: new Date()
        },
        message: 'Database performance analytics retrieved successfully'
    });
});

/**
 * Get system performance overview
 */
const getSystemPerformance = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view system performance', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_system_performance'
        });
    }

    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : 60 * 60 * 1000; // 1 hour default

    // Get API metrics
    const apiMetrics = performanceMetrics.getMetrics(timeRange);
    
    // Get database metrics
    const dbMetrics = dbPerformanceTracker.getMetrics();
    
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    const systemOverview = {
        api: {
            totalRequests: apiMetrics.summary.totalRequests,
            avgResponseTime: Math.round(apiMetrics.summary.avgResponseTime * 100) / 100,
            slowRequests: apiMetrics.summary.slowRequests,
            errorRate: apiMetrics.summary.totalRequests > 0 
                ? Math.round((apiMetrics.summary.errorRequests / apiMetrics.summary.totalRequests) * 100 * 100) / 100
                : 0
        },
        database: {
            totalQueries: dbMetrics.summary.totalQueries,
            avgQueryTime: dbMetrics.summary.avgResponseTime,
            slowQueries: dbMetrics.summary.totalSlowQueries,
            slowQueryRate: dbMetrics.summary.totalQueries > 0
                ? Math.round((dbMetrics.summary.totalSlowQueries / dbMetrics.summary.totalQueries) * 100 * 100) / 100
                : 0
        },
        system: {
            memoryUsage: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
                external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100 // MB
            },
            cpuUsage: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: Math.round(uptime / 60 * 100) / 100, // minutes
            nodeVersion: process.version,
            platform: process.platform
        },
        health: {
            status: determineHealthStatus(apiMetrics, dbMetrics),
            lastUpdated: new Date()
        }
    };

    logger.info('System performance overview accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        healthStatus: systemOverview.health.status
    });

    res.status(200).json({
        success: true,
        data: systemOverview,
        message: 'System performance overview retrieved successfully'
    });
});

/**
 * Get performance alerts and recommendations
 */
const getPerformanceAlerts = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view performance alerts', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_performance_alerts'
        });
    }

    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : 60 * 60 * 1000; // 1 hour default
    
    const apiMetrics = performanceMetrics.getMetrics(timeRange);
    const dbMetrics = dbPerformanceTracker.getMetrics();
    
    const alerts = [];
    const recommendations = [];

    // Check API performance alerts
    if (apiMetrics.summary.avgResponseTime > 2000) {
        alerts.push({
            type: 'warning',
            category: 'api_performance',
            message: `Average API response time is ${Math.round(apiMetrics.summary.avgResponseTime)}ms`,
            threshold: 2000,
            current: Math.round(apiMetrics.summary.avgResponseTime),
            severity: apiMetrics.summary.avgResponseTime > 5000 ? 'critical' : 'warning'
        });
        
        recommendations.push({
            category: 'api_performance',
            message: 'Consider optimizing slow endpoints or adding caching',
            priority: 'high'
        });
    }

    // Check error rate
    const errorRate = apiMetrics.summary.totalRequests > 0 
        ? (apiMetrics.summary.errorRequests / apiMetrics.summary.totalRequests) * 100
        : 0;
    
    if (errorRate > 5) {
        alerts.push({
            type: 'error',
            category: 'error_rate',
            message: `High error rate: ${Math.round(errorRate * 100) / 100}%`,
            threshold: 5,
            current: Math.round(errorRate * 100) / 100,
            severity: errorRate > 10 ? 'critical' : 'warning'
        });
        
        recommendations.push({
            category: 'error_rate',
            message: 'Review error logs and fix recurring issues',
            priority: 'high'
        });
    }

    // Check database performance
    if (dbMetrics.summary.avgResponseTime > 1000) {
        alerts.push({
            type: 'warning',
            category: 'database_performance',
            message: `Average database query time is ${Math.round(dbMetrics.summary.avgResponseTime)}ms`,
            threshold: 1000,
            current: Math.round(dbMetrics.summary.avgResponseTime),
            severity: dbMetrics.summary.avgResponseTime > 3000 ? 'critical' : 'warning'
        });
        
        recommendations.push({
            category: 'database_performance',
            message: 'Review slow queries and consider adding indexes',
            priority: 'medium'
        });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) { // 500MB threshold
        alerts.push({
            type: 'warning',
            category: 'memory_usage',
            message: `High memory usage: ${Math.round(heapUsedMB)}MB`,
            threshold: 500,
            current: Math.round(heapUsedMB),
            severity: heapUsedMB > 1000 ? 'critical' : 'warning'
        });
        
        recommendations.push({
            category: 'memory_usage',
            message: 'Monitor for memory leaks and optimize data structures',
            priority: 'medium'
        });
    }

    logger.info('Performance alerts accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        alertCount: alerts.length,
        recommendationCount: recommendations.length
    });

    res.status(200).json({
        success: true,
        data: {
            alerts: alerts.sort((a, b) => {
                const severityOrder = { critical: 3, warning: 2, info: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            }),
            recommendations: recommendations.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }),
            summary: {
                totalAlerts: alerts.length,
                criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
                warningAlerts: alerts.filter(a => a.severity === 'warning').length,
                totalRecommendations: recommendations.length
            },
            generatedAt: new Date()
        },
        message: 'Performance alerts retrieved successfully'
    });
});

/**
 * Determine overall health status based on metrics
 * @param {Object} apiMetrics - API performance metrics
 * @param {Object} dbMetrics - Database performance metrics
 * @returns {string} Health status
 */
function determineHealthStatus(apiMetrics, dbMetrics) {
    const issues = [];
    
    // Check API performance
    if (apiMetrics.summary.avgResponseTime > 5000) {
        issues.push('critical_api_performance');
    } else if (apiMetrics.summary.avgResponseTime > 2000) {
        issues.push('warning_api_performance');
    }
    
    // Check error rate
    const errorRate = apiMetrics.summary.totalRequests > 0 
        ? (apiMetrics.summary.errorRequests / apiMetrics.summary.totalRequests) * 100
        : 0;
    
    if (errorRate > 10) {
        issues.push('critical_error_rate');
    } else if (errorRate > 5) {
        issues.push('warning_error_rate');
    }
    
    // Check database performance
    if (dbMetrics.summary.avgResponseTime > 3000) {
        issues.push('critical_database_performance');
    } else if (dbMetrics.summary.avgResponseTime > 1000) {
        issues.push('warning_database_performance');
    }
    
    // Check memory usage
    const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (heapUsedMB > 1000) {
        issues.push('critical_memory_usage');
    } else if (heapUsedMB > 500) {
        issues.push('warning_memory_usage');
    }
    
    // Determine overall status
    if (issues.some(issue => issue.startsWith('critical_'))) {
        return 'critical';
    } else if (issues.some(issue => issue.startsWith('warning_'))) {
        return 'warning';
    } else {
        return 'healthy';
    }
}

/**
 * Get advanced performance metrics with detailed analytics
 */
const getAdvancedPerformanceMetrics = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view advanced performance metrics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_advanced_performance'
        });
    }

    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : 3600000; // 1 hour default

    if (timeRange < 60000 || timeRange > 7 * 24 * 60 * 60 * 1000) { // 1 minute to 7 days
        throw new ValidationError('Time range must be between 1 minute and 7 days', {
            field: 'timeRange',
            value: timeRange,
            validRange: '60000-604800000'
        });
    }

    logger.info('Advanced performance metrics accessed', {
        userId: req.user.id,
        userRole: req.user.role,
        timeRange
    });

    const summary = performanceMonitor.getPerformanceSummary(timeRange);

    res.status(200).json({
        success: true,
        data: summary,
        message: 'Advanced performance metrics retrieved successfully'
    });
});

/**
 * Get cache performance metrics
 */
const getCacheMetrics = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view cache metrics', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_cache_metrics'
        });
    }

    logger.info('Cache metrics accessed', {
        userId: req.user.id,
        userRole: req.user.role
    });

    const cacheStats = cacheManager.getStats();

    res.status(200).json({
        success: true,
        data: {
            ...cacheStats,
            generatedAt: new Date()
        },
        message: 'Cache metrics retrieved successfully'
    });
});

/**
 * Update performance monitoring thresholds
 */
const updatePerformanceThresholds = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can update performance thresholds', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'update_performance_thresholds'
        });
    }

    const { responseTime, errorRate, memoryUsage, dbQueryTime } = req.body;

    // Validate threshold values
    const validationErrors = [];

    if (responseTime) {
        if (typeof responseTime.warning !== 'number' || responseTime.warning < 100 || responseTime.warning > 30000) {
            validationErrors.push('Response time warning threshold must be between 100ms and 30s');
        }
        if (typeof responseTime.critical !== 'number' || responseTime.critical < 100 || responseTime.critical > 60000) {
            validationErrors.push('Response time critical threshold must be between 100ms and 60s');
        }
        if (responseTime.warning && responseTime.critical && responseTime.warning >= responseTime.critical) {
            validationErrors.push('Response time warning threshold must be less than critical threshold');
        }
    }

    if (errorRate) {
        if (typeof errorRate.warning !== 'number' || errorRate.warning < 0 || errorRate.warning > 1) {
            validationErrors.push('Error rate warning threshold must be between 0 and 1');
        }
        if (typeof errorRate.critical !== 'number' || errorRate.critical < 0 || errorRate.critical > 1) {
            validationErrors.push('Error rate critical threshold must be between 0 and 1');
        }
        if (errorRate.warning && errorRate.critical && errorRate.warning >= errorRate.critical) {
            validationErrors.push('Error rate warning threshold must be less than critical threshold');
        }
    }

    if (memoryUsage) {
        if (typeof memoryUsage.warning !== 'number' || memoryUsage.warning < 100 * 1024 * 1024) {
            validationErrors.push('Memory usage warning threshold must be at least 100MB');
        }
        if (typeof memoryUsage.critical !== 'number' || memoryUsage.critical < 100 * 1024 * 1024) {
            validationErrors.push('Memory usage critical threshold must be at least 100MB');
        }
        if (memoryUsage.warning && memoryUsage.critical && memoryUsage.warning >= memoryUsage.critical) {
            validationErrors.push('Memory usage warning threshold must be less than critical threshold');
        }
    }

    if (dbQueryTime) {
        if (typeof dbQueryTime.warning !== 'number' || dbQueryTime.warning < 10 || dbQueryTime.warning > 30000) {
            validationErrors.push('Database query time warning threshold must be between 10ms and 30s');
        }
        if (typeof dbQueryTime.critical !== 'number' || dbQueryTime.critical < 10 || dbQueryTime.critical > 60000) {
            validationErrors.push('Database query time critical threshold must be between 10ms and 60s');
        }
        if (dbQueryTime.warning && dbQueryTime.critical && dbQueryTime.warning >= dbQueryTime.critical) {
            validationErrors.push('Database query time warning threshold must be less than critical threshold');
        }
    }

    if (validationErrors.length > 0) {
        throw new ValidationError('Invalid threshold values', {
            errors: validationErrors
        });
    }

    // Update thresholds
    const newThresholds = {};
    if (responseTime) newThresholds.responseTime = responseTime;
    if (errorRate) newThresholds.errorRate = errorRate;
    if (memoryUsage) newThresholds.memoryUsage = memoryUsage;
    if (dbQueryTime) newThresholds.dbQueryTime = dbQueryTime;

    performanceMonitor.updateThresholds(newThresholds);

    logger.info('Performance thresholds updated', {
        userId: req.user.id,
        userRole: req.user.role,
        newThresholds
    });

    res.status(200).json({
        success: true,
        data: {
            updatedThresholds: newThresholds,
            updatedAt: new Date()
        },
        message: 'Performance thresholds updated successfully'
    });
});

/**
 * Get database query optimization report
 */
const getQueryOptimizationReport = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        throw new AuthorizationError('Only administrators can view query optimization reports', {
            requiredRole: 'Admin',
            userRole: req.user.role,
            action: 'view_query_optimization'
        });
    }

    logger.info('Query optimization report accessed', {
        userId: req.user.id,
        userRole: req.user.role
    });

    const report = queryOptimizer.getOptimizationReport();

    res.status(200).json({
        success: true,
        data: report,
        message: 'Query optimization report retrieved successfully'
    });
});

module.exports = {
    getAPIPerformance,
    getDatabasePerformance,
    getSystemPerformance,
    getPerformanceAlerts,
    getAdvancedPerformanceMetrics,
    getCacheMetrics,
    updatePerformanceThresholds,
    getQueryOptimizationReport
};