/**
 * Test attendance API endpoints
 */

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Teacher = require('../models/teacherSchema');

async function testAttendanceAPI() {
    try {
        console.log('🧪 Testing Attendance API endpoints...');
        
        // Connect to database to get teacher info
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Get teacher and generate token
        const teacher = await Teacher.findOne({ email: 'ds.teacher@university.com' });
        if (!teacher) {
            console.log('❌ Teacher not found');
            return;
        }

        const token = jwt.sign(
            { 
                id: teacher._id.toString(),
                role: teacher.role,
                email: teacher.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('🔑 Token generated for teacher:', teacher.email);

        // Test endpoints
        const baseURL = 'http://localhost:5000/api';
        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';

        console.log('\\n1️⃣ Testing session options endpoint...');
        try {
            const response = await axios.get(`${baseURL}/attendance/session-options`, {
                params: { classId, subjectId },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Session options:', response.data.success ? 'Success' : 'Failed');
            console.log('   Options count:', response.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Session options failed:', error.response?.status, error.response?.data?.message || error.message);
        }

        console.log('\\n2️⃣ Testing get students endpoint...');
        try {
            const response = await axios.get(`${baseURL}/attendance/class/${classId}/students`, {
                params: { subjectId },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Get students:', response.data.success ? 'Success' : 'Failed');
            console.log('   Students count:', response.data.data?.length || 0);
            if (response.data.data && response.data.data.length > 0) {
                console.log('   Sample student:', {
                    name: response.data.data[0].name,
                    rollNum: response.data.data[0].rollNum
                });
            }
        } catch (error) {
            console.log('❌ Get students failed:', error.response?.status, error.response?.data?.message || error.message);
        }

        console.log('\\n3️⃣ Testing mark attendance endpoint...');
        try {
            const attendanceData = {
                classId,
                subjectId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    {
                        studentId: '6902129bb949840291358b9f',
                        status: 'present'
                    }
                ]
            };

            const response = await axios.post(`${baseURL}/attendance/mark`, attendanceData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Mark attendance:', response.data.success ? 'Success' : 'Failed');
            console.log('   Result:', response.data.data?.successCount || 0, 'successful');
        } catch (error) {
            console.log('❌ Mark attendance failed:', error.response?.status, error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\\n✅ Database disconnected');
    }
}

testAttendanceAPI();