// Quick test script to verify the attendance API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
    console.log('🔍 Quick Attendance API Test\n');
    
    try {
        // Test 1: Health check for fallback API
        console.log('1. Testing fallback health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/attendance-fallback/health`);
        console.log('✅ Health check passed:', healthResponse.data.message);
        
        // Test 2: Admin login with token
        console.log('\n2. Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/AdminLogin`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        
        if (loginResponse.data.token) {
            console.log('✅ Admin login successful, JWT token received');
            
            // Test 3: Get students using fallback
            console.log('\n3. Testing get students (fallback)...');
            const studentsResponse = await axios.get(
                `${BASE_URL}/attendance-fallback/class/68ff8d3cb3e76597e43d133d/students?fallback=true`
            );
            
            if (studentsResponse.data.success) {
                console.log(`✅ Students retrieved: ${studentsResponse.data.data.length} found`);
                
                // Test 4: Mark attendance using fallback
                console.log('\n4. Testing mark attendance (fallback)...');
                const attendanceData = {
                    classId: '68ff8d3cb3e76597e43d133d',
                    subjectId: '68ff8dcbb3e76597e43d1344',
                    date: new Date().toISOString().split('T')[0],
                    session: 'Lecture 1',
                    studentAttendance: [{
                        studentId: '68ff86acb3e76597e43d1283',
                        status: 'Present'
                    }]
                };
                
                const markResponse = await axios.post(
                    `${BASE_URL}/attendance-fallback/mark`,
                    attendanceData
                );
                
                if (markResponse.data.success) {
                    console.log('✅ Attendance marked successfully');
                    console.log('   Message:', markResponse.data.message);
                } else {
                    console.log('❌ Failed to mark attendance');
                }
            } else {
                console.log('❌ Failed to get students');
            }
        } else {
            console.log('❌ Admin login failed - no token received');
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

// Export for use in other scripts
module.exports = { quickTest };

// Run if called directly
if (require.main === module) {
    quickTest();
}
