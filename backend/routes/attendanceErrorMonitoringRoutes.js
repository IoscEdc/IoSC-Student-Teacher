/**
 * Attendance Error Monitoring Routes
 * Provides API endpoints for attendance error monitoring and system health
 */

const express = require('express');
const router = express.Router();
const {
    getAttendanceErrorAnalytics,
    getAttendanceHealthStatus,
    getAttendancePerformanceMetrics,
    getAttendanceErrorTrends,
    getAttendanceErrorImpact,
    triggerAttendanceCleanup,
    updateAttendanceAlertThresholds,
    getAttendanceMonitoringConfig,
    exportAttendanceErrorData
} = require('../controllers/attendanceErrorMonitoringController');

// Middleware for authentication (assuming it exists)
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/attendance-monitoring/analytics
 * @desc    Get attendance error analytics dashboard data
 * @access  Admin, Teacher
 * @query   timeRange - Time range in milliseconds (default: 24 hours)
 * @query   operation - Filter by specific operation type
 */
router.get('/analytics', authorizeRoles('Admin', 'Teacher'), getAttendanceErrorAnalytics);

/**
 * @route   GET /api/attendance-monitoring/health
 * @desc    Get attendance system health status
 * @access  Admin, Teacher
 */
router.get('/health', authorizeRoles('Admin', 'Teacher'), getAttendanceHealthStatus);

/**
 * @route   GET /api/attendance-monitoring/performance
 * @desc    Get attendance operation performance metrics
 * @access  Admin only
 * @query   operation - Filter by specific operation type
 */
router.get('/performance', authorizeRoles('Admin'), getAttendancePerformanceMetrics);

/**
 * @route   GET /api/attendance-monitoring/trends
 * @desc    Get attendance error trends and patterns
 * @access  Admin, Teacher
 * @query   timeRange - Time range in milliseconds (default: 7 days)
 * @query   operation - Filter by specific operation type
 */
router.get('/trends', authorizeRoles('Admin', 'Teacher'), getAttendanceErrorTrends);

/**
 * @route   GET /api/attendance-monitoring/impact
 * @desc    Get attendance error impact analysis
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 24 hours)
 */
router.get('/impact', authorizeRoles('Admin'), getAttendanceErrorImpact);

/**
 * @route   POST /api/attendance-monitoring/cleanup
 * @desc    Trigger manual cleanup of attendance error data
 * @access  Admin only
 */
router.post('/cleanup', authorizeRoles('Admin'), triggerAttendanceCleanup);

/**
 * @route   PUT /api/attendance-monitoring/thresholds
 * @desc    Update attendance alert thresholds
 * @access  Admin only
 * @body    markingFailureRate - Marking failure rate threshold (0-1)
 * @body    bulkOperationFailureRate - Bulk operation failure rate threshold (0-1)
 * @body    consecutiveFailures - Consecutive failures threshold
 * @body    responseTimeThreshold - Response time threshold in milliseconds
 */
router.put('/thresholds', authorizeRoles('Admin'), updateAttendanceAlertThresholds);

/**
 * @route   GET /api/attendance-monitoring/config
 * @desc    Get attendance monitoring configuration
 * @access  Admin only
 */
router.get('/config', authorizeRoles('Admin'), getAttendanceMonitoringConfig);

/**
 * @route   GET /api/attendance-monitoring/export
 * @desc    Export attendance error data for external analysis
 * @access  Admin only
 * @query   timeRange - Time range in milliseconds (default: 7 days)
 * @query   format - Export format (json, csv)
 * @query   operation - Filter by specific operation type
 */
router.get('/export', authorizeRoles('Admin'), exportAttendanceErrorData);

module.exports = router;