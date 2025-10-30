const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import models and routes
const attendanceRoutes = require('./routes/attendanceRoutes');
const Student = require('./models/studentSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');
const AttendanceSummary = require('./models/attendanceSummarySchema');

async function testAttendanceAPI() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Test 1: Check if student exists
        const studentId = '690213114a29841c1f2a63ac';
        const student = await Student.findById(studentId);
        console.log('👤 Student found:', student ? student.name : 'Not found');

        // Test 2: Check attendance records
        const records = await AttendanceRecord.find({ studentId: studentId })
            .populate('subjectId', 'subName')
            .limit(5);
        console.log(`📊 Found ${records.length} attendance records (showing first 5):`);
        records.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.subjectId?.subName || 'Unknown'} - ${record.status} on ${record.date}`);
        });

        // Test 3: Check attendance summaries
        const summaries = await AttendanceSummary.find({ studentId: studentId })
            .populate('subjectId', 'subName');
        console.log(`📈 Found ${summaries.length} attendance summaries:`);
        summaries.forEach((summary, index) => {
            console.log(`   ${index + 1}. ${summary.subjectId?.subName || 'Unknown'} - ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%)`);
        });

        // Test 4: Create a simple Express server to test the API endpoint
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Mock authentication middleware for testing
        app.use('/api/attendance', (req, res, next) => {
            req.user = { 
                id: studentId, 
                role: 'Student',
                school: student?.school 
            };
            next();
        });

        app.use('/api/attendance', attendanceRoutes);

        const server = app.listen(3001, () => {
            console.log('🚀 Test server running on http://localhost:3001');
            console.log('📡 Test the API endpoint:');
            console.log(`   GET http://localhost:3001/api/attendance/summary/student/${studentId}`);
            
            // Make a test request
            setTimeout(async () => {
                try {
                    const axios = require('axios');
                    const response = await axios.get(`http://localhost:3001/api/attendance/summary/student/${studentId}`);
                    console.log('✅ API Response:', {
                        success: response.data.success,
                        dataCount: response.data.data?.length || 0,
                        message: response.data.message
                    });
                    
                    if (response.data.data && response.data.data.length > 0) {
                        console.log('📋 First subject data:', {
                            subject: response.data.data[0].subjectId?.subName,
                            present: response.data.data[0].presentCount,
                            total: response.data.data[0].totalSessions,
                            percentage: response.data.data[0].attendancePercentage,
                            recordsCount: response.data.data[0].records?.length || 0
                        });
                    }
                } catch (apiError) {
                    console.error('❌ API Test failed:', apiError.message);
                } finally {
                    server.close();
                    await mongoose.disconnect();
                    console.log('🔌 Disconnected from MongoDB');
                    process.exit(0);
                }
            }, 1000);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testAttendanceAPI();