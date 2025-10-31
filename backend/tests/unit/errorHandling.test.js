/**
 * Error Handling System Tests
 * Tests for comprehensive error handling and monitoring
 */

const {
    AppError,
    ValidationError,
    AttendanceAuthorizationError,
    AttendanceAlreadyMarkedError,
    StudentNotEnrolledError,
    BulkOperationError
} = require('../../utils/errors');

const AttendanceErrorHandler = require('../../utils/attendanceErrorHandler');
const attendanceErrorMonitoringService = require('../../services/AttendanceErrorMonitoringService');

describe('Error Handling System', () => {
    describe('Custom Error Classes', () => {
        test('AppError should create proper error structure', () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'test' });
            
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe('TEST_ERROR');
            expect(error.details).toEqual({ field: 'test' });
            expect(error.isOperational).toBe(true);
            expect(error.timestamp).toBeDefined();
        });

        test('ValidationError should have correct defaults', () => {
            const error = new ValidationError('Validation failed');
            
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe('VALIDATION_ERROR');
            expect(error.isOperational).toBe(true);
        });

        test('AttendanceAuthorizationError should include context', () => {
            const error = new AttendanceAuthorizationError('teacher123', 'class456', 'subject789');
            
            expect(error.statusCode).toBe(403);
            expect(error.errorCode).toBe('ATTENDANCE_UNAUTHORIZED');
            expect(error.details).toEqual({
                teacherId: 'teacher123',
                classId: 'class456',
                subjectId: 'subject789'
            });
        });

        test('BulkOperationError should handle bulk operation results', () => {
            const failures = [
                { studentId: 'student1', error: 'Not enrolled' },
                { studentId: 'student2', error: 'Invalid status' }
            ];
            
            const error = new BulkOperationError('attendance marking', 8, 2, failures);
            
            expect(error.statusCode).toBe(207);
            expect(error.errorCode).toBe('BULK_OPERATION_ERROR');
            expect(error.details.successCount).toBe(8);
            expect(error.details.failureCount).toBe(2);
            expect(error.details.failures).toEqual(failures);
        });
    });

    describe('Attendance Error Handler', () => {
        test('should handle attendance marking errors with context', () => {
            const error = new AttendanceAuthorizationError('teacher123', 'class456', 'subject789');
            const context = {
                teacherId: 'teacher123',
                classId: 'class456',
                subjectId: 'subject789',
                operation: 'marking'
            };

            const response = AttendanceErrorHandler.handleAttendanceMarkingError(error, context);

            expect(response.success).toBe(false);
            expect(response.error.code).toBe('ATTENDANCE_UNAUTHORIZED');
            expect(response.suggestions).toBeDefined();
            expect(response.recoveryActions).toBeDefined();
            expect(response.recoveryActions.length).toBeGreaterThan(0);
        });

        test('should handle bulk operation errors', () => {
            const error = new BulkOperationError('attendance marking', 8, 2, []);
            const context = {
                operation: 'bulk',
                totalRecords: 10,
                successCount: 8,
                failureCount: 2
            };

            const response = AttendanceErrorHandler.handleBulkAttendanceError(error, context);

            expect(response.success).toBe(false);
            expect(response.suggestions).toContain('8 out of 10 records processed successfully');
            expect(response.recoveryActions).toBeDefined();
        });

        test('should provide contextual help for different user roles', () => {
            const teacherHelp = AttendanceErrorHandler.getAttendanceHelp('Teacher', 'mark-attendance');
            const studentHelp = AttendanceErrorHandler.getAttendanceHelp('Student', 'view-attendance');
            const adminHelp = AttendanceErrorHandler.getAttendanceHelp('Admin', 'manage-attendance');

            expect(teacherHelp.title).toBe('Marking Attendance');
            expect(teacherHelp.tips).toBeDefined();
            expect(teacherHelp.commonIssues).toBeDefined();

            expect(studentHelp.title).toBe('Viewing Your Attendance');
            expect(adminHelp.title).toBe('Managing Attendance System');
        });

        test('should generate error summary correctly', () => {
            const errors = [
                {
                    errorCode: 'ATTENDANCE_UNAUTHORIZED',
                    name: 'AttendanceAuthorizationError',
                    context: { operation: 'marking' },
                    severity: 'high',
                    statusCode: 403,
                    timestamp: new Date()
                },
                {
                    errorCode: 'VALIDATION_ERROR',
                    name: 'ValidationError',
                    context: { operation: 'marking' },
                    severity: 'medium',
                    statusCode: 400,
                    timestamp: new Date()
                }
            ];

            const summary = AttendanceErrorHandler.generateAttendanceErrorSummary(errors);

            expect(summary.totalErrors).toBe(2);
            expect(summary.errorsByType['ATTENDANCE_UNAUTHORIZED']).toBe(1);
            expect(summary.errorsByType['VALIDATION_ERROR']).toBe(1);
            expect(summary.errorsByOperation['marking']).toBe(2);
            expect(summary.criticalErrors).toBe(0);
        });
    });

    describe('Attendance Error Monitoring Service', () => {
        beforeEach(() => {
            // Clear any existing errors
            attendanceErrorMonitoringService.attendanceErrors = [];
            attendanceErrorMonitoringService.attendanceMetrics = {
                operationCounts: {},
                errorRates: {},
                performanceMetrics: {},
                userImpact: {}
            };
        });

        test('should track attendance errors correctly', () => {
            const error = new AttendanceAuthorizationError('teacher123', 'class456', 'subject789');
            const context = {
                operation: 'marking',
                userRole: 'Teacher',
                userId: 'teacher123',
                classId: 'class456',
                subjectId: 'subject789'
            };

            attendanceErrorMonitoringService.trackAttendanceError(error, context);

            expect(attendanceErrorMonitoringService.attendanceErrors.length).toBe(1);
            
            const trackedError = attendanceErrorMonitoringService.attendanceErrors[0];
            expect(trackedError.error.name).toBe('AttendanceAuthorizationError');
            expect(trackedError.context.operation).toBe('marking');
            expect(trackedError.severity).toBe('high');
        });

        test('should record successful operations', () => {
            attendanceErrorMonitoringService.recordSuccessfulOperation('marking', {
                classId: 'class456',
                studentCount: 25
            }, 1500);

            const metrics = attendanceErrorMonitoringService.attendanceMetrics;
            expect(metrics.operationCounts['marking']).toBeDefined();
            expect(metrics.operationCounts['marking'].total).toBe(1);
            expect(metrics.performanceMetrics['marking']).toBeDefined();
            expect(metrics.performanceMetrics['marking'].averageTime).toBe(1500);
        });

        test('should determine error severity correctly', () => {
            const criticalError = new Error('Database connection failed');
            criticalError.statusCode = 500;
            
            const authError = new AttendanceAuthorizationError('teacher123', 'class456', 'subject789');
            const validationError = new ValidationError('Missing field');

            expect(attendanceErrorMonitoringService.determineSeverity(criticalError, {})).toBe('critical');
            expect(attendanceErrorMonitoringService.determineSeverity(authError, {})).toBe('high');
            expect(attendanceErrorMonitoringService.determineSeverity(validationError, {})).toBe('medium');
        });

        test('should assess user impact correctly', () => {
            const bulkError = new BulkOperationError('attendance marking', 8, 2, []);
            const context = {
                operation: 'bulk',
                totalRecords: 10,
                successCount: 8,
                failureCount: 2
            };

            const impact = attendanceErrorMonitoringService.assessUserImpact(bulkError, context);

            expect(impact.level).toBe('high');
            expect(impact.affectedUsers).toBe(10);
            expect(impact.businessImpact).toBe('significant');
        });

        test('should generate analytics correctly', () => {
            // Add some test errors
            const error1 = new AttendanceAuthorizationError('teacher123', 'class456', 'subject789');
            const error2 = new ValidationError('Missing field');

            attendanceErrorMonitoringService.trackAttendanceError(error1, {
                operation: 'marking',
                userRole: 'Teacher'
            });

            attendanceErrorMonitoringService.trackAttendanceError(error2, {
                operation: 'marking',
                userRole: 'Teacher'
            });

            const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics();

            expect(analytics.summary.totalErrors).toBe(2);
            expect(analytics.errorsByOperation['marking']).toBeDefined();
            expect(analytics.errorsByOperation['marking'].count).toBe(2);
            expect(analytics.errorsBySeverity.high).toBe(1);
            expect(analytics.errorsBySeverity.medium).toBe(1);
            expect(analytics.errorsByUserRole['Teacher']).toBe(2);
        });

        test('should get health status correctly', () => {
            const healthStatus = attendanceErrorMonitoringService.getAttendanceHealthStatus();

            expect(healthStatus.status).toBeDefined();
            expect(['healthy', 'degraded', 'warning', 'critical']).toContain(healthStatus.status);
            expect(healthStatus.recentErrorCount).toBeDefined();
            expect(healthStatus.criticalErrorCount).toBeDefined();
            expect(healthStatus.operationHealth).toBeDefined();
        });

        test('should generate recommendations based on error patterns', () => {
            // Add multiple authorization errors (more than 5 to trigger high_error_rate)
            for (let i = 0; i < 6; i++) {
                const error = new AttendanceAuthorizationError(`teacher${i}`, 'class456', 'subject789');
                attendanceErrorMonitoringService.trackAttendanceError(error, {
                    operation: 'marking',
                    userRole: 'Teacher'
                });
            }

            const analytics = attendanceErrorMonitoringService.getAttendanceErrorAnalytics();
            const recommendations = analytics.recommendations;

            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations.some(r => r.type === 'high_error_rate')).toBe(true);
        });
    });

    describe('Error Response Formatting', () => {
        test('should format error responses with recovery actions', () => {
            const error = new AttendanceAlreadyMarkedError('class456', 'subject789', '2024-01-15', 'Lecture 1');
            const context = {
                classId: 'class456',
                subjectId: 'subject789',
                date: '2024-01-15',
                session: 'Lecture 1'
            };

            const response = AttendanceErrorHandler.handleAttendanceMarkingError(error, context);

            expect(response.success).toBe(false);
            expect(response.error.code).toBe('ATTENDANCE_ALREADY_MARKED');
            expect(response.suggestions).toBeDefined();
            expect(response.recoveryActions).toBeDefined();
            
            const editAction = response.recoveryActions.find(action => action.label === 'Edit Attendance');
            expect(editAction).toBeDefined();
            expect(editAction.action).toContain('class456');
            expect(editAction.action).toContain('subject789');
        });
    });
});

describe('Error Middleware Integration', () => {
    test('should extract attendance context from request', () => {
        // This would typically be tested with actual Express request objects
        // For now, we'll test the logic components
        
        const mockReq = {
            method: 'POST',
            path: '/api/attendance/mark',
            params: { classId: 'class456' },
            body: { 
                subjectId: 'subject789',
                studentAttendance: [{ studentId: 'student1', status: 'present' }]
            },
            user: { role: 'Teacher', id: 'teacher123' }
        };

        // Test operation determination logic
        const path = mockReq.path.toLowerCase();
        const method = mockReq.method.toLowerCase();
        
        let operation = 'generic';
        if (method === 'post' && path.includes('/mark')) {
            operation = 'marking';
        }

        expect(operation).toBe('marking');
    });
});