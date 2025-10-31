/**
 * Test script to simulate frontend authentication and API calls
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacherSchema');

async function testFrontendAuth() {
    try {
        console.log('🧪 Testing frontend authentication...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Find the teacher
        const teacher = await Teacher.findOne({ email: 'ds.teacher@university.com' });
        if (!teacher) {
            console.log('❌ Teacher not found');
            return;
        }

        console.log('👨‍🏫 Teacher found:', {
            id: teacher._id.toString(),
            email: teacher.email,
            name: teacher.name,
            teachSclass: teacher.teachSclass?.toString(),
            teachSubject: teacher.teachSubject?.toString()
        });

        // Generate a token (simulate login)
        const token = jwt.sign(
            { 
                id: teacher._id.toString(),
                role: teacher.role,
                email: teacher.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('🔑 Generated token:', token.substring(0, 50) + '...');

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified:', {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        });

        // Test the API call with this token
        const axios = require('axios');
        
        // Start the server temporarily for testing
        const app = require('../app');
        const server = app.listen(5000, () => {
            console.log('🚀 Test server started on port 5000');
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const response = await axios.get(
                'http://localhost:5000/api/attendance/class/6902126bf91c442b648f6b95/students',
                {
                    params: { subjectId: '6902126bf91c442b648f6b9c' },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('✅ API call successful:', {
                success: response.data.success,
                studentCount: response.data.data?.length || 0
            });

            if (response.data.data && response.data.data.length > 0) {
                console.log('Sample student:', {
                    studentId: response.data.data[0].studentId?.toString(),
                    name: response.data.data[0].name,
                    rollNum: response.data.data[0].rollNum
                });
            }

        } catch (apiError) {
            console.log('❌ API call failed:', {
                status: apiError.response?.status,
                message: apiError.response?.data?.message || apiError.message
            });
        }

        server.close();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database disconnected');
    }
}

testFrontendAuth();