const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAttendanceAPI() {
    console.log('🧪 Testing Attendance API...\n');

    try {
        // Test 1: Admin Login to get token
        console.log('1. Testing Admin Login...');
        const adminLogin = await axios.post(`${BASE_URL}/AdminLogin`, {
            email: 'admin@school.com',
            password: 'admin123'
        });

        if (adminLogin.data.token) {
            console.log('✅ Admin login successful, token received');
            const adminToken = adminLogin.data.token;
            
            // Test 2: Get class students for attendance
            console.log('\n2. Testing Get Class Students...');
            const classId = '68ff8d3cb3e76597e43d133d'; // Class 10A
            const subjectId = '68ff8dcbb3e76597e43d1344'; // Mathematics
            
            const studentsResponse = await axios.get(
                `${BASE_URL}/attendance/class/${classId}/students?subjectId=${subjectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    }
                }
            );
            
            if (studentsResponse.data.success) {
                console.log('✅ Successfully retrieved students for attendance');
                console.log(`   Found ${studentsResponse.data.data?.length || 0} students`);
                
                // Test 3: Mark attendance
                console.log('\n3. Testing Mark Attendance...');
                const studentId = '68ff86acb3e76597e43d1283'; // Test Student
                
                const attendanceData = {
                    classId,
                    subjectId,
                    date: new Date().toISOString().split('T')[0],
                    session: 'Lecture 1',
                    studentAttendance: [{
                        studentId,
                        status: 'Present'
                    }]
                };
                
                const markResponse = await axios.post(
                    `${BASE_URL}/attendance/mark`,
                    attendanceData,
                    {
                        headers: {
                            Authorization: `Bearer ${adminToken}`
                        }
                    }
                );
                
                if (markResponse.data.success) {
                    console.log('✅ Successfully marked attendance');
                    console.log(`   Message: ${markResponse.data.message}`);
                } else {
                    console.log('❌ Failed to mark attendance:', markResponse.data.message);
                }
                
            } else {
                console.log('❌ Failed to get students:', studentsResponse.data.message);
            }
            
        } else {
            console.log('❌ Admin login failed or no token received');
            console.log('   Response:', adminLogin.data);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Test teacher login as well
async function testTeacherLogin() {
    console.log('\n📚 Testing Teacher Login...');
    
    try {
        const teacherLogin = await axios.post(`${BASE_URL}/TeacherLogin`, {
            email: 'teacher@school.com',
            password: 'teacher123'
        });

        if (teacherLogin.data.token) {
            console.log('✅ Teacher login successful, token received');
        } else {
            console.log('❌ Teacher login failed or no token received');
            console.log('   Response:', teacherLogin.data);
        }
    } catch (error) {
        console.error('❌ Teacher login test failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🔧 Starting API Tests...\n');
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testAttendanceAPI();
    await testTeacherLogin();
    
    console.log('\n✨ Tests completed!');
}

runTests();
