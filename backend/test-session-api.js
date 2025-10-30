const axios = require('axios');

// Test the session options API with proper authentication
async function testAPI() {
  try {
    console.log('🔐 Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
      email: 'ds.teacher@university.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    console.log('\n🧪 Testing session options API...');
    const sessionResponse = await axios.get('http://localhost:5000/api/attendance/session-options', {
      params: {
        classId: '6902126bf91c442b648f6b95',
        subjectId: '6902126bf91c442b648f6b9c'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Session options API response:');
    console.log(JSON.stringify(sessionResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testAPI();