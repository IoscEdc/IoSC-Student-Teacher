/**
 * Test admin attendance access
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AttendanceService = require('../services/AttendanceService');

async function testAdminAttendance() {
    try {
        console.log('🧪 Testing admin attendance access...');

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';
        const adminId = '6902126af91c442b648f6b8d'; // This should be the admin ID

        console.log('\n1️⃣ Testing admin access to student list...');
        try {
            const students = await AttendanceService.getClassStudentsForAttendance(
                classId,
                subjectId,
                adminId,
                'Admin'
            );
            console.log('✅ Admin can access students:', students.length);
            if (students.length > 0) {
                console.log('Sample student:', {
                    studentId: students[0].studentId?.toString(),
                    name: students[0].name,
                    rollNum: students[0].rollNum
                });
            }
        } catch (error) {
            console.log('❌ Admin access failed:', error.message);
        }

        console.log('\n2️⃣ Testing admin attendance marking...');
        try {
            const attendanceData = {
                classId,
                subjectId,
                teacherId: adminId, // Using admin ID
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    {
                        studentId: '6902129bb949840291358b9f', // First student ID
                        status: 'present'
                    }
                ],
                userRole: 'Admin'
            };

            const result = await AttendanceService.bulkMarkAttendance(attendanceData);
            console.log('✅ Admin can mark attendance:', result.successCount, 'successful');
        } catch (error) {
            console.log('❌ Admin attendance marking failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

testAdminAttendance();