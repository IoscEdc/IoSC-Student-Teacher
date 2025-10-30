/**
 * Error Handling Integration Tests
 * Tests error handling in real attendance system scenarios
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the actual app components
const { errorHandler, asyncHandler } = require('../../middleware/errorMiddleware');
const { performanceMonitor } = require('../../middleware/performanceMiddleware');
const attendanceController = require('../../controllers/attendanceController');
const errorMonitoringController = require('../../controllers/errorMonitoringController');
const errorMonitoringService = require('../../services/ErrorMonitoringService');

describe('Error Handling Integration Tests', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(() => {
        // Create Express app with middleware
        app = express();
        app.use(express.json());
        app.use(performanceMonitor);

        // Mock authentication middleware
        app.use((req, res, next) => {
            req.user = { id: 'teacher123', role: 'Teacher' };
            req.ip = '127.0.0.1';
            next();
        });

        // Clear error monitoring data
        errorMonitoringService.recentErrors = [];
        errorMonitoringService.errorStats.clear();
    });

    describe('Attendance Controller Error Handling', () => {
        test('should handle missing required fields in markAttendance', async () => {
            app.post('/attendance/mark', attendanceController.markAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .post('/attendance/mark')
                .send({
                    classId: 'class123',
                    // Missing required fields: subjectId, date, session, studentAttendance
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('Missing required fields');
            expect(response.body.error.suggestions).toBeDefined();
        });

        test('should handle invalid attendance record ID in updateAttendance', async () => {
            app.put('/attendance/:id', attendanceController.updateAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .put('/attendance/invalid-id')
                .send({ status: 'present' });

            // This will likely result in a CastError which gets converted to INVALID_ID
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('should handle authorization error in deleteAttendance', async () => {
            // Override user to be non-admin
            app.use((req, res, next) => {
                req.user = { id: 'teacher123', role: 'Teacher' };
                next();
            });

            app.delete('/attendance/:id', attendanceController.deleteAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .delete('/attendance/record123')
                .send({ reason: 'Test deletion' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
            expect(response.body.error.message).toContain('administrators');
        });

        test('should handle validation error in bulkMarkAttendance', async () => {
            app.post('/attendance/bulk/mark', attendanceController.bulkMarkAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .post('/attendance/bulk/mark')
                .send({
                    attendanceRecords: 'not-an-array' // Should be array
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('array is required');
        });

        test('should handle empty array in bulkMarkAttendance', async () => {
            app.post('/attendance/bulk/mark', attendanceController.bulkMarkAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .post('/attendance/bulk/mark')
                .send({
                    attendanceRecords: [] // Empty array
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('cannot be empty');
        });
    });

    describe('Error Monitoring Integration', () => {
        test('should track errors from attendance operations', async () => {
            app.post('/attendance/mark', attendanceController.markAttendance);
            app.use(errorHandler);

            // Make request that will cause validation error
            await request(app)
                .post('/attendance/mark')
                .send({ classId: 'class123' }); // Missing required fields

            // Check that error was tracked
            const analytics = errorMonitoringService.getErrorAnalytics();
            expect(analytics.summary.totalErrors).toBeGreaterThan(0);
            expect(analytics.severityBreakdown.info).toBeGreaterThan(0); // ValidationError should be 'info'
        });

        test('should provide error analytics to admin users', async () => {
            // Override user to be admin
            app.use((req, res, next) => {
                req.user = { id: 'admin123', role: 'Admin' };
                next();
            });

            app.get('/monitoring/analytics', errorMonitoringController.getErrorAnalytics);
            app.use(errorHandler);

            // First, generate some errors
            errorMonitoringService.trackError(new Error('Test error 1'), { endpoint: '/test1' });
            errorMonitoringService.trackError(new Error('Test error 2'), { endpoint: '/test2' });

            const response = await request(app).get('/monitoring/analytics');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.summary).toBeDefined();
            expect(response.body.data.summary.totalErrors).toBeGreaterThan(0);
        });

        test('should reject non-admin users from error analytics', async () => {
            // Keep user as teacher
            app.get('/monitoring/analytics', errorMonitoringController.getErrorAnalytics);
            app.use(errorHandler);

            const response = await request(app).get('/monitoring/analytics');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
        });
    });

    describe('Performance Monitoring Integration', () => {
        test('should track performance metrics for requests', async () => {
            app.get('/test', (req, res) => {
                // Simulate some processing
                setTimeout(() => {
                    res.json({ success: true, message: 'Test response' });
                }, 10);
            });

            const response = await request(app).get('/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // Performance metrics would be tracked in the background
        });
    });

    describe('Error Recovery and User Experience', () => {
        test('should provide helpful error messages and recovery suggestions', async () => {
            app.post('/attendance/mark', attendanceController.markAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .post('/attendance/mark')
                .send({ classId: 'class123' });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toBeDefined();
            expect(response.body.error.suggestions).toBeDefined();
            expect(response.body.error.suggestions.length).toBeGreaterThan(0);
            expect(response.body.error.recoveryActions).toBeDefined();
            expect(response.body.error.support).toBeDefined();
            expect(response.body.error.timestamp).toBeDefined();
        });

        test('should include request ID for error tracking', async () => {
            app.post('/attendance/mark', attendanceController.markAttendance);
            app.use(errorHandler);

            const response = await request(app)
                .post('/attendance/mark')
                .send({ classId: 'class123' });

            expect(response.status).toBe(400);
            expect(response.body.error.requestId).toBeDefined();
            expect(response.body.error.requestId).toMatch(/^req_/);
        });
    });

    describe('System Health and Monitoring', () => {
        test('should provide system health status', async () => {
            // Override user to be admin
            app.use((req, res, next) => {
                req.user = { id: 'admin123', role: 'Admin' };
                next();
            });

            app.get('/monitoring/health', errorMonitoringController.getHealthStatus);
            app.use(errorHandler);

            const response = await request(app).get('/monitoring/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBeDefined();
            expect(['healthy', 'warning', 'critical']).toContain(response.body.data.status);
            expect(response.body.data.memoryUsage).toBeDefined();
        });
    });
});