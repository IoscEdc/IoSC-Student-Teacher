const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import app components
const attendanceRoutes = require('../../routes/attendanceRoutes');

// Import models
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSummary = require('../../models/AttendanceSummary');
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
    mockAttendanceSummaries
} = require('../fixtures');

describe('Attendance Analytics Integration Tests', () => {
    let mongoServer;
    let app;
    let adminToken;
    let teacherToken;
    let studentToken;
    let unauthorizedStudentToken;

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
        unauthorizedStudentToken = generateToken('unauthorized-student-id', 'Student');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear attendance-related collections before each test
        await AttendanceRecord.deleteMany({});
        await AttendanceSummary.deleteMany({});
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

    // Helper function to create test attendance data
    async function createTestAttendanceData() {
        const attendanceRecords = [
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
            },
            {
                classId: testClass._id,
                subjectId: testSubject._id,
                teacherId: testTeacher._id,
                studentId: testStudent._id,
                date: new Date('2023-10-17'),
                session: 'Lecture 3',
                status: 'late',
                markedBy: testTeacher._id,
                markedAt: new Date(),
                schoolId: testAdmin._id
            }
        ];

        await AttendanceRecord.create(attendanceRecords);

        // Create attendance summary
        const attendanceSummary = {
            studentId: testStudent._id,
            subjectId: testSubject._id,
            classId: testClass._id,
            totalSessions: 10,
            presentCount: 6,
            absentCount: 2,
            lateCount: 2,
            excusedCount: 0,
            attendancePercentage: 60.0,
            lastUpdated: new Date(),
            schoolId: testAdmin._id
        };

        await AttendanceSummary.create(attendanceSummary);
    }

    describe('GET /api/attendance/summary/student/:studentId', () => {
        beforeEach(async () => {
            await createTestAttendanceData();
        });

        it('should get student attendance summary successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('summaries');
            expect(response.body.data.summaries).toBeInstanceOf(Array);
            expect(response.body.message).toBe('Student attendance summary retrieved successfully');
        });

        it('should filter by subject when provided', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .query({ subjectId: testSubject._id })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summaries).toBeInstanceOf(Array);
        });

        it('should filter by class when provided', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .query({ classId: testClass._id })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summaries).toBeInstanceOf(Array);
        });

        it('should allow teacher to view assigned student summary', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summaries).toBeInstanceOf(Array);
        });

        it('should allow admin to view any student summary', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summaries).toBeInstanceOf(Array);
        });

        it('should reject unauthorized student access', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/student/${testStudent._id}`)
                .set('Authorization', `Bearer ${unauthorizedStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/summary/class/:classId/subject/:subjectId', () => {
        beforeEach(async () => {
            await createTestAttendanceData();
        });

        it('should get class attendance summary successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('classSummary');
            expect(response.body.data).toHaveProperty('studentSummaries');
            expect(response.body.message).toBe('Class attendance summary retrieved successfully');
        });

        it('should include student details by default', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.studentSummaries).toBeInstanceOf(Array);
        });

        it('should exclude student details when requested', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .query({ includeStudentDetails: 'false' })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('classSummary');
        });

        it('should support sorting options', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .query({ 
                    sortBy: 'attendancePercentage',
                    sortOrder: 'asc'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.studentSummaries).toBeInstanceOf(Array);
        });

        it('should allow admin to view any class summary', async () => {
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('classSummary');
        });

        it('should reject unauthorized teacher access', async () => {
            const unauthorizedTeacherToken = generateToken('unauthorized-teacher-id', 'Teacher');
            
            const response = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${unauthorizedTeacherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/analytics/trends/:studentId/:subjectId', () => {
        beforeEach(async () => {
            await createTestAttendanceData();
        });

        it('should get attendance trends successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('trends');
            expect(response.body.data.trends).toBeInstanceOf(Array);
            expect(response.body.message).toBe('Attendance trends retrieved successfully');
        });

        it('should support date range filtering', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent._id}/${testSubject._id}`)
                .query({
                    startDate: '2023-10-01',
                    endDate: '2023-10-31'
                })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.trends).toBeInstanceOf(Array);
        });

        it('should allow teacher to view assigned student trends', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.trends).toBeInstanceOf(Array);
        });

        it('should allow admin to view any student trends', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.trends).toBeInstanceOf(Array);
        });

        it('should reject unauthorized student access', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${unauthorizedStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/analytics/school/:schoolId', () => {
        beforeEach(async () => {
            await createTestAttendanceData();
        });

        it('should get school analytics successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('overallStats');
            expect(response.body.data).toHaveProperty('attendanceRate');
            expect(response.body.message).toBe('School analytics retrieved successfully');
        });

        it('should support date range filtering', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .query({
                    startDate: '2023-10-01',
                    endDate: '2023-10-31'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('overallStats');
        });

        it('should include class breakdown when requested', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .query({ includeClassBreakdown: 'true' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('classBreakdown');
        });

        it('should include subject breakdown when requested', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .query({ includeSubjectBreakdown: 'true' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('subjectBreakdown');
        });

        it('should reject non-admin users', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can view school-wide analytics');
        });

        it('should reject student users', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/analytics/alerts/:classId', () => {
        beforeEach(async () => {
            await createTestAttendanceData();
            
            // Create additional summary with low attendance
            await AttendanceSummary.create({
                studentId: mockIds.student2,
                subjectId: testSubject._id,
                classId: testClass._id,
                totalSessions: 10,
                presentCount: 3,
                absentCount: 7,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 30.0,
                lastUpdated: new Date(),
                schoolId: testAdmin._id
            });
        });

        it('should get low attendance alerts successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('alerts');
            expect(response.body.data.alerts).toBeInstanceOf(Array);
            expect(response.body.message).toBe('Low attendance alerts retrieved successfully');
        });

        it('should filter by subject when provided', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .query({ subjectId: testSubject._id })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.alerts).toBeInstanceOf(Array);
        });

        it('should use custom threshold when provided', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .query({ threshold: 50 })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.alerts).toBeInstanceOf(Array);
        });

        it('should use default threshold of 75% when not provided', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.alerts).toBeInstanceOf(Array);
        });

        it('should allow admin to view alerts for any class', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.alerts).toBeInstanceOf(Array);
        });

        it('should reject unauthorized teacher access', async () => {
            const unauthorizedTeacherToken = generateToken('unauthorized-teacher-id', 'Teacher');
            
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .set('Authorization', `Bearer ${unauthorizedTeacherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject student access', async () => {
            const response = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});