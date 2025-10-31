/**
 * Test API endpoints directly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('../routes/attendanceRoutes');
const { authMiddleware } = require('../middleware/auth');

async function testAPIEndpoints() {
    try {
        console.log('🧪 Testing API endpoints...');

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Create a simple Express app to test routes
        const app = express();
        app.use(cors());
        app.use(express.json());
        
        // Mock auth middleware for testing - this needs to come before the routes
        const mockAuth = (req, res, next) => {
            // Mock admin user
            req.user = {
                id: '6902126af91c442b648f6b8d',
                role: 'Admin',
                name: 'Test Admin'
            };
            next();
        };
        
        // Apply mock auth to all attendance routes
        app.use('/attendance', mockAuth);
        
        app.use('/attendance', attendanceRoutes);

        const server = app.listen(3001, () => {
            console.log('✅ Test server running on port 3001');
        });

        // Test endpoints
        const axios = require('axios');
        const baseURL = 'http://localhost:3001';

        console.log('\n1️⃣ Testing session options endpoint...');
        try {
            const response = await axios.get(`${baseURL}/attendance/session-options`, {
                params: {
                    classId: '6902126bf91c442b648f6b95',
                    subjectId: '6902126bf91c442b648f6b9c'
                }
            });
            console.log('✅ Session options response:', response.data);
        } catch (error) {
            console.log('❌ Session options failed:', error.response?.data || error.message);
        }

        console.log('\n2️⃣ Testing students endpoint...');
        try {
            const response = await axios.get(`${baseURL}/attendance/class/6902126bf91c442b648f6b95/students`, {
                params: {
                    subjectId: '6902126bf91c442b648f6b9c'
                }
            });
            console.log('✅ Students response:', {
                success: response.data.success,
                count: response.data.data?.length,
                firstStudent: response.data.data?.[0]
            });
        } catch (error) {
            console.log('❌ Students failed:', error.response?.data || error.message);
        }

        console.log('\n3️⃣ Testing attendance marking endpoint...');
        try {
            const attendanceData = {
                classId: '6902126bf91c442b648f6b95',
                subjectId: '6902126bf91c442b648f6b9c',
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    {
                        studentId: '6902129bb949840291358b9f',
                        status: 'present'
                    }
                ]
            };

            const response = await axios.post(`${baseURL}/attendance/mark`, attendanceData);
            console.log('✅ Attendance marking response:', response.data);
        } catch (error) {
            console.log('❌ Attendance marking failed:', error.response?.data || error.message);
        }

        server.close();
        console.log('\n✅ Test server closed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database disconnected');
    }
}

testAPIEndpoints();