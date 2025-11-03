// Fixed fallback attendance controller with ACTUAL database saving
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const mongoose = require('mongoose');

const markAttendanceSimple = async (req, res) => {
    try {
        const { classId, subjectId, date, session, studentAttendance } = req.body;
        
        console.log('📝 Marking attendance - Request body:', {
            classId,
            subjectId,
            date,
            session,
            studentCount: studentAttendance?.length
        });

        // Validation
        if (!classId || !subjectId || !date || !session || !studentAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: classId, subjectId, date, session, studentAttendance'
            });
        }

        if (!Array.isArray(studentAttendance) || studentAttendance.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'studentAttendance must be a non-empty array'
            });
        }

        // Get teacher ID and school ID
        const teacherId = req.user?.id || req.user?._id || req.body.teacherId;
        const schoolId = req.user?.school || req.user?.schoolId; // ⭐ ADD THIS
        
        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID is required. Please log in.'
            });
        }

        if (!schoolId) { // ⭐ ADD THIS CHECK
            return res.status(400).json({
                success: false,
                message: 'School ID is required. User not properly configured.'
            });
        }

        console.log('👨‍🏫 Teacher ID:', teacherId);
        console.log('🏫 School ID:', schoolId);

        // Parse date properly
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const results = {
            successCount: 0,
            failureCount: 0,
            errors: [],
            saved: []
        };

        // Process each student
        for (const attendance of studentAttendance) {
            try {
                const { studentId, status } = attendance; // ⭐ Removed reason

                if (!studentId || !status) {
                    results.failureCount++;
                    results.errors.push({
                        studentId,
                        error: 'Missing studentId or status'
                    });
                    continue;
                }

                // Check if attendance already exists (with date range)
                const existingRecord = await AttendanceRecord.findOne({
                    studentId: new mongoose.Types.ObjectId(studentId),
                    classId: new mongoose.Types.ObjectId(classId),
                    subjectId: new mongoose.Types.ObjectId(subjectId),
                    date: { $gte: startOfDay, $lte: endOfDay }, // ⭐ FIXED
                    session: session
                });

                if (existingRecord) {
                    // Update existing record
                    existingRecord.status = status.toLowerCase();
                    existingRecord.lastModifiedBy = new mongoose.Types.ObjectId(teacherId);
                    existingRecord.lastModifiedAt = new Date();
                    
                    await existingRecord.save();
                    
                    results.successCount++;
                    results.saved.push({
                        studentId,
                        recordId: existingRecord._id,
                        action: 'updated'
                    });
                    
                    console.log('✅ Updated attendance for student:', studentId);
                } else {
                    // Create new record
                    const newRecord = new AttendanceRecord({
                        studentId: new mongoose.Types.ObjectId(studentId),
                        classId: new mongoose.Types.ObjectId(classId),
                        subjectId: new mongoose.Types.ObjectId(subjectId),
                        teacherId: new mongoose.Types.ObjectId(teacherId),
                        markedBy: new mongoose.Types.ObjectId(teacherId),
                        schoolId: new mongoose.Types.ObjectId(schoolId), // ⭐ FIXED
                        date: startOfDay, // ⭐ Use consistent date
                        session: session,
                        status: status.toLowerCase()
                    });

                    await newRecord.save();
                    
                    results.successCount++;
                    results.saved.push({
                        studentId,
                        recordId: newRecord._id,
                        action: 'created'
                    });
                    
                    console.log('✅ Created attendance for student:', studentId);
                }

            } catch (error) {
                console.error('❌ Error processing student attendance:', error); // ⭐ Re-enabled for debugging
                results.failureCount++;
                results.errors.push({
                    studentId: attendance.studentId,
                    error: error.message,
                    details: error.toString() // ⭐ More details
                });
            }
        }

        console.log('📊 Attendance marking results:', {
            total: studentAttendance.length,
            success: results.successCount,
            failures: results.failureCount
        });

        // Return response
        if (results.successCount > 0) {
            return res.status(200).json({
                success: true,
                data: {
                    successCount: results.successCount,
                    failureCount: results.failureCount,
                    saved: results.saved,
                    errors: results.errors.length > 0 ? results.errors : undefined
                },
                message: `Attendance marked successfully for ${results.successCount} out of ${studentAttendance.length} students`
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to mark attendance for any students',
                data: {
                    successCount: 0,
                    failureCount: results.failureCount,
                    errors: results.errors
                }
            });
        }

    } catch (error) {
        console.error('❌ Error in markAttendanceSimple:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Get attendance records with pagination and filtering
 * GET /attendance-fallback/test-records
 */
const getAttendanceRecords = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            classId,
            subjectId,
            teacherId,
            studentId,
            startDate,
            endDate,
            session,
            status,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        console.log('📥 Received query params:', {
            page, limit, classId, subjectId, teacherId, studentId,
            startDate, endDate, session, status, sortBy, sortOrder
        });

        // Validation
        if (!classId || !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'classId and subjectId are required',
                received: { classId, subjectId }
            });
        }

        // Build query
        const query = {
            classId: new mongoose.Types.ObjectId(classId),
            subjectId: new mongoose.Types.ObjectId(subjectId)
        };

        // Optional filters
        if (teacherId) {
            query.teacherId = new mongoose.Types.ObjectId(teacherId);
        }

        if (studentId) {
            query.studentId = new mongoose.Types.ObjectId(studentId);
        }

        if (session) {
            query.session = session;
        }

        if (status) {
            query.status = status.toLowerCase();
        }

        // Date filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const startDateTime = new Date(startDate);
                startDateTime.setHours(0, 0, 0, 0);
                query.date.$gte = startDateTime;
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.date.$lte = endDateTime;
            }
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        sortOptions['session'] = 1;
        sortOptions['studentId'] = 1;

        console.log('🔍 Query being executed:', JSON.stringify(query, null, 2));

        // Execute query with population
        const [records, totalRecords] = await Promise.all([
            AttendanceRecord.find(query)
                .populate('studentId', 'name rollNum email')
                .populate('teacherId', 'name email')
                .populate('markedBy', 'name email')
                .populate('classId', 'sclassName')
                .populate('subjectId', 'subName')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            AttendanceRecord.countDocuments(query)
        ]);

        console.log(`✅ Found ${records.length} records out of ${totalRecords} total`);

        return res.status(200).json({
            success: true,
            data: {
                records,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limitNum),
                    totalRecords,
                    recordsPerPage: limitNum,
                    hasNextPage: skip + records.length < totalRecords,
                    hasPrevPage: parseInt(page) > 1
                },
                filters: {
                    classId,
                    subjectId,
                    teacherId,
                    startDate,
                    endDate,
                    session,
                    status
                }
            },
            message: totalRecords === 0 
                ? 'No attendance records found for the given filters' 
                : `Retrieved ${records.length} attendance records`
        });

    } catch (error) {
        console.error('❌ Error fetching attendance records:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance records',
            error: error.message
        });
    }
};

/**
 * Get attendance statistics for a class/subject
 * GET /attendance-fallback/stats
 */
const getAttendanceStats = async (req, res) => {
    try {
        const { classId, subjectId, startDate, endDate } = req.query;

        if (!classId || !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'classId and subjectId are required'
            });
        }

        const query = {
            classId: new mongoose.Types.ObjectId(classId),
            subjectId: new mongoose.Types.ObjectId(subjectId)
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const stats = await AttendanceRecord.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);
        const statsObject = stats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                percentage: totalRecords > 0 ? ((stat.count / totalRecords) * 100).toFixed(2) : 0
            };
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            data: {
                stats: statsObject,
                totalRecords,
                filters: { classId, subjectId, startDate, endDate }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching attendance stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance statistics',
            error: error.message
        });
    }
};

/**
 * Get students for a class
 * GET /attendance-fallback/class/:classId/students
 */
const getClassStudentsSimple = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId } = req.query;
        
        console.log('📚 Getting students for class:', classId);

        // Get students from the class
        const students = await Student.find({ 
            sclassName: classId 
        }).select('_id name rollNum email').sort({ rollNum: 1 });

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in the specified class'
            });
        }

        const formattedStudents = students.map(student => ({
            _id: student._id,
            name: student.name,
            rollNum: student.rollNum,
            email: student.email,
            studentId: student._id
        }));

        console.log(`✅ Found ${formattedStudents.length} students`);

        res.status(200).json({
            success: true,
            data: formattedStudents,
            message: 'Students retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error in getClassStudentsSimple:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get class students'
        });
    }
};

module.exports = {
    getClassStudentsSimple,
    markAttendanceSimple,    // NOW WITH REAL SAVING!
    getAttendanceRecords,
    getAttendanceStats
};