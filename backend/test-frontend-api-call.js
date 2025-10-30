const axios = require('axios');

async function testFrontendAPICall() {
    try {
        console.log('🧪 Testing the exact API call that frontend is making...\n');
        
        // First, get a teacher token (same as frontend would have)
        console.log('1️⃣ Getting teacher token...');
        const loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
            email: 'ds.teacher@university.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Teacher login successful');
        console.log('Token:', token.substring(0, 30) + '...');
        
        // Now test the exact API call that frontend is making
        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';
        
        console.log('\n2️⃣ Testing students API call (exact frontend call)...');
        console.log('URL:', `http://localhost:5000/api/attendance/class/${classId}/students`);
        console.log('Params:', { subjectId });
        console.log('Headers:', { Authorization: `Bearer ${token}` });
        
        const response = await axios.get(`http://localhost:5000/api/attendance/class/${classId}/students`, {
            params: { subjectId },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        console.log('✅ API call successful!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        console.log('Students found:', response.data.data?.length || 0);
        
    } catch (error) {
        console.log('❌ API call failed');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Error Data:', error.response?.data);
        console.log('Full Error:', error.message);
        
        if (error.response?.status === 404) {
            console.log('\n🔍 404 Error Analysis:');
            console.log('This means the route /api/attendance/class/:classId/students does not exist');
            console.log('Check if:');
            console.log('1. Backend server is running on port 5000');
            console.log('2. Attendance routes are properly mounted');
            console.log('3. Route definition exists in attendanceRoutes.js');
        }
    }
}

testFrontendAPICall();