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
    mockSubjects
} = require('../fixtures');

describe('Attendance Bulk Operations Integration Tests', () => {
    let mongoServer;
    let app;
    let adminToken;
    let teacherToken;
    let unauthorizedToken;

    // Test data references
    let testAdmin;
    let testTeacher;
    let testStudents;
    let testClasses;
    let testSubjects;

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
        unauthorizedToken = generateToken('unauthorized-user-id', 'Student');
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
        testClasses = await Sclass.create(mockClasses);

        // Create subjects
        testSubjects = await Subject.create(mockSubjects);

        // Create teacher
        testTeacher = await Teacher.create(mockTeachers[0]);

        // Create students with university ID patterns
        const studentsWithPatterns = [
            { ...mockStudents[0], universityId: 'CSE2021001' },
            { ...mockStudents[1], universityId: 'CSE2021002' },
            { ...mockStudents[2], universityId: 'ECE2021001' }
        ];
        testStudents = await Student.create(studentsWithPatterns);
    }

    describe('POST /api/attendance/bulk/assign-students', () => {
        const validAssignmentData = {
            pattern: 'CSE2021*',
            targetClassId: mockIds.class1,
            subjectIds: [mockIds.subject1],
            schoolId: mockIds.school
        };

        it('should assign students by pattern successfully', async () => {
            const response = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validAssignmentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBeGreaterThan(0);
            expect(response.body.message).toContain('Bulk assignment completed');

            // Verify students were assigned
            const assignedStudents = await Student.find({
                universityId: { $regex: /^CSE2021/ },
                sclassName: validAssignmentData.targetClassId
            });
            expect(assignedStudents.length).toBeGreaterThan(0);
        });

        it('should reject request with missing required fields', async () => {
            const incompleteData = {
                pattern: 'CSE2021*'
                // Missing targetClassId, schoolId
            };

            const response = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should reject non-admin users', async () => {
            const response = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validAssignmentData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can perform bulk student assignments');
        });

        it('should handle patterns with no matching students', async () => {
            const noMatchData = {
                ...validAssignmentData,
                pattern: 'NOMATCH*'
            };

            const response = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(noMatchData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(0);
        });
    });

    describe('POST /api/attendance/bulk/mark', () => {
        const validBulkMarkData = {
            attendanceRecords: [
                {
                    classId: mockIds.class1,
                    subjectId: mockIds.subject1,
                    date: '2023-10-15',
                    session: 'Lecture 1',
                    studentAttendance: [
                        { studentId: mockIds.student1, status: 'present' },
                        { studentId: mockIds.student2, status: 'absent' }
                    ]
                },
                {
                    classId: mockIds.class1,
                    subjectId: mockIds.subject1,
                    date: '2023-10-16',
                    session: 'Lecture 2',
                    studentAttendance: [
                        { studentId: mockIds.student1, status: 'late' },
                        { studentId: mockIds.student2, status: 'present' }
                    ]
                }
            ]
        };

        it('should mark bulk attendance successfully', async () => {
            const response = await request(app)
                .post('/api/attendance/bulk/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validBulkMarkData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summary.totalRecordsProcessed).toBe(2);
            expect(response.body.data.summary.totalStudentsSuccess).toBeGreaterThan(0);
            expect(response.body.message).toContain('Bulk attendance marking completed');

            // Verify records were created
            const records = await AttendanceRecord.find({
                classId: mockIds.class1,
                subjectId: mockIds.subject1
            });
            expect(records.length).toBeGreaterThan(0);
        });

        it('should reject request with invalid data structure', async () => {
            const invalidData = {
                attendanceRecords: 'not-an-array'
            };

            const response = await request(app)
                .post('/api/attendance/bulk/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('attendanceRecords array is required');
        });

        it('should handle partial failures gracefully', async () => {
            const mixedData = {
                attendanceRecords: [
                    {
                        classId: mockIds.class1,
                        subjectId: mockIds.subject1,
                        date: '2023-10-15',
                        session: 'Lecture 1',
                        studentAttendance: [
                            { studentId: mockIds.student1, status: 'present' }
                        ]
                    },
                    {
                        classId: 'invalid-class-id',
                        subjectId: mockIds.subject1,
                        date: '2023-10-16',
                        session: 'Lecture 2',
                        studentAttendance: [
                            { studentId: mockIds.student1, status: 'present' }
                        ]
                    }
                ]
            };

            const response = await request(app)
                .post('/api/attendance/bulk/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(mixedData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.results).toHaveLength(2);
            expect(response.body.data.summary.totalStudentsFailure).toBeGreaterThan(0);
        });

        it('should allow admin to mark bulk attendance', async () => {
            const response = await request(app)
                .post('/api/attendance/bulk/mark')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validBulkMarkData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summary.totalRecordsProcessed).toBe(2);
        });
    });

    describe('PUT /api/attendance/bulk/transfer', () => {
        const validTransferData = {
            studentIds: [mockIds.student1, mockIds.student2],
            fromClassId: mockIds.class1,
            toClassId: mockIds.class2,
            subjectIds: [mockIds.subject1],
            migrateAttendance: true
        };

        beforeEach(async () => {
            // Create some attendance records for transfer testing
            await AttendanceRecord.create([
                {
                    classId: mockIds.class1,
                    subjectId: mockIds.subject1,
                    teacherId: mockIds.teacher1,
                    studentId: mockIds.student1,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'present',
                    markedBy: mockIds.teacher1,
                    markedAt: new Date(),
                    schoolId: mockIds.school
                }
            ]);
        });

        it('should transfer students successfully', async () => {
            const response = await request(app)
                .put('/api/attendance/bulk/transfer')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validTransferData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBeGreaterThan(0);
            expect(response.body.message).toContain('Student transfer completed');
        });

        it('should reject request with missing required fields', async () => {
            const incompleteData = {
                studentIds: [mockIds.student1]
                // Missing fromClassId, toClassId
            };

            const response = await request(app)
                .put('/api/attendance/bulk/transfer')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should reject non-admin users', async () => {
            const response = await request(app)
                .put('/api/attendance/bulk/transfer')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validTransferData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can perform student transfers');
        });

        it('should handle transfer without attendance migration', async () => {
            const transferWithoutMigration = {
                ...validTransferData,
                migrateAttendance: false
            };

            const response = await request(app)
                .put('/api/attendance/bulk/transfer')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(transferWithoutMigration)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('PUT /api/attendance/bulk/reassign-teacher', () => {
        const validReassignmentData = {
            teacherId: mockIds.teacher1,
            newAssignments: [
                { subjectId: mockIds.subject1, classId: mockIds.class1 },
                { subjectId: mockIds.subject2, classId: mockIds.class2 }
            ]
        };

        it('should reassign teacher successfully', async () => {
            const response = await request(app)
                .put('/api/attendance/bulk/reassign-teacher')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validReassignmentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Teacher reassignment completed successfully');
        });

        it('should reject request with missing required fields', async () => {
            const incompleteData = {
                teacherId: mockIds.teacher1
                // Missing newAssignments
            };

            const response = await request(app)
                .put('/api/attendance/bulk/reassign-teacher')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should reject non-admin users', async () => {
            const response = await request(app)
                .put('/api/attendance/bulk/reassign-teacher')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(validReassignmentData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can reassign teachers');
        });

        it('should handle invalid teacher ID', async () => {
            const invalidData = {
                teacherId: 'invalid-teacher-id',
                newAssignments: [
                    { subjectId: mockIds.subject1, classId: mockIds.class1 }
                ]
            };

            const response = await request(app)
                .put('/api/attendance/bulk/reassign-teacher')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/attendance/bulk/stats/:schoolId', () => {
        beforeEach(async () => {
            // Create some test data for statistics
            await AttendanceRecord.create([
                {
                    classId: mockIds.class1,
                    subjectId: mockIds.subject1,
                    teacherId: mockIds.teacher1,
                    studentId: mockIds.student1,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'present',
                    markedBy: mockIds.teacher1,
                    markedAt: new Date(),
                    schoolId: mockIds.school
                }
            ]);
        });

        it('should get bulk operation statistics successfully', async () => {
            const response = await request(app)
                .get(`/api/attendance/bulk/stats/${mockIds.school}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalOperations');
            expect(response.body.message).toBe('Bulk operation statistics retrieved successfully');
        });

        it('should support date range filtering', async () => {
            const response = await request(app)
                .get(`/api/attendance/bulk/stats/${mockIds.school}`)
                .query({
                    startDate: '2023-10-01',
                    endDate: '2023-10-31'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should reject non-admin users', async () => {
            const response = await request(app)
                .get(`/api/attendance/bulk/stats/${mockIds.school}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only administrators can view bulk operation statistics');
        });

        it('should handle invalid school ID', async () => {
            const response = await request(app)
                .get('/api/attendance/bulk/stats/invalid-school-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});