const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import app components
const attendanceRoutes = require('../../routes/attendanceRoutes');
const { authMiddleware } = require('../../middleware/auth');

// Import models
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSummary = require('../../models/AttendanceSummary');
const AttendanceAuditLog = require('../../models/AttendanceAuditLog');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const Sclass = require('../../models/sclassSchema');
const Admin = require('../../models/adminSchema');

// Import test fixtures
const {
    mockIds,
    mockAdmin,
    mockTeachers,
    mockStudents,
    mockClasses,
    mockSubjects,
    mockAttendanceRecords,
    mockAttendanceSummaries
} = require('../fixtures');

describe('Attendance API Integration Tests', () => {
    let mongoServer;
    let app;
    let adminToken;
    let teacherToken;
    let studentToken;
    let unauthorizedTeacherToken;

    // Test data references
    let testAdmin;
    let testTeacher;
    let testStudent;
    let testClass;
    let testSubject;

    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri);

        // Create Express app for testing
        app = express();
        app.use(express.json());
        app.use('/api/attendance', attendanceRoutes);

        // Create test data
        await setupTestData();
        
        // Generate JWT tokens for testing
        adminToken = generateToken(testAdmin._id, 'Admin');
        teacherToken = generateToken(testTeacher._id, 'Teacher');
        studentToken = generateToken(testStudent._id, 'Student');
        unauthorizedTeacherToken = generateToken(mockIds.teacher2, 'Teacher');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear attendance-related collections before each test
        await AttendanceRecord.deleteMany({});
        await AttendanceSummary.deleteMany({});
        await AttendanceAuditLog.deleteMany({});
    });

    // Helper function to generate JWT tokens
    function generateToken(userId, role) {
        return jwt.sign(
            { id: userId, role: role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    }

    // Setup test data in database
    async function setupTestData() {
        // Create admin
        testAdmin = await Admin.create(mockAdmin);

        // Create classes
        testClass = await Sclass.create(mockClasses[0]);

        // Create subjects
        testSubject = await Subject.create(mockSubjects[0]);

        // Create teacher
        testTeacher = await Teacher.create(mockTeachers[0]);

        // Create students
        testStudent = await Student.create(mockStudents[0]);
        await Student.create(mockStudents[1]);
    }

    describe('GET /api/attendance/class/:classId/students', () => {
        it('should get students for attendance marking with valid teacher', async () => {
            const response = await request(app)
                .get(`/api/attendance/class/${testClass._id}/students`)
                .query({ subjectId: testSubject._id })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.message).toBe('Students retrieved successfully');
        });

        it('should reject request without subjectId', async () => {
            const response = await request(app)
                .get(`/api/attendance/class/${testClass._id}/students`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Subject ID is required');
        });

        it('should reject unauthorized teacher', async () => {
            const response = await request(app)
                .get(`/api/attendance/class/${testClass._id}/students`)
                .query({ subjectId: testSubject._id })
                .set('Authorization', `Bearer ${unauthorizedTeacherToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject request without authentication', async () => {
            await request(app)
                .get(`/api/attendance/class/${testClass._id}/students`)
                .query({ subjectId: testSubject._id })
                .expect(401);
        });
    });

    describe('POST /api/attendance/mark', () => {
        const validAttendanceData = {
            classId: mockIds.class1,
            subjectId: mockIds.subject1,
            date: '2023-10-15',
            session: 'Lecture 1',
            studentAttendance: [
                { studentId: mockIds.student1, status: 'present' },
                { studentId: mockIds.student2, status: 'absent' }
            ]
        };

        it('should mark attendance successfully with valid data', async () => {
            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validAttendanceData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBeGreaterThan(0);
            expect(response.body.message).toContain('Attendance marked successfully');

            // Verify records were created in database
            const records = await AttendanceRecord.find({
                classId: validAttendanceData.classId,
                subjectId: validAttendanceData.subjectId,
                date: new Date(validAttendanceData.date)
            });
            expect(records.length).toBe(validAttendanceData.studentAttendance.length);
        });

        it('should reject request with missing required fields', async () => {
            const incompleteData = {
                classId: mockIds.class1,
                subjectId: mockIds.subject1
                // Missing date, session, studentAttendance
            };

            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should reject unauthorized teacher', async () => {
            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${unauthorizedTeacherToken}`)
                .send(validAttendanceData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle invalid student IDs gracefully', async () => {
            const invalidData = {
                ...validAttendanceData,
                studentAttendance: [
                    { studentId: 'invalid-student-id', status: 'present' }
                ]
            };

            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(invalidData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.failureCount).toBeGreaterThan(0);
        });
    });

    describe('PUT /api/attendance/:id', () => {
        let attendanceRecord;

        beforeEach(async () => {
            // Create a test attendance record
            attendanceRecord = await AttendanceRecord.create({
                classId: testClass._id,
                subjectId: testSubject._id,
                teacherId: testTeacher._id,
                studentId: testStudent._id,
                date: new Date('2023-10-15'),
                session: 'Lecture 1',
                status: 'present',
                markedBy: testTeacher._id,
                markedAt: new Date(),
                schoolId: testAdmin._id
            });
        });

        it('should update attendance record successfully', async () => {
            const updateData = {
                status: 'late',
                reason: 'Student arrived late'
            };

            const response = await request(app)
                .put(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('late');
            expect(response.body.message).toBe('Attendance updated successfully');

            // Verify audit log was created
            const auditLogs = await AttendanceAuditLog.find({
                recordId: attendanceRecord._id
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        it('should reject update with invalid record ID', async () => {
            const response = await request(app)
                .put('/api/attendance/invalid-id')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ status: 'late' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should allow admin to update any record', async () => {
            const updateData = {
                status: 'excused',
                reason: 'Medical leave'
            };

            const response = await request(app)
                .put(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('excused');
        });
    });

    describe('GET /api/attendance/records', () => {
        beforeEach(async () => {
            // Create test attendance records
            await AttendanceRecord.create([
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: testStudent._id,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'present',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                },
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: testStudent._id,
                    date: new Date('2023-10-16'),
                    session: 'Lecture 2',
                    status: 'absent',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                }
            ]);
        });

        it('should get attendance records with filters', async () => {
            const response = await request(app)
                .get('/api/attendance/records')
                .query({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    status: 'present'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.records).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.message).toBe('Attendance records retrieved successfully');
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/attendance/records')
                .query({
                    page: 1,
                    limit: 1,
                    classId: testClass._id
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.records.length).toBeLessThanOrEqual(1);
            expect(response.body.data.pagination.currentPage).toBe(1);
            expect(response.body.data.pagination.limit).toBe(1);
        });

        it('should allow student to view only their own records', async () => {
            const response = await request(app)
                .get('/api/attendance/records')
                .query({ studentId: testStudent._id })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.records).toBeInstanceOf(Array);
        });
    });

    describe('DELETE /api/attendance/:id', () => {
        let attendanceRecord;

        beforeEach(async () => {
            attendanceRecord = await AttendanceRecord.create({
                classId: testClass._id,
                subjectId: testSubject._id,
                teacherId: testTeacher._id,
                studentId: testStudent._id,
                date: new Date('2023-10-15'),
                session: 'Lecture 1',
                status: 'present',
                markedBy: testTeacher._id,
                markedAt: new Date(),
                schoolId: testAdmin._id
            });
        });

        it('should allow admin to delete attendance record', async () => {
            const response = await request(app)
                .delete(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Duplicate entry' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Attendance record deleted successfully');

            // Verify record was deleted
            const deletedRecord = await AttendanceRecord.findById(attendanceRecord._id);
            expect(deletedRecord).toBeNull();
        });

        it('should reject teacher deletion request', async () => {
            const response = await request(app)
                .delete(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ reason: 'Test deletion' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can delete attendance records');
        });

        it('should reject student deletion request', async () => {
            const response = await request(app)
                .delete(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ reason: 'Test deletion' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/session-summary/:classId/:subjectId', () => {
        beforeEach(async () => {
            // Create test attendance records for session summary
            await AttendanceRecord.create([
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: testStudent._id,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'present',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                },
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: mockIds.student2,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'absent',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                }
            ]);
        });

        it('should get session summary successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/session-summary/${testClass._id}/${testSubject._id}`)
                .query({
                    date: '2023-10-15',
                    session: 'Lecture 1'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalStudents');
            expect(response.body.data).toHaveProperty('presentCount');
            expect(response.body.data).toHaveProperty('absentCount');
            expect(response.body.message).toBe('Session summary retrieved successfully');
        });

        it('should reject request without required query parameters', async () => {
            const response = await request(app)
                .get(`/api/attendance/session-summary/${testClass._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Date and session are required');
        });
    });
});