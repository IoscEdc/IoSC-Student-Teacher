/**
 * Test the API endpoint directly
 */

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAPIEndpoint() {
    try {
        console.log('🧪 Testing API endpoint directly...');

        // Generate a valid token for the teacher
        const teacherToken = jwt.sign(
            { 
                id: '6902126bf91c442b648f6ba0',
                role: 'Teacher',
                email: 'ds.teacher@university.com'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('🔑 Generated teacher token');

        // Test the API endpoint
        const response = await axios.get(
            'http://localhost:5000/api/attendance/class/6902126bf91c442b648f6b95/students',
            {
                params: { subjectId: '6902126bf91c442b648f6b9c' },
                headers: {
                    Authorization: `Bearer ${teacherToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ API call successful!');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Students count:', response.data.data?.length || 0);
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('Sample student:', {
                studentId: response.data.data[0].studentId,
                name: response.data.data[0].name,
                rollNum: response.data.data[0].rollNum
            });
        }

    } catch (error) {
        console.log('❌ API call failed:');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Error Message:', error.response?.data?.message || error.message);
        console.log('Error Details:', error.response?.data);
    }
}

testAPIEndpoint();