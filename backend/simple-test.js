const axios = require('axios');

// Simple test without authentication first
async function testRoute() {
  try {
    console.log('🧪 Testing route without auth...');
    const response = await axios.get('http://localhost:5000/api/attendance/session-options?classId=test&subjectId=test');
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testRoute();