const axios = require('axios');

async function testAttendanceAPIs() {
    try {
        console.log('🧪 Testing Attendance APIs...\n');
        
        // Get teacher token first
        const loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
            email: 'ds.teacher@university.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Teacher login successful');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
        
        // Test 1: Session options API
        console.log('\n1️⃣ Testing session options API...');
        try {
            const sessionResponse = await axios.get(`http://localhost:5000/api/attendance/session-options`, {
                params: { classId, subjectId },
                headers
            });
            console.log('✅ Session options API successful');
            console.log('Sessions found:', sessionResponse.data.data.length);
            console.log('Sessions:', sessionResponse.data.data);
        } catch (error) {
            console.log('❌ Session options API failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }
        
        // Test 2: Students API
        console.log('\n2️⃣ Testing students API...');
        try {
            const studentsResponse = await axios.get(`http://localhost:5000/api/attendance/class/${classId}/students`, {
                params: { subjectId },
                headers
            });
            console.log('✅ Students API successful');
            console.log('Students found:', studentsResponse.data.data?.length || 0);
            if (studentsResponse.data.data?.length > 0) {
                console.log('First student:', studentsResponse.data.data[0].name);
            }
        } catch (error) {
            console.log('❌ Students API failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAttendanceAPIs();