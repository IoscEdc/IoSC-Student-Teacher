const axios = require('axios');

async function testStudentAttendanceComplete() {
    console.log('🧪 Complete Student Attendance API Test\n');
    console.log('=' .repeat(60));

    try {
        // Step 1: Login as WAQAR AKHTAR
        console.log('\n🔐 Step 1: Student Login');
        console.log('-'.repeat(30));
        
        const loginResponse = await axios.post('http://localhost:5000/api/StudentLogin', {
            rollNum: 59,
            password: 'password123',
            studentName: 'WAQAR AKHTAR'
        });

        if (!loginResponse.data.token) {
            throw new Error(loginResponse.data.message || 'Login failed');
        }

        const token = loginResponse.data.token;
        const studentId = loginResponse.data._id;
        
        console.log('✅ Login successful');
        console.log(`👤 Student ID: ${studentId}`);
        console.log(`🎫 Token: ${token ? 'Present' : 'Missing'}`);

        // Step 2: Test attendance summary API
        console.log('\n📊 Step 2: Attendance Summary API');
        console.log('-'.repeat(30));
        
        const summaryUrl = `http://localhost:5000/api/attendance/summary/student/${studentId}`;
        console.log(`📤 GET ${summaryUrl}`);
        
        const summaryResponse = await axios.get(summaryUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Summary API Response:');
        console.log(`Status: ${summaryResponse.status}`);
        console.log(`Success: ${summaryResponse.data.success}`);
        console.log(`Data type: ${typeof summaryResponse.data.data}`);
        console.log(`Data length: ${Array.isArray(summaryResponse.data.data) ? summaryResponse.data.data.length : 'Not an array'}`);
        
        if (summaryResponse.data.data && summaryResponse.data.data.length > 0) {
            console.log('\n📋 Summary Data Sample:');
            console.log(JSON.stringify(summaryResponse.data.data[0], null, 2));
        } else {
            console.log('⚠️ No summary data returned');
        }

        // Step 3: Test attendance records API
        console.log('\n📚 Step 3: Attendance Records API');
        console.log('-'.repeat(30));
        
        const recordsUrl = `http://localhost:5000/api/attendance/records`;
        console.log(`📤 GET ${recordsUrl}?studentId=${studentId}`);
        
        const recordsResponse = await axios.get(recordsUrl, {
            params: {
                studentId: studentId,
                limit: 10,
                sortBy: 'date',
                sortOrder: 'desc'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Records API Response:');
        console.log(`Status: ${recordsResponse.status}`);
        console.log(`Success: ${recordsResponse.data.success}`);
        console.log(`Records count: ${recordsResponse.data.data?.records?.length || 0}`);
        console.log(`Total records: ${recordsResponse.data.data?.totalRecords || 0}`);
        
        if (recordsResponse.data.data?.records && recordsResponse.data.data.records.length > 0) {
            console.log('\n📋 Records Data Sample:');
            console.log(JSON.stringify(recordsResponse.data.data.records[0], null, 2));
        } else {
            console.log('⚠️ No records data returned');
        }

        // Step 4: Test useStudentAttendance hook simulation
        console.log('\n🔗 Step 4: Hook Data Transformation Test');
        console.log('-'.repeat(30));
        
        if (summaryResponse.data.success && summaryResponse.data.data) {
            const summaryData = summaryResponse.data.data;
            
            // Simulate the transformation logic from useStudentAttendance hook
            let totalSessions = 0;
            let totalPresent = 0;
            let totalAbsent = 0;

            const subjects = summaryData.map(summary => {
                totalSessions += summary.totalSessions || 0;
                totalPresent += summary.presentCount || 0;
                totalAbsent += summary.absentCount || 0;

                return {
                    subject: summary.subjectId?.subName || 'Unknown Subject',
                    subjectId: summary.subjectId?._id || summary.subjectId,
                    present: summary.presentCount || 0,
                    total: summary.totalSessions || 0,
                    percentage: summary.attendancePercentage || 0,
                    absent: summary.absentCount || 0,
                    late: summary.lateCount || 0,
                    excused: summary.excusedCount || 0
                };
            });

            const overallPercentage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

            const transformedData = {
                overallPercentage,
                subjects,
                totalSessions,
                totalPresent,
                totalAbsent
            };

            console.log('✅ Transformed Data:');
            console.log(JSON.stringify(transformedData, null, 2));
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
        }
        
        // Provide debugging suggestions
        console.log('\n🔍 Debugging Suggestions:');
        console.log('1. Check if backend server is running on port 5000');
        console.log('2. Verify student credentials (WAQAR AKHTAR, roll 59, password123)');
        console.log('3. Ensure attendance data exists for this student');
        console.log('4. Check API route configurations');
        console.log('5. Verify JWT token generation and validation');
    }
}

testStudentAttendanceComplete();