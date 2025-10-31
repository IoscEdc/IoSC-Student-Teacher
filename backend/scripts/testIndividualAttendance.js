const axios = require('axios');

/**
 * Test script for individual student attendance marking
 * Tests both admin and teacher individual attendance functionality
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test data
const testData = {
    admin: {
        token: 'your-admin-token-here', // Replace with actual admin token
        classId: '6902126bf91c442b648f6b95', // AIDS B1
        subjectId: '6902126bf91c442b648f6b9c', // Data Structures
        studentId: '6902126bf91c442b648f6ba0' // Replace with actual student ID
    },
    teacher: {
        token: 'your-teacher-token-here', // Replace with actual teacher token
        classId: '6902126bf91c442b648f6b95', // AIDS B1
        subjectId: '6902126bf91c442b648f6b9c', // Data Structures
        studentId: '6902126bf91c442b648f6ba0' // Replace with actual student ID
    }
};

async function testIndividualAttendance(userType, userData) {
    console.log(`\n🧪 Testing ${userType} individual attendance marking...`);
    
    try {
        const attendanceData = {
            classId: userData.classId,
            subjectId: userData.subjectId,
            date: new Date().toISOString().split('T')[0], // Today's date
            session: 'Lecture 1',
            studentAttendance: [{
                studentId: userData.studentId,
                status: 'present'
            }],
            userRole: userType === 'admin' ? 'Admin' : 'Teacher'
        };

        console.log('📤 Sending attendance data:', JSON.stringify(attendanceData, null, 2));

        const response = await axios.post(
            `${BASE_URL}/attendance/mark`,
            attendanceData,
            {
                headers: {
                    'Authorization': `Bearer ${userData.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            console.log(`✅ ${userType} individual attendance marked successfully!`);
            console.log('📊 Response:', response.data);
            return true;
        } else {
            console.log(`❌ ${userType} attendance marking failed:`, response.data.message);
            return false;
        }

    } catch (error) {
        console.log(`❌ ${userType} attendance marking error:`, error.response?.data || error.message);
        return false;
    }
}

async function testStudentList(userData) {
    console.log('\n📋 Testing student list retrieval...');
    
    try {
        const response = await axios.get(
            `${BASE_URL}/attendance/class/${userData.classId}/students`,
            {
                params: { subjectId: userData.subjectId },
                headers: {
                    'Authorization': `Bearer ${userData.token}`
                }
            }
        );

        if (response.data.success) {
            console.log('✅ Student list retrieved successfully!');
            console.log(`📊 Found ${response.data.data.length} students`);
            
            // Show first few students for reference
            const students = response.data.data.slice(0, 3);
            students.forEach(student => {
                console.log(`   - ${student.name} (${student.rollNum}) - ID: ${student._id}`);
            });
            
            return response.data.data;
        } else {
            console.log('❌ Failed to retrieve student list:', response.data.message);
            return [];
        }

    } catch (error) {
        console.log('❌ Student list retrieval error:', error.response?.data || error.message);
        return [];
    }
}

async function runTests() {
    console.log('🚀 Starting Individual Attendance Tests');
    console.log('=====================================');

    // Test with admin credentials
    if (testData.admin.token !== 'your-admin-token-here') {
        console.log('\n👑 Testing Admin Individual Attendance');
        
        const students = await testStudentList(testData.admin);
        if (students.length > 0) {
            // Use the first student for testing
            testData.admin.studentId = students[0]._id;
            await testIndividualAttendance('admin', testData.admin);
        }
    } else {
        console.log('\n⚠️ Skipping admin test - please provide admin token');
    }

    // Test with teacher credentials
    if (testData.teacher.token !== 'your-teacher-token-here') {
        console.log('\n👨‍🏫 Testing Teacher Individual Attendance');
        
        const students = await testStudentList(testData.teacher);
        if (students.length > 0) {
            // Use the first student for testing
            testData.teacher.studentId = students[0]._id;
            await testIndividualAttendance('teacher', testData.teacher);
        }
    } else {
        console.log('\n⚠️ Skipping teacher test - please provide teacher token');
    }

    console.log('\n✨ Individual Attendance Tests Complete');
    console.log('=====================================');
}

// Instructions for running the test
console.log('📝 Individual Attendance Test Instructions:');
console.log('1. Replace the token values in testData with actual login tokens');
console.log('2. Ensure the server is running on the correct port');
console.log('3. Run: node backend/scripts/testIndividualAttendance.js');
console.log('');

// Run tests if tokens are provided
if (process.argv.includes('--run')) {
    runTests().catch(console.error);
} else {
    console.log('💡 Add --run flag to execute tests: node backend/scripts/testIndividualAttendance.js --run');
}

module.exports = { testIndividualAttendance, testStudentList };