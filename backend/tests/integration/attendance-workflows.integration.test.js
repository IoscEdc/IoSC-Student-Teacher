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
    mockSubjects
} = require('../fixtures');

describe('Attendance End-to-End Workflow Tests', () => {
    let mongoServer;
    let app;
    let adminToken;
    let teacherToken;
    let studentToken;

    // Test data references
    let testAdmin;
    let testTeacher;
    let testStudent1;
    let testStudent2;
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
        studentToken = generateToken(testStudent1._id, 'Student');
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
        testStudent1 = await Student.create(mockStudents[0]);
        testStudent2 = await Student.create(mockStudents[1]);
    }

    describe('Complete Teacher Workflow: Mark, View, and Edit Attendance', () => {
        it('should complete full teacher attendance workflow', async () => {
            // Step 1: Teacher gets students for attendance marking
            const studentsResponse = await request(app)
                .get(`/api/attendance/class/${testClass._id}/students`)
                .query({ subjectId: testSubject._id })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(studentsResponse.body.success).toBe(true);
            expect(studentsResponse.body.data).toBeInstanceOf(Array);
            const students = studentsResponse.body.data;

            // Step 2: Teacher marks attendance for the session
            const attendanceData = {
                classId: testClass._id,
                subjectId: testSubject._id,
                date: '2023-10-15',
                session: 'Lecture 1',
                studentAttendance: [
                    { studentId: testStudent1._id, status: 'present' },
                    { studentId: testStudent2._id, status: 'absent' }
                ]
            };

            const markResponse = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(attendanceData)
                .expect(200);

            expect(markResponse.body.success).toBe(true);
            expect(markResponse.body.data.successCount).toBe(2);

            // Step 3: Teacher views session summary
            const summaryResponse = await request(app)
                .get(`/api/attendance/session-summary/${testClass._id}/${testSubject._id}`)
                .query({
                    date: '2023-10-15',
                    session: 'Lecture 1'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(summaryResponse.body.success).toBe(true);
            expect(summaryResponse.body.data.totalStudents).toBe(2);
            expect(summaryResponse.body.data.presentCount).toBe(1);
            expect(summaryResponse.body.data.absentCount).toBe(1);

            // Step 4: Teacher views attendance records
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    date: '2023-10-15'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(recordsResponse.body.success).toBe(true);
            expect(recordsResponse.body.data.records).toHaveLength(2);
            const attendanceRecords = recordsResponse.body.data.records;

            // Step 5: Teacher corrects an attendance record
            const recordToUpdate = attendanceRecords.find(r => r.status === 'absent');
            const updateResponse = await request(app)
                .put(`/api/attendance/${recordToUpdate._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    status: 'late',
                    reason: 'Student arrived late'
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.status).toBe('late');

            // Step 6: Verify audit log was created
            const auditLogs = await AttendanceAuditLog.find({
                recordId: recordToUpdate._id
            });
            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].action).toBe('update');

            // Step 7: Teacher views updated session summary
            const updatedSummaryResponse = await request(app)
                .get(`/api/attendance/session-summary/${testClass._id}/${testSubject._id}`)
                .query({
                    date: '2023-10-15',
                    session: 'Lecture 1'
                })
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(updatedSummaryResponse.body.success).toBe(true);
            expect(updatedSummaryResponse.body.data.presentCount).toBe(1);
            expect(updatedSummaryResponse.body.data.lateCount).toBe(1);
            expect(updatedSummaryResponse.body.data.absentCount).toBe(0);
        });
    });

    describe('Complete Student Workflow: View Attendance and Analytics', () => {
        beforeEach(async () => {
            // Create test attendance data
            await AttendanceRecord.create([
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: testStudent1._id,
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
                    studentId: testStudent1._id,
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
                    studentId: testStudent1._id,
                    date: new Date('2023-10-17'),
                    session: 'Lecture 3',
                    status: 'late',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                }
            ]);

            // Create attendance summary
            await AttendanceSummary.create({
                studentId: testStudent1._id,
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
            });
        });

        it('should complete full student attendance viewing workflow', async () => {
            // Step 1: Student views their attendance records
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({ studentId: testStudent1._id })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(recordsResponse.body.success).toBe(true);
            expect(recordsResponse.body.data.records).toHaveLength(3);

            // Step 2: Student views their attendance summary
            const summaryResponse = await request(app)
                .get(`/api/attendance/summary/student/${testStudent1._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(summaryResponse.body.success).toBe(true);
            expect(summaryResponse.body.data.summaries).toBeInstanceOf(Array);
            expect(summaryResponse.body.data.summaries.length).toBeGreaterThan(0);

            // Step 3: Student views attendance trends
            const trendsResponse = await request(app)
                .get(`/api/attendance/analytics/trends/${testStudent1._id}/${testSubject._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(trendsResponse.body.success).toBe(true);
            expect(trendsResponse.body.data.trends).toBeInstanceOf(Array);

            // Step 4: Student views filtered attendance records by date range
            const filteredRecordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({
                    studentId: testStudent1._id,
                    startDate: '2023-10-15',
                    endDate: '2023-10-17'
                })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(filteredRecordsResponse.body.success).toBe(true);
            expect(filteredRecordsResponse.body.data.records).toHaveLength(3);

            // Step 5: Student views attendance records by status
            const presentRecordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({
                    studentId: testStudent1._id,
                    status: 'present'
                })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(presentRecordsResponse.body.success).toBe(true);
            expect(presentRecordsResponse.body.data.records).toHaveLength(1);
            expect(presentRecordsResponse.body.data.records[0].status).toBe('present');
        });
    });

    describe('Complete Admin Workflow: Bulk Operations and Analytics', () => {
        beforeEach(async () => {
            // Create additional test data for admin operations
            await Student.create([
                {
                    ...mockStudents[2],
                    universityId: 'CSE2021003',
                    sclassName: testClass._id
                }
            ]);

            // Create test attendance data
            await AttendanceRecord.create([
                {
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    teacherId: testTeacher._id,
                    studentId: testStudent1._id,
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
                    studentId: testStudent2._id,
                    date: new Date('2023-10-15'),
                    session: 'Lecture 1',
                    status: 'absent',
                    markedBy: testTeacher._id,
                    markedAt: new Date(),
                    schoolId: testAdmin._id
                }
            ]);

            // Create attendance summaries
            await AttendanceSummary.create([
                {
                    studentId: testStudent1._id,
                    subjectId: testSubject._id,
                    classId: testClass._id,
                    totalSessions: 10,
                    presentCount: 8,
                    absentCount: 2,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage: 80.0,
                    lastUpdated: new Date(),
                    schoolId: testAdmin._id
                },
                {
                    studentId: testStudent2._id,
                    subjectId: testSubject._id,
                    classId: testClass._id,
                    totalSessions: 10,
                    presentCount: 4,
                    absentCount: 6,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage: 40.0,
                    lastUpdated: new Date(),
                    schoolId: testAdmin._id
                }
            ]);
        });

        it('should complete full admin management workflow', async () => {
            // Step 1: Admin views school-wide analytics
            const analyticsResponse = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .query({
                    includeClassBreakdown: 'true',
                    includeSubjectBreakdown: 'true'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(analyticsResponse.body.success).toBe(true);
            expect(analyticsResponse.body.data).toHaveProperty('overallStats');
            expect(analyticsResponse.body.data).toHaveProperty('classBreakdown');
            expect(analyticsResponse.body.data).toHaveProperty('subjectBreakdown');

            // Step 2: Admin views low attendance alerts
            const alertsResponse = await request(app)
                .get(`/api/attendance/analytics/alerts/${testClass._id}`)
                .query({ threshold: 50 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(alertsResponse.body.success).toBe(true);
            expect(alertsResponse.body.data.alerts).toBeInstanceOf(Array);

            // Step 3: Admin performs bulk student assignment
            const bulkAssignResponse = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    pattern: 'CSE2021*',
                    targetClassId: testClass._id,
                    subjectIds: [testSubject._id],
                    schoolId: testAdmin._id
                })
                .expect(200);

            expect(bulkAssignResponse.body.success).toBe(true);
            expect(bulkAssignResponse.body.data.successCount).toBeGreaterThan(0);

            // Step 4: Admin performs bulk attendance marking
            const bulkMarkResponse = await request(app)
                .post('/api/attendance/bulk/mark')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    attendanceRecords: [
                        {
                            classId: testClass._id,
                            subjectId: testSubject._id,
                            date: '2023-10-18',
                            session: 'Lecture 4',
                            studentAttendance: [
                                { studentId: testStudent1._id, status: 'present' },
                                { studentId: testStudent2._id, status: 'present' }
                            ]
                        }
                    ]
                })
                .expect(200);

            expect(bulkMarkResponse.body.success).toBe(true);
            expect(bulkMarkResponse.body.data.summary.totalStudentsSuccess).toBeGreaterThan(0);

            // Step 5: Admin views bulk operation statistics
            const statsResponse = await request(app)
                .get(`/api/attendance/bulk/stats/${testAdmin._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(statsResponse.body.success).toBe(true);
            expect(statsResponse.body.data).toHaveProperty('totalOperations');

            // Step 6: Admin deletes an attendance record
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({ classId: testClass._id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const recordToDelete = recordsResponse.body.data.records[0];
            
            const deleteResponse = await request(app)
                .delete(`/api/attendance/${recordToDelete._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Duplicate entry' })
                .expect(200);

            expect(deleteResponse.body.success).toBe(true);

            // Step 7: Admin views updated analytics after changes
            const updatedAnalyticsResponse = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(updatedAnalyticsResponse.body.success).toBe(true);
            expect(updatedAnalyticsResponse.body.data).toHaveProperty('overallStats');
        });
    });

    describe('Cross-Role Interaction Workflow', () => {
        it('should handle teacher marking, admin editing, and student viewing', async () => {
            // Step 1: Teacher marks attendance
            const markResponse = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    classId: testClass._id,
                    subjectId: testSubject._id,
                    date: '2023-10-15',
                    session: 'Lecture 1',
                    studentAttendance: [
                        { studentId: testStudent1._id, status: 'present' },
                        { studentId: testStudent2._id, status: 'absent' }
                    ]
                })
                .expect(200);

            expect(markResponse.body.success).toBe(true);

            // Step 2: Get the created records
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({ classId: testClass._id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const attendanceRecord = recordsResponse.body.data.records[0];

            // Step 3: Admin edits the attendance record
            const adminEditResponse = await request(app)
                .put(`/api/attendance/${attendanceRecord._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'excused',
                    reason: 'Medical leave approved'
                })
                .expect(200);

            expect(adminEditResponse.body.success).toBe(true);
            expect(adminEditResponse.body.data.status).toBe('excused');

            // Step 4: Student views their updated attendance
            const studentViewResponse = await request(app)
                .get('/api/attendance/records')
                .query({ studentId: testStudent1._id })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(studentViewResponse.body.success).toBe(true);
            const studentRecord = studentViewResponse.body.data.records.find(
                r => r._id === attendanceRecord._id
            );
            expect(studentRecord.status).toBe('excused');

            // Step 5: Teacher views class summary with updated data
            const classSummaryResponse = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(classSummaryResponse.body.success).toBe(true);
            expect(classSummaryResponse.body.data.classSummary).toBeDefined();

            // Step 6: Verify audit trail exists
            const auditLogs = await AttendanceAuditLog.find({
                recordId: attendanceRecord._id
            });
            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].action).toBe('update');
            expect(auditLogs[0].performedBy.toString()).toBe(testAdmin._id.toString());
        });
    });

    describe('Data Consistency Workflow', () => {
        it('should maintain data consistency across multiple operations', async () => {
            // Step 1: Mark attendance for multiple sessions
            const sessions = ['Lecture 1', 'Lecture 2', 'Lecture 3'];
            const dates = ['2023-10-15', '2023-10-16', '2023-10-17'];

            for (let i = 0; i < sessions.length; i++) {
                await request(app)
                    .post('/api/attendance/mark')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        classId: testClass._id,
                        subjectId: testSubject._id,
                        date: dates[i],
                        session: sessions[i],
                        studentAttendance: [
                            { studentId: testStudent1._id, status: i === 0 ? 'present' : 'absent' },
                            { studentId: testStudent2._id, status: i === 1 ? 'present' : 'absent' }
                        ]
                    })
                    .expect(200);
            }

            // Step 2: Verify all records were created
            const allRecordsResponse = await request(app)
                .get('/api/attendance/records')
                .query({ classId: testClass._id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(allRecordsResponse.body.data.records).toHaveLength(6); // 3 sessions × 2 students

            // Step 3: Update one record and verify consistency
            const recordToUpdate = allRecordsResponse.body.data.records[0];
            await request(app)
                .put(`/api/attendance/${recordToUpdate._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ status: 'late' })
                .expect(200);

            // Step 4: Verify summary calculations are consistent
            const student1SummaryResponse = await request(app)
                .get(`/api/attendance/summary/student/${testStudent1._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(student1SummaryResponse.body.success).toBe(true);

            // Step 5: Verify class summary reflects all changes
            const classSummaryResponse = await request(app)
                .get(`/api/attendance/summary/class/${testClass._id}/subject/${testSubject._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(classSummaryResponse.body.success).toBe(true);
            expect(classSummaryResponse.body.data.studentSummaries).toHaveLength(2);

            // Step 6: Verify analytics reflect accurate data
            const analyticsResponse = await request(app)
                .get(`/api/attendance/analytics/school/${testAdmin._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(analyticsResponse.body.success).toBe(true);
            expect(analyticsResponse.body.data.overallStats).toBeDefined();
        });
    });
});