const axios = require('axios');

// Test the students API with proper authentication
async function testStudentsAPI() {
  try {
    console.log('🔐 Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
      email: 'ds.teacher@university.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    console.log('\n🧪 Testing students API...');
    const classId = '6902126bf91c442b648f6b95';
    const subjectId = '6902126bf91c442b648f6b9c';
    
    const studentsResponse = await axios.get(`http://localhost:5000/api/attendance/class/${classId}/students`, {
      params: { subjectId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Students API response:');
    console.log('Success:', studentsResponse.data.success);
    console.log('Students count:', studentsResponse.data.data?.length || 0);
    
    if (studentsResponse.data.data && studentsResponse.data.data.length > 0) {
      console.log('Sample student:', {
        studentId: studentsResponse.data.data[0].studentId,
        name: studentsResponse.data.data[0].name,
        rollNum: studentsResponse.data.data[0].rollNum
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testStudentsAPI();