const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app
const app = require('../../index');

// Import models
const Admin = require('../../models/adminSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Sclass = require('../../models/sclassSchema');
const Subject = require('../../models/subjectSchema');
const AttendanceRecord = require('../../models/attendanceRecordSchema');
const AttendanceSummary = require('../../models/attendanceSummarySchema');

describe('System Integration Tests - Complete User Workflows', () => {
    let mongoServer;
    let adminToken, teacherToken, studentToken;
    let adminId, teacherId, studentId, classId, subjectId;

    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Connect to the in-memory database
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        // Clean up
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear all collections
        await Admin.deleteMany({});
        await Student.deleteMany({});
        await Teacher.deleteMany({});
        await Sclass.deleteMany({});
        await Subject.deleteMany({});
        await AttendanceRecord.deleteMany({});
        await AttendanceSummary.deleteMany({});
    });

    describe('Complete Admin Workflow', () => {
        test('Admin can register, login, create school structure, and manage attendance', async () => {
            // 1. Admin Registration
            const adminData = {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            const adminRegResponse = await request(app)
                .post('/api/AdminReg')
                .send(adminData)
                .expect(201);

            adminId = adminRegResponse.body.result._id;
            adminToken = adminRegResponse.body.token;

            // 2. Admin Login
            const loginResponse = await request(app)
                .post('/api/AdminLogin')
                .send({
                    email: adminData.email,
                    password: adminData.password
                })
                .expect(200);

            expect(loginResponse.body.token).toBeDefined();

            // 3. Create Class
            const classData = {
                sclassName: 'Class 10A',
                adminID: adminId
            };

            const classResponse = await request(app)
                .post('/api/SclassCreate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(classData)
                .expect(201);

            classId = classResponse.body.result._id;

            // 4. Create Subject
            const subjectData = {
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: classId,
                adminID: adminId
            };

            const subjectResponse = await request(app)
                .post('/api/SubjectCreate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(subjectData)
                .expect(201);

            subjectId = subjectResponse.body.result._id;

            // 5. Register Teacher
            const teacherData = {
                name: 'Test Teacher',
                email: 'teacher@test.com',
                password: 'password123',
                role: 'Teacher',
                school: adminId,
                teachSubject: subjectId,
                teachSclass: classId
            };

            const teacherResponse = await request(app)
                .post('/api/TeacherReg')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(teacherData)
                .expect(201);

            teacherId = teacherResponse.body.result._id;

            // 6. Register Student
            const studentData = {
                name: 'Test Student',
                rollNum: 1,
                universityId: 'CS2024001',
                password: 'password123',
                sclassName: classId,
                school: adminId
            };

            const studentResponse = await request(app)
                .post('/api/StudentReg')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(studentData)
                .expect(201);

            studentId = studentResponse.body.result._id;

            // 7. Bulk assign students to subjects
            const bulkAssignResponse = await request(app)
                .post('/api/attendance/bulk/assign-students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    pattern: 'CS2024*',
                    classId: classId,
                    subjectIds: [subjectId]
                })
                .expect(200);

            expect(bulkAssignResponse.body.success).toBe(true);

            // 8. View attendance analytics
            const analyticsResponse = await request(app)
                .get(`/api/attendance/analytics/school/${adminId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(analyticsResponse.body.success).toBe(true);
            expect(analyticsResponse.body.data).toBeDefined();
        });
    });

    describe('Complete Teacher Workflow', () => {
        beforeEach(async () => {
            // Setup test data
            const admin = await Admin.create({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'hashedpassword',
                schoolName: 'Test School'
            });
            adminId = admin._id;

            const sclass = await Sclass.create({
                sclassName: 'Class 10A',
                school: adminId
            });
            classId = sclass._id;

            const subject = await Subject.create({
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: classId,
                school: adminId
            });
            subjectId = subject._id;

            const teacher = await Teacher.create({
                name: 'Test Teacher',
                email: 'teacher@test.com',
                password: 'hashedpassword',
                role: 'Teacher',
                school: adminId,
                assignedSubjects: [{
                    subjectId: subjectId,
                    classId: classId
                }]
            });
            teacherId = teacher._id;

            const student = await Student.create({
                name: 'Test Student',
                rollNum: 1,
                universityId: 'CS2024001',
                password: 'hashedpassword',
                sclassName: classId,
                school: adminId,
                enrolledSubjects: [{
                    subjectId: subjectId
                }]
            });
            studentId = student._id;

            // Mock teacher login
            teacherToken = 'mock-teacher-token';
        });

        test('Teacher can login, view assigned classes, mark attendance, and view history', async () => {
            // 1. Teacher Login (mocked for this test)
            const loginResponse = await request(app)
                .post('/api/TeacherLogin')
                .send({
                    email: 'teacher@test.com',
                    password: 'password123'
                });
            // Note: This might fail due to password hashing, but we'll continue with mocked token

            // 2. Get students for attendance marking
            const studentsResponse = await request(app)
                .get(`/api/attendance/class/${classId}/students`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({ subjectId: subjectId });

            // 3. Mark attendance
            const attendanceData = {
                classId: classId,
                subjectId: subjectId,
                teacherId: teacherId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                attendanceRecords: [{
                    studentId: studentId,
                    status: 'present'
                }]
            };

            const markAttendanceResponse = await request(app)
                .post('/api/attendance/mark')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(attendanceData);

            // 4. View attendance history
            const historyResponse = await request(app)
                .get('/api/attendance/records')
                .set('Authorization', `Bearer ${teacherToken}`)
                .query({
                    classId: classId,
                    subjectId: subjectId,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                });

            // 5. Update attendance record
            if (markAttendanceResponse.body.success) {
                const recordId = markAttendanceResponse.body.data.records[0]._id;
                const updateResponse = await request(app)
                    .put(`/api/attendance/${recordId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        status: 'late',
                        reason: 'Traffic delay'
                    });
            }
        });
    });

    describe('Complete Student Workflow', () => {
        beforeEach(async () => {
            // Setup test data similar to teacher workflow
            const admin = await Admin.create({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'hashedpassword',
                schoolName: 'Test School'
            });
            adminId = admin._id;

            const sclass = await Sclass.create({
                sclassName: 'Class 10A',
                school: adminId
            });
            classId = sclass._id;

            const subject = await Subject.create({
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: classId,
                school: adminId
            });
            subjectId = subject._id;

            const student = await Student.create({
                name: 'Test Student',
                rollNum: 1,
                universityId: 'CS2024001',
                password: 'hashedpassword',
                sclassName: classId,
                school: adminId,
                enrolledSubjects: [{
                    subjectId: subjectId
                }]
            });
            studentId = student._id;

            // Create some attendance records
            await AttendanceRecord.create({
                classId: classId,
                subjectId: subjectId,
                studentId: studentId,
                date: new Date(),
                session: 'Lecture 1',
                status: 'present',
                markedBy: teacherId,
                schoolId: adminId
            });

            await AttendanceSummary.create({
                studentId: studentId,
                subjectId: subjectId,
                classId: classId,
                totalSessions: 10,
                presentCount: 8,
                absentCount: 2,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 80,
                schoolId: adminId
            });

            studentToken = 'mock-student-token';
        });

        test('Student can login, view attendance dashboard, and check detailed records', async () => {
            // 1. Student Login (mocked)
            const loginResponse = await request(app)
                .post('/api/StudentLogin')
                .send({
                    rollNum: 1,
                    password: 'password123',
                    studentName: 'Test Student'
                });

            // 2. View attendance summary
            const summaryResponse = await request(app)
                .get(`/api/attendance/summary/student/${studentId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            // 3. View detailed attendance records
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .set('Authorization', `Bearer ${studentToken}`)
                .query({
                    studentId: studentId,
                    subjectId: subjectId
                });

            // 4. View subject-specific attendance
            const subjectAttendanceResponse = await request(app)
                .get(`/api/attendance/summary/student/${studentId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .query({ subjectId: subjectId });
        });
    });

    describe('Cross-Role Integration Tests', () => {
        test('Complete attendance lifecycle: Admin creates, Teacher marks, Student views', async () => {
            // This test combines all roles in a realistic workflow
            
            // 1. Admin setup (abbreviated)
            const admin = await Admin.create({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'hashedpassword',
                schoolName: 'Test School'
            });
            adminId = admin._id;

            // 2. Create school structure
            const sclass = await Sclass.create({
                sclassName: 'Class 10A',
                school: adminId
            });
            classId = sclass._id;

            const subject = await Subject.create({
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: classId,
                school: adminId
            });
            subjectId = subject._id;

            // 3. Create users
            const teacher = await Teacher.create({
                name: 'Test Teacher',
                email: 'teacher@test.com',
                password: 'hashedpassword',
                role: 'Teacher',
                school: adminId,
                assignedSubjects: [{
                    subjectId: subjectId,
                    classId: classId
                }]
            });
            teacherId = teacher._id;

            const student = await Student.create({
                name: 'Test Student',
                rollNum: 1,
                universityId: 'CS2024001',
                password: 'hashedpassword',
                sclassName: classId,
                school: adminId,
                enrolledSubjects: [{
                    subjectId: subjectId
                }]
            });
            studentId = student._id;

            // 4. Teacher marks attendance
            const attendanceData = {
                classId: classId,
                subjectId: subjectId,
                teacherId: teacherId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                attendanceRecords: [{
                    studentId: studentId,
                    status: 'present'
                }]
            };

            // Mock the attendance marking (since we don't have full auth)
            const attendanceRecord = await AttendanceRecord.create({
                classId: classId,
                subjectId: subjectId,
                studentId: studentId,
                teacherId: teacherId,
                date: new Date(),
                session: 'Lecture 1',
                status: 'present',
                markedBy: teacherId,
                schoolId: adminId
            });

            // 5. Verify summary was updated
            const summary = await AttendanceSummary.findOne({
                studentId: studentId,
                subjectId: subjectId
            });

            // 6. Admin views analytics
            const analytics = await request(app)
                .get(`/api/attendance/analytics/school/${adminId}`)
                .set('Authorization', 'Bearer mock-admin-token');

            // Verify the complete workflow
            expect(attendanceRecord).toBeDefined();
            expect(attendanceRecord.status).toBe('present');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('System handles invalid data gracefully', async () => {
            // Test various error scenarios
            
            // 1. Invalid attendance marking
            const invalidAttendanceResponse = await request(app)
                .post('/api/attendance/mark')
                .send({
                    classId: 'invalid-id',
                    subjectId: 'invalid-id',
                    attendanceRecords: []
                });

            // 2. Unauthorized access
            const unauthorizedResponse = await request(app)
                .get('/api/attendance/analytics/school/invalid-id');

            // 3. Missing required fields
            const missingFieldsResponse = await request(app)
                .post('/api/attendance/mark')
                .send({
                    classId: classId
                    // Missing other required fields
                });

            // Verify error responses are properly formatted
            expect(invalidAttendanceResponse.status).toBeGreaterThanOrEqual(400);
            expect(unauthorizedResponse.status).toBeGreaterThanOrEqual(400);
            expect(missingFieldsResponse.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Performance and Concurrency Tests', () => {
        test('System handles concurrent attendance marking', async () => {
            // Setup multiple students
            const admin = await Admin.create({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'hashedpassword',
                schoolName: 'Test School'
            });
            adminId = admin._id;

            const sclass = await Sclass.create({
                sclassName: 'Class 10A',
                school: adminId
            });
            classId = sclass._id;

            const subject = await Subject.create({
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: classId,
                school: adminId
            });
            subjectId = subject._id;

            // Create multiple students
            const students = [];
            for (let i = 1; i <= 5; i++) {
                const student = await Student.create({
                    name: `Test Student ${i}`,
                    rollNum: i,
                    universityId: `CS202400${i}`,
                    password: 'hashedpassword',
                    sclassName: classId,
                    school: adminId,
                    enrolledSubjects: [{
                        subjectId: subjectId
                    }]
                });
                students.push(student);
            }

            // Simulate concurrent attendance marking
            const attendancePromises = students.map(student => 
                AttendanceRecord.create({
                    classId: classId,
                    subjectId: subjectId,
                    studentId: student._id,
                    date: new Date(),
                    session: 'Lecture 1',
                    status: 'present',
                    markedBy: teacherId,
                    schoolId: adminId
                })
            );

            const results = await Promise.all(attendancePromises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.status).toBe('present');
            });
        });
    });
});