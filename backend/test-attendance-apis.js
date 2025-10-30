const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testAttendanceAPIs() {
    try {
        console.log('🧪 Testing Attendance APIs...\n');
        
        // Test data
        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
        
        // First, let's get a teacher token
        console.log('1️⃣ Getting teacher token...');
        const loginResponse = await axios.post(`${BASE_URL}/TeacherLogin`, {
            email: 'ds.teacher@university.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Teacher login successful');
        console.log('Login response:', loginResponse.data);
        if (token) {
            console.log('Token preview:', token.substring(0, 20) + '...');
        } else {
            console.log('❌ No token received in response');
            return;
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test session options API
        console.log('\n2️⃣ Testing session options API...');
        try {
            const sessionResponse = await axios.get(`${BASE_URL}/attendance/session-options`, {
                params: { classId, subjectId },
                headers
            });
            console.log('✅ Session options API successful');
            console.log('Sessions found:', sessionResponse.data.data.length);
            console.log('Sessions:', sessionResponse.data.data);
        } catch (error) {
            console.log('❌ Session options API failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }
        
        // Test students API
        console.log('\n3️⃣ Testing students API...');
        try {
            const studentsResponse = await axios.get(`${BASE_URL}/attendance/class/${classId}/students`, {
                params: { subjectId },
                headers
            });
            console.log('✅ Students API successful');
            console.log('Students found:', studentsResponse.data.data?.length || 0);
            if (studentsResponse.data.data?.length > 0) {
                console.log('First student:', studentsResponse.data.data[0].name);
            }
        } catch (error) {
            console.log('❌ Students API failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }
        
        // Test mark attendance API
        console.log('\n4️⃣ Testing mark attendance API...');
        try {
            const attendanceData = {
                classId,
                subjectId,
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    { studentId: '6902126bf91c442b648f6b96', status: 'present' }
                ]
            };
            
            const markResponse = await axios.post(`${BASE_URL}/attendance/mark`, attendanceData, { headers });
            console.log('✅ Mark attendance API successful');
            console.log('Response:', markResponse.data);
        } catch (error) {
            console.log('❌ Mark attendance API failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testAttendanceAPIs();