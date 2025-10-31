/**
 * Error Monitoring Routes
 * Provides API endpoints for error monitoring and system health
 */

const express = require('express');
const router = express.Router();
const {
    getErrorAnalytics,
    getHealthStatus,
    getErrorStats,
    triggerCleanup,
    updateAlertThresholds,
    getConfiguration,
    exportErrorData
} = require('../controllers/errorMonitoringController');

const {
    getAPIPerformance,
    getDatabasePerformance,
    getSystemPerformance,
    getPerformanceAlerts,
    getAdvancedPerformanceMetrics,
    getCacheMetrics,
    updatePerformanceThresholds,
    getQueryOptimizationReport
} = require('../controllers/performanceController');

// Middleware for authentication (assuming it exists)
// const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
// router.use(authenticateToken);

/**
 * @route   GET /api/monitoring/analytics
 * @desc    Get error analytics dashboard data
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 24 hours)
 * @query   includeDetails - Include detailed error information (default: false)
 */
router.get('/analytics', getErrorAnalytics);

/**
 * @route   GET /api/monitoring/health
 * @desc    Get system health status
 * @access  Admin only
 */
router.get('/health', getHealthStatus);

/**
 * @route   GET /api/monitoring/stats/:errorName/:errorCode
 * @desc    Get statistics for a specific error type
 * @access  Admin only
 * @param   errorName - Name of the error
 * @param   errorCode - Error code
 */
router.get('/stats/:errorName/:errorCode', getErrorStats);

/**
 * @route   POST /api/monitoring/cleanup
 * @desc    Trigger manual cleanup of error monitoring data
 * @access  Admin only
 */
router.post('/cleanup', triggerCleanup);

/**
 * @route   PUT /api/monitoring/thresholds
 * @desc    Update alert thresholds
 * @access  Admin only
 * @body    errorRate - Error rate threshold (0-1)
 * @body    criticalErrors - Critical errors threshold
 * @body    timeWindow - Time window in milliseconds
 */
router.put('/thresholds', updateAlertThresholds);

/**
 * @route   GET /api/monitoring/config
 * @desc    Get error monitoring configuration
 * @access  Admin only
 */
router.get('/config', getConfiguration);

/**
 * @route   GET /api/monitoring/export
 * @desc    Export error data for external analysis
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds
 * @query   format - Export format (json, csv)
 * @query   includeDetails - Include detailed information
 */
router.get('/export', exportErrorData);

// Performance monitoring routes

/**
 * @route   GET /api/monitoring/performance/api
 * @desc    Get API performance analytics
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 1 hour)
 */
router.get('/performance/api', getAPIPerformance);

/**
 * @route   GET /api/monitoring/performance/database
 * @desc    Get database performance analytics
 * @access  Admin only
 */
router.get('/performance/database', getDatabasePerformance);

/**
 * @route   GET /api/monitoring/performance/system
 * @desc    Get system performance overview
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 1 hour)
 */
router.get('/performance/system', getSystemPerformance);

/**
 * @route   GET /api/monitoring/performance/alerts
 * @desc    Get performance alerts and recommendations
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 1 hour)
 */
router.get('/performance/alerts', getPerformanceAlerts);

/**
 * @route   GET /api/monitoring/performance/advanced
 * @desc    Get advanced performance metrics with detailed analytics
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 1 hour)
 */
router.get('/performance/advanced', getAdvancedPerformanceMetrics);

/**
 * @route   GET /api/monitoring/performance/cache
 * @desc    Get cache performance metrics and statistics
 * @access  Admin only
 */
router.get('/performance/cache', getCacheMetrics);

/**
 * @route   PUT /api/monitoring/performance/thresholds
 * @desc    Update performance monitoring thresholds
 * @access  Admin only
 * @body    responseTime - Response time thresholds
 * @body    errorRate - Error rate thresholds
 * @body    memoryUsage - Memory usage thresholds
 * @body    dbQueryTime - Database query time thresholds
 */
router.put('/performance/thresholds', updatePerformanceThresholds);

/**
 * @route   GET /api/monitoring/performance/optimization
 * @desc    Get database query optimization report
 * @access  Admin only
 */
router.get('/performance/optimization', getQueryOptimizationReport);

module.exports = router;