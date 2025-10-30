const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function debugAttendanceMarking() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('📊 Connected to MongoDB');

        // Import models
        const Student = require('../models/studentSchema');
        const Teacher = require('../models/teacherSchema');

        // Get real data
        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';

        // Get students
        const students = await Student.find({
            sclassName: classId
        }).limit(3); // Just test with 3 students

        console.log(`✅ Found ${students.length} students for testing`);

        // Get teacher
        const teacher = await Teacher.findOne({
            teachSclass: classId,
            teachSubject: subjectId
        });

        if (!teacher) {
            console.log('❌ No teacher found');
            return;
        }

        console.log(`✅ Found teacher: ${teacher.name}`);

        // Create token
        const token = jwt.sign(
            { 
                id: teacher._id, 
                role: 'Teacher',
                email: teacher.email 
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '1h' }
        );

        // Prepare attendance data (same format as frontend)
        const attendanceData = {
            classId: classId,
            subjectId: subjectId,
            date: '2025-10-30', // Today's date
            session: 'Lecture 1',
            studentAttendance: students.map((student, index) => ({
                studentId: student._id.toString(),
                status: index === 0 ? 'present' : 'absent'
            }))
        };

        console.log('📤 Sending attendance data:', JSON.stringify(attendanceData, null, 2));

        // Test the API call
        try {
            const response = await axios.post(
                'http://localhost:5000/api/attendance/mark',
                attendanceData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            console.log('✅ SUCCESS:', response.data);

        } catch (apiError) {
            console.error('❌ API Error Details:');
            console.error('Status:', apiError.response?.status);
            console.error('Status Text:', apiError.response?.statusText);
            console.error('Error Message:', apiError.response?.data?.message);
            console.error('Full Error Data:', apiError.response?.data);
            console.error('Request URL:', apiError.config?.url);
            console.error('Request Data:', apiError.config?.data);
        }

    } catch (error) {
        console.error('❌ Script Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
    }
}

debugAttendanceMarking();