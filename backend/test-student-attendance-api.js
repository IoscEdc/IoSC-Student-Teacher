const axios = require('axios');

// Test the student attendance API with proper authentication
async function testStudentAttendanceAPI() {
  try {
    console.log('🔐 Logging in as student to get token...');
    
    // First try to login as a student
    let loginResponse;
    let token;
    let studentId;
    
    try {
      loginResponse = await axios.post('http://localhost:5000/api/StudentLogin', {
        rollNum: 59,
        password: 'password123',
        studentName: 'WAQAR AKHTAR'
      });
      
      if (loginResponse.data.token) {
        token = loginResponse.data.token;
        studentId = loginResponse.data._id;
        console.log('✅ Student login successful, token received');
        console.log('Student ID:', studentId);
      } else {
        throw new Error(loginResponse.data.message || 'Login failed');
      }
    } catch (studentLoginError) {
      console.log('❌ Student login failed, trying teacher login...');
      
      // Fallback to teacher login
      loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
        email: 'ds.teacher@university.com',
        password: 'password123'
      });
      
      token = loginResponse.data.token;
      // Use a known student ID for testing
      studentId = '6902126bf91c442b648f6b96'; // This should be a valid student ID
      console.log('✅ Teacher login successful, using student ID:', studentId);
    }
    
    console.log('\n🧪 Testing student attendance summary API...');
    
    const summaryResponse = await axios.get(`http://localhost:5000/api/attendance/summary/student/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Student attendance summary API response:');
    console.log('Success:', summaryResponse.data.success);
    console.log('Data type:', typeof summaryResponse.data.data);
    console.log('Data length:', Array.isArray(summaryResponse.data.data) ? summaryResponse.data.data.length : 'Not an array');
    
    if (summaryResponse.data.data) {
      console.log('Sample data:', JSON.stringify(summaryResponse.data.data, null, 2));
    }
    
    console.log('\n🧪 Testing attendance records API...');
    
    // Test the records endpoint
    const recordsResponse = await axios.get('http://localhost:5000/api/attendance/records', {
      params: {
        studentId: studentId,
        limit: 10
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Attendance records API response:');
    console.log('Success:', recordsResponse.data.success);
    console.log('Records count:', recordsResponse.data.data?.records?.length || 0);
    
    if (recordsResponse.data.data?.records && recordsResponse.data.data.records.length > 0) {
      console.log('Sample record:', recordsResponse.data.data.records[0]);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      console.log('Response headers:', error.response.headers);
    }
    console.log('Full error:', error);
  }
}

testStudentAttendanceAPI();