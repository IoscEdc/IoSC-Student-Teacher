const axios = require('axios');

async function testAttendanceMarking() {
    try {
        console.log('🔐 Getting teacher token...');
        const loginResponse = await axios.post('http://localhost:5000/api/TeacherLogin', {
            email: 'ds.teacher@university.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Teacher login successful');
        
        console.log('👥 Getting students...');
        const studentsResponse = await axios.get(
            'http://localhost:5000/api/attendance/class/6902126bf91c442b648f6b95/students?subjectId=6902126bf91c442b648f6b9c',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        
        console.log(`✅ Found ${studentsResponse.data.data.length} students`);
        
        // Prepare attendance data for first 3 students
        const students = studentsResponse.data.data.slice(0, 3);
        const studentAttendance = students.map((student, index) => ({
            studentId: student.studentId,
            status: index % 2 === 0 ? 'present' : 'absent'
        }));
        
        const attendanceData = {
            classId: '6902126bf91c442b648f6b95',
            subjectId: '6902126bf91c442b648f6b9c',
            date: new Date().toISOString().split('T')[0], // Today's date
            session: 'Lecture 1',
            studentAttendance
        };
        
        console.log('📝 Marking attendance...');
        console.log('Data:', JSON.stringify(attendanceData, null, 2));
        
        try {
            // Try main API first
            const response = await axios.post(
                'http://localhost:5000/api/attendance/mark',
                attendanceData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Main API Success:', response.data);
        } catch (mainError) {
            console.log('❌ Main API failed:', mainError.response?.data || mainError.message);
            
            console.log('🔄 Trying fallback API...');
            try {
                const fallbackResponse = await axios.post(
                    'http://localhost:5000/api/attendance-fallback/mark',
                    attendanceData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('✅ Fallback API Success:', fallbackResponse.data);
            } catch (fallbackError) {
                console.log('❌ Fallback API failed:', fallbackError.response?.data || fallbackError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('❌ Full error:', error);
        if (error.response) {
            console.error('❌ Response data:', error.response.data);
            console.error('❌ Response status:', error.response.status);
        }
    }
}

testAttendanceMarking();