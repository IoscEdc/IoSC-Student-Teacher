/**
 * Check if the server is running and routes are accessible
 */

const axios = require('axios');

async function checkServerStatus() {
    console.log('🔍 Checking server status...');
    
    const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
    console.log(`Base URL: ${baseURL}`);

    const tests = [
        {
            name: 'Server Health Check',
            url: `${baseURL}/`,
            method: 'GET'
        },
        {
            name: 'Admin Login Endpoint',
            url: `${baseURL}/AdminLogin`,
            method: 'POST',
            data: { email: 'test', password: 'test' }
        },
        {
            name: 'Attendance Routes (without auth)',
            url: `${baseURL}/api/attendance/session-options`,
            method: 'GET',
            params: { classId: '123', subjectId: '456' }
        },
        {
            name: 'Admin Login Endpoint (correct path)',
            url: `${baseURL}/api/AdminLogin`,
            method: 'POST',
            data: { email: 'test', password: 'test' }
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🧪 Testing: ${test.name}`);
            console.log(`URL: ${test.url}`);
            
            let response;
            if (test.method === 'POST') {
                response = await axios.post(test.url, test.data || {});
            } else {
                response = await axios.get(test.url, { params: test.params });
            }
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log('🚨 Server appears to be down or not accessible');
            }
        }
    }
    
    console.log('\n📋 Summary:');
    console.log('If you see ECONNREFUSED errors, make sure the backend server is running:');
    console.log('  cd backend && npm start');
    console.log('');
    console.log('If you see authentication errors, that\'s expected for these tests.');
    console.log('The important thing is that the server responds.');
}

checkServerStatus();