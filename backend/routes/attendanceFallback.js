const express = require('express');
const router = express.Router();

// Import all required models to ensure schemas are registered
const AttendanceRecord = require('../models/attendanceRecordSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const Sclass = require('../models/sclassSchema');

// Simple test endpoint without authentication
router.get('/test-records', async (req, res) => {
    try {
        console.log('🧪 Fallback test endpoint called at', new Date().toISOString());
        console.log('📋 Query params:', req.query);
        console.log('🌐 Request headers:', req.headers);
        console.log('🔗 Full URL:', req.originalUrl);

        const { classId, subjectId, page = 1, limit = 10 } = req.query;

        if (!classId || !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'Missing classId or subjectId',
                received: { classId, subjectId }
            });
        }

        // Get records without authentication for testing
        const skip = (page - 1) * limit;
        
        const records = await AttendanceRecord.find({
            classId: classId,
            subjectId: subjectId
        })
        .populate('studentId', 'name rollNum')
        .populate('teacherId', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const totalRecords = await AttendanceRecord.countDocuments({
            classId: classId,
            subjectId: subjectId
        });

        console.log(`✅ Found ${records.length} records out of ${totalRecords} total`);

        res.status(200).json({
            success: true,
            data: {
                records: records,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords: totalRecords,
                    hasNextPage: page < Math.ceil(totalRecords / limit),
                    hasPrevPage: page > 1
                }
            },
            message: 'Test records retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Fallback endpoint error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

// Fallback attendance marking endpoint
router.post('/mark', async (req, res) => {
    try {
        console.log('📝 Fallback mark attendance called at', new Date().toISOString());
        console.log('📋 Request body:', req.body);

        const { classId, subjectId, date, session, studentAttendance } = req.body;

        if (!classId || !subjectId || !date || !session || !studentAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['classId', 'subjectId', 'date', 'session', 'studentAttendance'],
                received: { classId, subjectId, date, session, studentAttendance }
            });
        }

        const results = [];
        
        for (const attendance of studentAttendance) {
            const { studentId, status } = attendance;
            
            if (!studentId || !status) {
                results.push({
                    studentId,
                    success: false,
                    message: 'Missing studentId or status'
                });
                continue;
            }

            try {
                // Check if attendance record already exists for this date/session
                const existingRecord = await AttendanceRecord.findOne({
                    classId,
                    subjectId,
                    studentId,
                    date: new Date(date),
                    session
                });

                if (existingRecord) {
                    // Update existing record
                    existingRecord.status = status;
                    existingRecord.lastModifiedAt = new Date();
                    existingRecord.lastModifiedBy = req.user?.id || 'system';
                    
                    await existingRecord.save();
                    
                    results.push({
                        studentId,
                        success: true,
                        message: 'Attendance updated successfully',
                        recordId: existingRecord._id
                    });
                } else {
                    // Use known IDs from existing records for fallback
                    const defaultTeacherId = '6902126bf91c442b648f6ba0'; // Dr. Data Structures Teacher
                    const defaultSchoolId = '6902126af91c442b648f6b8d'; // University School
                    
                    // Create new record
                    const newRecord = new AttendanceRecord({
                        classId,
                        subjectId,
                        studentId,
                        date: new Date(date),
                        session,
                        status,
                        teacherId: req.user?.id || defaultTeacherId,
                        markedBy: req.user?.id || defaultTeacherId,
                        schoolId: req.user?.school || defaultSchoolId,
                        markedAt: new Date()
                    });

                    await newRecord.save();
                    
                    results.push({
                        studentId,
                        success: true,
                        message: 'Attendance marked successfully',
                        recordId: newRecord._id
                    });
                }
            } catch (error) {
                console.error(`❌ Error marking attendance for student ${studentId}:`, error);
                results.push({
                    studentId,
                    success: false,
                    message: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;

        console.log(`✅ Marked attendance for ${successCount}/${totalCount} students`);

        res.status(200).json({
            success: successCount > 0,
            message: `Attendance marked for ${successCount}/${totalCount} students`,
            results,
            summary: {
                total: totalCount,
                successful: successCount,
                failed: totalCount - successCount
            }
        });

    } catch (error) {
        console.error('❌ Fallback mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

// Test endpoint to check if attendance routes are working
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Attendance fallback routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;