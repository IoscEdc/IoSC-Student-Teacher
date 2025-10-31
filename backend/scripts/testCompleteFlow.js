/**
 * Test complete attendance flow
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AttendanceService = require('../services/AttendanceService');
const Student = require('../models/studentSchema');

async function testCompleteFlow() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
        const teacherId = '6902126bf91c442b648f6ba0'; // DS Teacher

        console.log('\n🧪 Testing complete attendance flow');

        // Test 1: Get students for attendance
        console.log('\n1️⃣ Getting students for attendance...');
        const students = await AttendanceService.getClassStudentsForAttendance(classId, subjectId, teacherId);
        console.log(`   ✅ Found ${students.length} students`);
        console.log(`   Sample student:`, {
            studentId: students[0]?.studentId,
            name: students[0]?.name,
            rollNum: students[0]?.rollNum
        });

        // Test 2: Test different session types
        const sessionsToTest = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lab'];
        
        for (let i = 0; i < sessionsToTest.length; i++) {
            const session = sessionsToTest[i];
            console.log(`\n${i + 2}️⃣ Testing session: ${session}`);
            
            const attendanceData = {
                classId: classId,
                subjectId: subjectId,
                teacherId: teacherId,
                date: new Date().toISOString().split('T')[0],
                session: session,
                studentAttendance: students.slice(0, 2).map((student, index) => ({
                    studentId: student.studentId,
                    status: index % 2 === 0 ? 'present' : 'absent'
                }))
            };

            try {
                const result = await AttendanceService.markAttendance(attendanceData);
                console.log(`   ✅ ${session}: ${result.successCount} successful, ${result.failureCount} failed`);
                
                // Show failure details if any
                if (result.failureCount > 0) {
                    console.log(`   Failed records:`, result.failed.map(f => `${f.studentId}: ${f.error}`));
                }
            } catch (error) {
                console.log(`   ❌ ${session}: ${error.message}`);
            }
        }

        console.log('\n🎉 Complete flow test finished!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

if (require.main === module) {
    testCompleteFlow();
}

module.exports = testCompleteFlow;