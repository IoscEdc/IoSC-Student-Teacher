const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import app components
const attendanceRoutes = require('../../routes/attendanceRoutes');

// Import models
const AttendanceRecord = require('../../models/attendanceRecordSchema');
const AttendanceSummary = require('../../models/attendanceSummarySchema');
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

describe('Attendance Performance Integration Tests', () => {
    let mongoServer;
    let app;
    let adminToken;
    let teacherToken;

    // Test data references
    let testAdmin;
    let testTeacher;
    let testClass;
    let testSubject;
    let testStudents;

    // Performance thresholds (in milliseconds)
    const PERFORMANCE_THRESHOLDS = {
        BULK_MARK_100_STUDENTS: 5000,
        BULK_MARK_500_STUDENTS: 15000,
        BULK_ASSIGN_1000_STUDENTS: 10000,
        ANALYTICS_LARGE_DATASET: 8000,
        PAGINATION_LARGE_DATASET: 3000,
        CONCURRENT_OPERATIONS: 10000
    };

    beforeAll(async () => {
        // Start in-memory MongoDB with increased memory
        mongoServer = await MongoMemoryServer.create({
            instance: {
                dbName: 'attendance-performance-test',
                storageEngine: 'wiredTiger'
            }
        });
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        // Create Express app for testing
        app = express();
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ limit: '50mb', extended: true }));
        app.use('/api/attendance', attendanceRoutes);

        // Create test data
        await setupTestData();
        
        // Generate JWT tokens for testing
        adminToken = generateToken(testAdmin._id, 'Admin');
        teacherToken = generateToken(testTeacher._id, 'Teacher');
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
            { expiresIn: '2h' }
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

        // Create large number of students for performance testing
        const studentsData = [];
        for (let i = 1; i <= 1000; i++) {
            studentsData.push({
                name: `Test Student ${i}`,
                rollNum: i,
                universityId: `CSE2021${String(i).padStart(3, '0')}`,
                password: 'hashedpassword',
                sclassName: testClass._id,
                school: testAdmin._id,
                role: 'Student',
                enrolledSubjects: [{
                    subjectId: testSubject._id,
                    enrolledAt: new Date('2023-09-01')
                }]
            });
        }

        // Insert students in batches to avoid memory issues
        const batchSize = 100;
        testStudents = [];
        for (let i = 0; i < studentsData.length; i += batchSize) {
            const batch = studentsData.slice(i, i + batchSize);
            const createdBatch = await Student.create(batch);
            testStudents.push(...createdBatch);
        }

        console.log(`Created ${testStudents.length} test students for performance testing`);
    }

    // Helper function to measure execution time
    function measureTime(startTime) {
        const endTime = process.hrtime(startTime);
        return endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
    }

    describe('Bulk Attendance Marking Performance', () => {
        it('should mark attendance for 100 students within performance threshold', async () => {
            const startTime = process.hrtime();
            
            const studentAttendance = testStudents.slice(0, 100).map((student, index) => ({
                studentId: student._id,
                status: index % 4 === 0 ? 'absent' : 
                       index % 4 === 1 ? 'late' : 
                       index % 4 === 2 ? 'excused' : 'present'
            }));

            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    date: '2023-10-15',
                    session: 'Lecture 1',
                    studentAttendance
                })
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(100);
            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_MARK_100_STUDENTS);

            console.log(`Bulk marking 100 students took ${executionTime.toFixed(2)}ms`);

            // Verify records were created
            const recordCount = await AttendanceRecord.countDocuments({
                classId: testClass._id,
                subjectId: testSubject._id,
                date: new Date('2023-10-15')
            });
            expect(recordCount).toBe(100);
        });

        it('should mark attendance for 500 students within performance threshold', async () => {
            const startTime = process.hrtime();
            
            const studentAttendance = testStudents.slice(0, 500).map((student, index) => ({
                studentId: student._id,
                status: index % 4 === 0 ? 'absent' : 
                       index % 4 === 1 ? 'late' : 
                       index % 4 === 2 ? 'excused' : 'present'
            }));

            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    date: '2023-10-16',
                    session: 'Lecture 2',
                    studentAttendance
                })
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(500);
            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_MARK_500_STUDENTS);

            console.log(`Bulk marking 500 students took ${executionTime.toFixed(2)}ms`);

            // Verify records were created
            const recordCount = await AttendanceRecord.countDocuments({
                classId: testClass._id,
                subjectId: testSubject._id,
                date: new Date('2023-10-16')
            });
            expect(recordCount).toBe(500);
        });

        it('should handle multiple bulk marking operations efficiently', async () => {
            const startTime = process.hrtime();
            
            const bulkOperations = [];
            const dates = ['2023-10-17', '2023-10-18', '2023-10-19'];
            const sessions = ['Lecture 1', 'Lecture 2', 'Lecture 3'];

            for (let i = 0; i < 3; i++) {
                const studentAttendance = testStudents.slice(0, 50).map((student, index) => ({
                    studentId: student._id,
                    status: (index + i) % 3 === 0 ? 'absent' : 'present'
                }));

                bulkOperations.push(
                    request(app)
                        .post('/api/attendance/bulk/mark')
                        .set('Authorization', `Bearer ${teacherToken}`)
                        .send({
                            attendanceRecords: [{
                                classId: testClass._id,
                                subjectId: testSubject._id,
                                date: dates[i],
                                session: sessions[i],
                                studentAttendance
                            }]
                        })
                );
            }

            const responses = await Promise.all(bulkOperations);
            const executionTime = measureTime(startTime);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS);
            console.log(`Multiple bulk operations took ${executionTime.toFixed(2)}ms`);
        });
    });

    describe('Bulk Student Assignment Performance', () => {
        it('should assign 1000 students by pattern within performance threshold', async () => {
            const startTime = process.hrtime();

            const response = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    pattern: 'CSE2021*',
                    targetClassId: testClass._id,
                    subjectIds: [testSubject._id],
                    schoolId: testAdmin._id
                })
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBeGreaterThan(900); // Allow for some pattern mismatches
            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_ASSIGN_1000_STUDENTS);

            console.log(`Bulk assignment of 1000 students took ${executionTime.toFixed(2)}ms`);
        });

        it('should handle bulk student transfer efficiently', async () => {
            // Create another class for transfer
            const targetClass = await Sclass.create({
                sclassName: 'CSE-B',
                school: testAdmin._id
            });

            const startTime = process.hrtime();
            const studentIds = testStudents.slice(0, 100).map(s => s._id);

            const response = await request(app)
                .put('/api/attendance/bulk/transfer')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentIds,
                    fromClassId: testClass._id,
                    toClassId: targetClass._id,
                    subjectIds: [testSubject._id],
                    migrateAttendance: false
                })
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(100);
            expect(executionTime).toBeLessThan(5000); // 5 second threshold for transfers

            console.log(`Bulk transfer of 100 students took ${executionTime.toFixed(2)}ms`);
        });
    });

    describe('Large Dataset Query Performance', () => {
        beforeEach(async () => {
            // Create large dataset for testing
            const attendanceRecords = [];
            const dates = [];
            
            // Generate 30 days of attendance data
            for (let day = 1; day <= 30; day++) {
                dates.push(new Date(`2023-10-${String(day).padStart(2, '0')}`));
            }

            // Create attendance records for first 200 students across 30 days
            for (const date of dates) {
                for (let i = 0; i < 200; i++) {
                    attendanceRecords.push({
                        classId: testClass._id,
                        subjectId: testSubject._id,
                        teacherId: testTeacher._id,
                        studentId: testStudents[i]._id,
                        date: date,
                        session: 'Lecture 1',
                        status: Math.random() > 0.2 ? 'present' : 'absent',
                        markedBy: testTeacher._id,
                        markedAt: date,
                        schoolId: testAdmin._id
                    });
                }
            }

            // Insert in batches
            const batchSize = 1000;
            for (let i = 0; i < attendanceRecords.length; i += batchSize) {
                const batch = attendanceRecords.slice(i, i + batchSize);
                await AttendanceRecord.create(batch);
            }

            console.log(`Created ${attendanceRecords.length} attendance records for performance testing`);
        });

        it('should retrieve attendance records with pagination efficiently', async () => {
            const startTime = process.hrtime();

            const response = await request(app)
                .get('/api/attendance/records')
                .query({
                    classId: testClass._id,
                    page: 1,
                    limit: 100,
                    sortBy: 'date',
                    sortOrder: 'desc'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.records).toHaveLength(100);
            expect(response.body.data.pagination).toBeDefined();
            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGINATION_LARGE_DATASET);

            console.log(`Paginated query (100 records) took ${executionTime.toFixed(2)}ms`);
        });

        it('should filter large dataset efficiently', async () => {
            const startTime = process.hrtime();

            const response = await request(app)
                .get('/api/attendance/records')
                .query({
                    classId: testClass._id,
                    status: 'present',
                    startDate: '2023-10-01',
                    endDate: '2023-10-15',
                    limit: 500
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data.records).toBeInstanceOf(Array);
            expect(executionTime).toBeLessThan(4000); // 4 second threshold for filtered queries

            console.log(`Filtered query took ${executionTime.toFixed(2)}ms`);
        });

        it('should generate school analytics for large dataset efficiently', async () => {
            const startTime = process.hrtime();

            const response = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .query({
                    startDate: '2023-10-01',
                    endDate: '2023-10-30',
                    includeClassBreakdown: 'true',
                    includeSubjectBreakdown: 'true'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const executionTime = measureTime(startTime);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('overallStats');
            expect(response.body.data).toHaveProperty('classBreakdown');
            expect(response.body.data).toHaveProperty('subjectBreakdown');
            expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYTICS_LARGE_DATASET);

            console.log(`School analytics for large dataset took ${executionTime.toFixed(2)}ms`);
        });

        it('should handle concurrent read operations efficiently', async () => {
            const startTime = process.hrtime();

            const concurrentOperations = [
                // Multiple students checking their attendance
                ...testStudents.slice(0, 10).map(student =>
                    request(app)
                        .get('/api/attendance/records')
                        .query({ studentId: student._id, limit: 50 })
                        .set('Authorization', `Bearer ${generateToken(student._id, 'Student')}`)
                ),
                // Teacher checking class summary
                request(app)
                    .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                    .set('Authorization', `Bearer ${teacherToken}`),
                // Admin checking analytics
                request(app)
                    .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            ];

            const responses = await Promise.all(concurrentOperations);
            const executionTime = measureTime(startTime);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            expect(executionTime).toBeLessThan(8000); // 8 second threshold for concurrent operations
            console.log(`${concurrentOperations.length} concurrent read operations took ${executionTime.toFixed(2)}ms`);
        });
    });

    describe('Memory and Resource Usage', () => {
        it('should handle large payload without memory issues', async () => {
            const startTime = process.hrtime();
            const initialMemory = process.memoryUsage();

            // Create large attendance payload
            const studentAttendance = testStudents.slice(0, 800).map(student => ({
                studentId: student._id,
                status: 'present'
            }));

            const response = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    date: '2023-10-20',
                    session: 'Lecture 1',
                    studentAttendance
                })
                .expect(200);

            const executionTime = measureTime(startTime);
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(800);
            expect(executionTime).toBeLessThan(20000); // 20 second threshold for very large operations
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

            console.log(`Large payload (800 students) took ${executionTime.toFixed(2)}ms`);
            console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        it('should maintain consistent performance across multiple operations', async () => {
            const operationTimes = [];

            // Perform 5 identical operations and measure consistency
            for (let i = 0; i < 5; i++) {
                const startTime = process.hrtime();
                
                const studentAttendance = testStudents.slice(0, 100).map(student => ({
                    studentId: student._id,
                    status: 'present'
                }));

                await request(app)
                    .post('/api/attendance/mark')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        classId: testClass._id,
                        subjectId: testSubject._id,
                        date: `2023-10-${21 + i}`,
                        session: 'Lecture 1',
                        studentAttendance
                    })
                    .expect(200);

                operationTimes.push(measureTime(startTime));
            }

            const avgTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
            const maxTime = Math.max(...operationTimes);
            const minTime = Math.min(...operationTimes);
            const variance = maxTime - minTime;

            console.log(`Operation times: ${operationTimes.map(t => t.toFixed(2)).join(', ')}ms`);
            console.log(`Average: ${avgTime.toFixed(2)}ms, Variance: ${variance.toFixed(2)}ms`);

            // Variance should be less than 50% of average time
            expect(variance).toBeLessThan(avgTime * 0.5);
            expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_MARK_100_STUDENTS);
        });
    });
});