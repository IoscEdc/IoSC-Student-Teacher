const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Create a simple test server to intercept requests
const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log all requests
app.use((req, res, next) => {
    console.log('\n🔍 Incoming Request:');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
});

// Test the exact endpoint that's failing
app.get('/api/attendance/class/:classId/students', async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        const { classId } = req.params;
        const { subjectId } = req.query;
        const authHeader = req.headers.authorization;
        
        console.log('\n📋 Request Details:');
        console.log('Class ID:', classId);
        console.log('Subject ID:', subjectId);
        console.log('Auth Header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No valid authorization token provided'
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log('Token preview:', token.substring(0, 20) + '...');
        
        // Verify token
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded:', decoded);
        } catch (error) {
            console.log('Token verification failed:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        // Get students using the same query as AttendanceService
        const Student = require('./models/studentSchema');
        const students = await Student.find({ 
            sclassName: classId 
        }).select('_id name rollNum').sort({ rollNum: 1 });
        
        console.log('Students found:', students.length);
        
        res.json({
            success: true,
            data: students.map(student => ({
                _id: student._id,
                name: student.name,
                rollNum: student.rollNum
            })),
            message: 'Students retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🔍 Debug server running on port ${PORT}`);
    console.log('Make a request to: http://localhost:5001/api/attendance/class/6902126bf91c442b648f6b95/students?subjectId=6902126bf91c442b648f6b9c');
    console.log('With Authorization header: Bearer <your-token>');
});