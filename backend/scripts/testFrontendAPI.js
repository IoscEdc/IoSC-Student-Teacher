/**
 * Test the exact API calls that the frontend makes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function testFrontendAPI() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Simulate frontend API calls
        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';
        const teacherId = '6902126bf91c442b648f6ba0';

        // Mock token (in real frontend this comes from login)
        const token = 'mock-jwt-token';

        console.log('\n🧪 Testing frontend API calls...');

        // Test 1: Get session options (what SessionSelector does)
        console.log('\n1️⃣ SessionSelector API call...');
        try {
            const SessionConfiguration = require('../models/sessionConfigurationSchema');
            const sessionConfigs = await SessionConfiguration.find({
                classId: classId,
                subjectId: subjectId
            });

            const sessionOptions = [];
            sessionConfigs.forEach(config => {
                if (config.sessionType === 'lecture') {
                    for (let i = 1; i <= config.sessionsPerWeek; i++) {
                        sessionOptions.push({
                            value: `Lecture ${i}`,
                            label: `Lecture ${i}`,
                            type: 'lecture'
                        });
                    }
                } else {
                    sessionOptions.push({
                        value: config.sessionType.charAt(0).toUpperCase() + config.sessionType.slice(1),
                        label: config.sessionType.charAt(0).toUpperCase() + config.sessionType.slice(1),
                        type: config.sessionType
                    });
                }
            });

            console.log('   ✅ Session options:', sessionOptions.map(s => s.value));
        } catch (error) {
            console.log('   ❌ Session options error:', error.message);
        }

        // Test 2: Get students (what AttendanceMarkingInterface does)
        console.log('\n2️⃣ Get students API call...');
        try {
            const AttendanceService = require('../services/AttendanceService');
            const students = await AttendanceService.getClassStudentsForAttendance(classId, subjectId, teacherId);
            console.log(`   ✅ Students found: ${students.length}`);
            console.log(`   Sample student:`, {
                studentId: students[0]?.studentId,
                name: students[0]?.name,
                rollNum: students[0]?.rollNum
            });
        } catch (error) {
            console.log('   ❌ Students error:', error.message);
        }

        // Test 3: Mark attendance (what frontend submits)
        console.log('\n3️⃣ Mark attendance API call...');
        try {
            const AttendanceService = require('../services/AttendanceService');
            
            // Simulate frontend attendance data
            const attendanceData = {
                classId: classId,
                subjectId: subjectId,
                teacherId: teacherId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    {
                        studentId: '6902129bb949840291358b9f', // First student
                        status: 'present'
                    },
                    {
                        studentId: '6902130e4a29841c1f2a62c6', // Second student  
                        status: 'absent'
                    }
                ]
            };

            const result = await AttendanceService.markAttendance(attendanceData);
            console.log(`   ✅ Attendance marked: ${result.successCount} successful, ${result.failureCount} failed`);
        } catch (error) {
            console.log('   ❌ Mark attendance error:', error.message);
        }

        console.log('\n🎉 Frontend API simulation completed!');
        console.log('\n📝 Summary:');
        console.log('   - Session options: Should show Lecture 1, 2, 3, 4, Lab');
        console.log('   - Students: Should load 72 students from AIDS B1');
        console.log('   - Attendance: Should successfully mark attendance');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

if (require.main === module) {
    testFrontendAPI();
}

module.exports = testFrontendAPI;