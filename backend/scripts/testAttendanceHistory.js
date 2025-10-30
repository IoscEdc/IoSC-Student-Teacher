const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function testAttendanceHistory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('📊 Connected to MongoDB');

        // Test data
        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures

        // Import all required models
        const AttendanceRecord = require('../models/attendanceRecordSchema');
        const Student = require('../models/studentSchema');
        const Teacher = require('../models/teacherSchema');
        const Subject = require('../models/subjectSchema');
        const Sclass = require('../models/sclassSchema');

        // First, let's check if there are any attendance records in the database
        const totalRecords = await AttendanceRecord.countDocuments({
            classId: classId,
            subjectId: subjectId
        });

        console.log(`📋 Total attendance records in database: ${totalRecords}`);

        if (totalRecords > 0) {
            const sampleRecords = await AttendanceRecord.find({
                classId: classId,
                subjectId: subjectId
            })
            .populate('studentId', 'name rollNum')
            .populate('teacherId', 'name')
            .limit(5);

            console.log('\n🎯 Sample attendance records:');
            sampleRecords.forEach((record, index) => {
                console.log(`${index + 1}. ${record.studentId?.name} (${record.studentId?.rollNum}) - ${record.status} - ${record.date.toDateString()} - ${record.session}`);
            });
        }

        // Test the AttendanceService directly
        const AttendanceService = require('../services/AttendanceService');
        
        const filters = {
            classId: classId,
            subjectId: subjectId
        };

        const options = {
            page: 1,
            limit: 10,
            sortBy: 'date',
            sortOrder: 'desc',
            populate: true
        };

        console.log('\n🚀 Testing AttendanceService.getAttendanceByFilters...');
        const result = await AttendanceService.getAttendanceByFilters(filters, options);
        
        console.log('✅ Service result structure:', {
            recordsCount: result.records?.length || 0,
            pagination: result.pagination,
            firstRecord: result.records?.[0] ? {
                studentName: result.records[0].studentId?.name,
                status: result.records[0].status,
                date: result.records[0].date,
                session: result.records[0].session
            } : 'No records'
        });

        // Test the API endpoint directly (simulate the frontend call)
        console.log('\n🌐 Testing API endpoint...');
        
        // We need to get a valid teacher token first
        const teacher = await Teacher.findOne({
            teachSclass: classId,
            teachSubject: subjectId
        });

        if (!teacher) {
            console.log('❌ No teacher found for this class/subject');
            return;
        }

        console.log(`👨‍🏫 Found teacher: ${teacher.name}`);

        // Create a test JWT token (simplified for testing)
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { 
                id: teacher._id, 
                role: 'Teacher',
                email: teacher.email 
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '1h' }
        );

        // Test the API call
        const queryParams = new URLSearchParams({
            page: 1,
            limit: 10,
            classId: classId,
            subjectId: subjectId
        });

        try {
            const apiResponse = await axios.get(
                `http://localhost:5000/api/attendance/records?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('✅ API Response:', {
                success: apiResponse.data.success,
                recordsCount: apiResponse.data.data?.records?.length || 0,
                totalRecords: apiResponse.data.data?.pagination?.totalRecords || 0,
                message: apiResponse.data.message
            });

            if (apiResponse.data.data?.records?.length > 0) {
                console.log('📋 First API record:', {
                    studentName: apiResponse.data.data.records[0].studentId?.name,
                    status: apiResponse.data.data.records[0].status,
                    date: apiResponse.data.data.records[0].date,
                    session: apiResponse.data.data.records[0].session
                });
            }

        } catch (apiError) {
            console.error('❌ API Error:', {
                status: apiError.response?.status,
                message: apiError.response?.data?.message || apiError.message,
                url: apiError.config?.url
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
    }
}

// Run the test
testAttendanceHistory();