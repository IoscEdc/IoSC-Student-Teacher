const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration - you'll need to update these with actual IDs from your database
const testConfig = {
    studentId: '6720b5b4b8b5c8b5c8b5c8b5', // Replace with actual student ID
    token: 'your-jwt-token-here' // Replace with actual JWT token
};

async function testStudentAttendanceAPI() {
    console.log('🧪 Testing Student Attendance Portal API...\n');
    
    try {
        // Test 1: Get student attendance summary
        console.log('📊 Test 1: Student Attendance Summary');
        console.log('='.repeat(50));
        
        const summaryUrl = `${BASE_URL}/attendance/summary/student/${testConfig.studentId}`;
        console.log(`📤 GET ${summaryUrl}`);
        
        const summaryResponse = await axios.get(summaryUrl, {
            headers: {
                'Authorization': `Bearer ${testConfig.token}`
            }
        });
        
        console.log('✅ Summary API Response Status:', summaryResponse.status);
        console.log('📋 Summary Data Structure:');
        console.log(JSON.stringify(summaryResponse.data, null, 2));
        
        // Test 2: Get attendance records for a subject (if we have subjects)
        if (summaryResponse.data.success && summaryResponse.data.data && summaryResponse.data.data.length > 0) {
            const firstSubject = summaryResponse.data.data[0];
            const subjectId = firstSubject.subjectId._id || firstSubject.subjectId;
            
            console.log('\n📚 Test 2: Subject Attendance Records');
            console.log('='.repeat(50));
            
            const recordsUrl = `${BASE_URL}/attendance/records`;
            console.log(`📤 GET ${recordsUrl}?studentId=${testConfig.studentId}&subjectId=${subjectId}`);
            
            const recordsResponse = await axios.get(recordsUrl, {
                params: {
                    studentId: testConfig.studentId,
                    subjectId: subjectId,
                    limit: 10,
                    sortBy: 'date',
                    sortOrder: 'desc'
                },
                headers: {
                    'Authorization': `Bearer ${testConfig.token}`
                }
            });
            
            console.log('✅ Records API Response Status:', recordsResponse.status);
            console.log('📋 Records Data Structure:');
            console.log(JSON.stringify(recordsResponse.data, null, 2));
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Tip: You need to update the JWT token in testConfig');
        }
        if (error.response?.status === 404) {
            console.log('\n💡 Tip: You need to update the studentId in testConfig with a valid student ID');
        }
    }
}

// Instructions for running the test
console.log('📝 Instructions:');
console.log('1. Update testConfig.studentId with a valid student ID from your database');
console.log('2. Update testConfig.token with a valid JWT token for that student');
console.log('3. Make sure the backend server is running on port 5000');
console.log('4. Run: node test-student-portal.js\n');

// Uncomment the line below to run the test (after updating the config)
// testStudentAttendanceAPI();

module.exports = { testStudentAttendanceAPI };