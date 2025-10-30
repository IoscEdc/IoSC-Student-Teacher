const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testEndpoint() {
    try {
        // Create a test token
        const token = jwt.sign(
            { 
                id: '6902126bf91c442b648f6ba0', // Teacher ID
                role: 'Teacher',
                email: 'teacher@test.com'
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '1h' }
        );

        const baseUrl = 'http://localhost:5000';
        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';

        // Test different endpoint variations
        const endpoints = [
            `/api/attendance/records?classId=${classId}&subjectId=${subjectId}&page=1&limit=10`,
            `/attendance/records?classId=${classId}&subjectId=${subjectId}&page=1&limit=10`,
            `/api/attendance/class/${classId}/students?subjectId=${subjectId}`,
            `/api/attendance/session-options?classId=${classId}&subjectId=${subjectId}`
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n🧪 Testing: ${baseUrl}${endpoint}`);
                
                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 5000
                });

                console.log(`✅ SUCCESS: Status ${response.status}`);
                console.log(`📊 Response:`, {
                    success: response.data.success,
                    dataType: typeof response.data.data,
                    recordsCount: response.data.data?.records?.length || 'N/A',
                    message: response.data.message
                });

            } catch (error) {
                console.log(`❌ FAILED: ${error.response?.status || 'Network Error'} - ${error.response?.data?.message || error.message}`);
            }
        }

        // Test if server is running at all
        try {
            console.log(`\n🏠 Testing root endpoint: ${baseUrl}/`);
            const rootResponse = await axios.get(`${baseUrl}/`);
            console.log(`✅ Server is running: ${rootResponse.data.message}`);
        } catch (error) {
            console.log(`❌ Server not responding: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEndpoint();