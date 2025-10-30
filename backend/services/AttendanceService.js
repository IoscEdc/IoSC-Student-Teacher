const mongoose = require('mongoose');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const ValidationService = require('./ValidationService');
const SummaryService = require('./SummaryService');
const { 
    NotFoundError, 
    ValidationError, 
    DatabaseError, 
    AttendanceAuthorizationError,
    AttendanceAlreadyMarkedError,
    BulkOperationError 
} = require('../utils/errors');
const logger = require('../utils/logger');

class AttendanceService {
    /**
     * Get all students enrolled in a specific class for attendance marking
     * @param {string} classId - The class ID
     * @param {string} subjectId - The subject ID
     * @param {string} teacherId - The teacher ID for authorization
     * @returns {Promise<Array>} Array of students with their enrollment details
     */
    async getClassStudentsForAttendance(classId, subjectId, userId, userRole = 'Teacher') {
        try {
            // Validate user authorization
            await ValidationService.validateTeacherAssignment(userId, classId, subjectId, userRole);

            // Get all students enrolled in the class
            const students = await Student.find({ 
                sclassName: classId 
            }).select('_id name rollNum').sort({ rollNum: 1 });

            if (!students || students.length === 0) {
                throw new NotFoundError('Students', { classId, message: 'No students found in the specified class' });
            }

            logger.info('Retrieved class students for attendance', {
                classId,
                subjectId,
                userId,
                userRole,
                studentCount: students.length
            });

            return students.map(student => ({
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum
            }));
        } catch (error) {
            if (error.isOperational) {
                throw error; // Re-throw operational errors as-is
            }
            logger.error('Failed to get class students for attendance', {
                classId,
                subjectId,
                userId,
                userRole,
                error: error.message,
                stack: error.stack
            });
            throw new DatabaseError(`Failed to get class students: ${error.message}`, { classId, subjectId, userId });
        }
    }

    /**
     * Mark attendance for multiple students in a single operation
     * @param {Object} attendanceData - Bulk attendance data
     * @param {string} attendanceData.classId - Class ID
     * @param {string} attendanceData.subjectId - Subject ID
     * @param {string} attendanceData.teacherId - Teacher ID
     * @param {Date} attendanceData.date - Attendance date
     * @param {string} attendanceData.session - Session name
     * @param {Array} attendanceData.studentAttendance - Array of student attendance records
     * @param {Object} auditInfo - Audit information (IP, userAgent, etc.)
     * @returns {Promise<Object>} Result with success/failure counts and details
     */
    async markAttendance(attendanceData, auditInfo = {}) {
        return this.bulkMarkAttendance(attendanceData, auditInfo);
    }

    /**
     * Mark attendance for multiple students in bulk
     * @param {string} attendanceData.classId - Class ID
     * @param {string} attendanceData.subjectId - Subject ID
     * @param {string} attendanceData.teacherId - Teacher ID
     * @param {string} attendanceData.date - Date in YYYY-MM-DD format
     * @param {string} attendanceData.session - Session name
     * @param {Array} attendanceData.studentAttendance - Array of student attendance records
     * @param {Object} auditInfo - Audit information (IP, userAgent, etc.)
     * @returns {Promise<Object>} Result with success/failure counts and details
     */
    async bulkMarkAttendance(attendanceData, auditInfo = {}) {
        const { classId, subjectId, teacherId, date, session, studentAttendance, userRole = 'Teacher' } = attendanceData;
        
        try {
            // Validate user authorization
            await ValidationService.validateTeacherAssignment(teacherId, classId, subjectId, userRole);
            
            // Validate session configuration
            await ValidationService.validateSessionConfiguration(classId, subjectId, session);
            
            // Validate date range
            ValidationService.validateDateRange(date);

            const results = {
                successful: [],
                failed: [],
                totalProcessed: studentAttendance.length,
                successCount: 0,
                failureCount: 0
            };

            // Process each student's attendance
            for (const studentRecord of studentAttendance) {
                try {
                    const { studentId, status } = studentRecord;
                    
                    // Validate student enrollment
                    await ValidationService.validateStudentEnrollment(studentId, classId);

                    // Check if attendance already exists for this student, class, subject, date, and session
                    const existingRecord = await AttendanceRecord.findOne({
                        studentId,
                        classId,
                        subjectId,
                        date: new Date(date),
                        session
                    });

                    let attendanceRecord;
                    let auditAction;
                    let oldValues = null;

                    if (existingRecord) {
                        // Update existing record
                        oldValues = existingRecord.toObject();
                        existingRecord.status = status;
                        existingRecord.lastModifiedBy = teacherId;
                        existingRecord.lastModifiedAt = new Date();
                        attendanceRecord = await existingRecord.save();
                        auditAction = 'update';
                    } else {
                        // Create new record
                        attendanceRecord = new AttendanceRecord({
                            classId,
                            subjectId,
                            teacherId,
                            studentId,
                            date: new Date(date),
                            session,
                            status,
                            markedBy: teacherId,
                            schoolId: await this._getSchoolId(teacherId)
                        });
                        attendanceRecord = await attendanceRecord.save();
                        auditAction = 'create';
                    }

                    // Create audit log
                    await AttendanceAuditLog.createAuditLog({
                        recordId: attendanceRecord._id,
                        action: auditAction,
                        oldValues,
                        newValues: attendanceRecord.toObject(),
                        performedBy: teacherId,
                        performedByModel: 'teacher',
                        schoolId: attendanceRecord.schoolId,
                        ...auditInfo
                    });

                    // Update attendance summary
                    await SummaryService.updateStudentSummary(studentId, subjectId, classId);

                    results.successful.push({
                        studentId,
                        recordId: attendanceRecord._id,
                        status,
                        action: auditAction
                    });
                    results.successCount++;

                } catch (studentError) {
                    results.failed.push({
                        studentId: studentRecord.studentId,
                        error: studentError.message,
                        status: studentRecord.status
                    });
                    results.failureCount++;
                }
            }

            return results;

        } catch (error) {
            if (error.isOperational) {
                throw error; // Re-throw operational errors as-is
            }
            logger.error('Bulk attendance marking failed', {
                classId,
                subjectId,
                teacherId,
                date,
                session,
                studentCount: studentAttendance?.length,
                error: error.message,
                stack: error.stack
            });
            throw new DatabaseError(`Bulk attendance marking failed: ${error.message}`, { 
                classId, 
                subjectId, 
                teacherId, 
                date, 
                session 
            });
        }
    }

    /**
     * Update a single attendance record
     * @param {string} recordId - Attendance record ID
     * @param {Object} updateData - Data to update
     * @param {string} updatedBy - User ID performing the update
     * @param {Object} auditInfo - Audit information
     * @returns {Promise<Object>} Updated attendance record
     */
    async updateAttendance(recordId, updateData, updatedBy, auditInfo = {}) {
        try {
            const existingRecord = await AttendanceRecord.findById(recordId);
            if (!existingRecord) {
                throw new NotFoundError('Attendance record', { recordId });
            }

            // Validate authorization - only the teacher who marked or admin can update
            const updater = await Teacher.findById(updatedBy);
            if (!updater) {
                throw new NotFoundError('Teacher', { teacherId: updatedBy, message: 'Invalid user attempting to update attendance' });
            }

            // Store old values for audit
            const oldValues = existingRecord.toObject();

            // Update the record
            Object.assign(existingRecord, updateData);
            existingRecord.lastModifiedBy = updatedBy;
            existingRecord.lastModifiedAt = new Date();

            const updatedRecord = await existingRecord.save();

            // Create audit log
            await AttendanceAuditLog.createAuditLog({
                recordId: updatedRecord._id,
                action: 'update',
                oldValues,
                newValues: updatedRecord.toObject(),
                performedBy: updatedBy,
                performedByModel: 'teacher',
                schoolId: updatedRecord.schoolId,
                ...auditInfo
            });

            // Update attendance summary if status changed
            if (oldValues.status !== updatedRecord.status) {
                await SummaryService.updateStudentSummary(
                    updatedRecord.studentId, 
                    updatedRecord.subjectId, 
                    updatedRecord.classId
                );
            }

            return updatedRecord;

        } catch (error) {
            if (error.isOperational) {
                throw error; // Re-throw operational errors as-is
            }
            logger.error('Failed to update attendance record', {
                recordId,
                updateData,
                updatedBy,
                error: error.message,
                stack: error.stack
            });
            throw new DatabaseError(`Failed to update attendance: ${error.message}`, { recordId, updatedBy });
        }
    }

    /**
     * Get attendance records with filtering options
     * @param {Object} filters - Filter criteria
     * @param {Object} options - Query options (pagination, sorting)
     * @returns {Promise<Object>} Filtered attendance records with metadata
     */
    async getAttendanceByFilters(filters = {}, options = {}) {
        try {
            const {
                classId,
                subjectId,
                teacherId,
                studentId,
                startDate,
                endDate,
                status,
                session,
                schoolId
            } = filters;

            const {
                page = 1,
                limit = 50,
                sortBy = 'date',
                sortOrder = 'desc',
                populate = true
            } = options;

            // Build query
            const query = {};
            
            if (classId) query.classId = classId;
            if (subjectId) query.subjectId = subjectId;
            if (teacherId) query.teacherId = teacherId;
            if (studentId) query.studentId = studentId;
            if (status) query.status = status;
            if (session) query.session = session;
            if (schoolId) query.schoolId = schoolId;

            // Date range filter
            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = new Date(startDate);
                if (endDate) query.date.$lte = new Date(endDate);
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query
            let queryBuilder = AttendanceRecord.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);

            if (populate) {
                queryBuilder = queryBuilder
                    .populate('studentId', 'name rollNum')
                    .populate('teacherId', 'name email')
                    .populate('subjectId', 'subName subCode')
                    .populate('classId', 'sclassName');
            }

            const records = await queryBuilder;
            const totalRecords = await AttendanceRecord.countDocuments(query);
            const totalPages = Math.ceil(totalRecords / limit);

            return {
                records,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalRecords,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };

        } catch (error) {
            throw new Error(`Failed to get attendance records: ${error.message}`);
        }
    }

    /**
     * Get attendance summary for a specific date and session
     * @param {string} classId - Class ID
     * @param {string} subjectId - Subject ID
     * @param {Date} date - Attendance date
     * @param {string} session - Session name
     * @returns {Promise<Object>} Attendance summary with counts
     */
    async getSessionSummary(classId, subjectId, date, session) {
        try {
            const pipeline = [
                {
                    $match: {
                        classId: mongoose.Types.ObjectId.isValid(classId) ? new mongoose.Types.ObjectId(classId) : classId,
                        subjectId: mongoose.Types.ObjectId.isValid(subjectId) ? new mongoose.Types.ObjectId(subjectId) : subjectId,
                        date: new Date(date),
                        session: session
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        students: { $push: '$studentId' }
                    }
                }
            ];

            const results = await AttendanceRecord.aggregate(pipeline);
            
            const summary = {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                total: 0,
                details: {}
            };

            results.forEach(result => {
                summary[result._id] = result.count;
                summary.total += result.count;
                summary.details[result._id] = result.students;
            });

            return summary;

        } catch (error) {
            throw new Error(`Failed to get session summary: ${error.message}`);
        }
    }

    /**
     * Delete an attendance record (admin only)
     * @param {string} recordId - Attendance record ID
     * @param {string} deletedBy - Admin user ID
     * @param {string} reason - Reason for deletion
     * @param {Object} auditInfo - Audit information
     * @returns {Promise<boolean>} Success status
     */
    async deleteAttendance(recordId, deletedBy, reason, auditInfo = {}) {
        try {
            const record = await AttendanceRecord.findById(recordId);
            if (!record) {
                throw new Error('Attendance record not found');
            }

            // Store record data for audit before deletion
            const recordData = record.toObject();

            // Create audit log before deletion
            await AttendanceAuditLog.createAuditLog({
                recordId: record._id,
                action: 'delete',
                oldValues: recordData,
                newValues: null,
                performedBy: deletedBy,
                performedByModel: 'admin',
                reason,
                schoolId: record.schoolId,
                ...auditInfo
            });

            // Delete the record
            await AttendanceRecord.findByIdAndDelete(recordId);

            // Update attendance summary
            await SummaryService.updateStudentSummary(
                record.studentId, 
                record.subjectId, 
                record.classId
            );

            return true;

        } catch (error) {
            throw new Error(`Failed to delete attendance: ${error.message}`);
        }
    }

    /**
     * Helper method to get school ID from teacher
     * @private
     */
    async _getSchoolId(teacherId) {
        const teacher = await Teacher.findById(teacherId).select('school');
        if (!teacher) {
            throw new Error('Teacher not found');
        }
        return teacher.school;
    }
}

module.exports = new AttendanceService();