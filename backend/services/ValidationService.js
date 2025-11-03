const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const SessionConfiguration = require('../models/sessionConfigurationSchema');
const Subject = require('../models/subjectSchema');
const SClass = require('../models/sclassSchema');
const { 
    NotFoundError, 
    ValidationError, 
    AttendanceAuthorizationError,
    StudentNotEnrolledError,
    InvalidSessionError 
} = require('../utils/errors');
const logger = require('../utils/logger');

class ValidationService {
    /**
     * Validate that a teacher is assigned to teach a specific class and subject
     * @param {string} teacherId - Teacher ID
     * @param {string} classId - Class ID
     * @param {string} subjectId - Subject ID
     * @returns {Promise<boolean>} True if valid, throws error if not
     */
    async validateTeacherAssignment(userId, classId, subjectId, userRole = 'Teacher') {
        try {
            // If user is admin, skip teacher assignment validation
            if (userRole === 'Admin') {
                logger.info('Admin user - skipping teacher assignment validation', {
                    userId,
                    classId,
                    subjectId,
                    userRole
                });
                return true;
            }

            const teacher = await Teacher.findById(userId);
            if (!teacher) {
                throw new NotFoundError('Teacher', { teacherId: userId });
            }

            // Check if teacher is assigned to the class
            if (teacher.teachSclass.toString() !== classId.toString()) {
                throw new AttendanceAuthorizationError(userId, classId, subjectId);
            }

            // Check if teacher is assigned to the subject
            if (teacher.teachSubject && teacher.teachSubject.toString() !== subjectId.toString()) {
                throw new AttendanceAuthorizationError(userId, classId, subjectId);
            }

            logger.info('Teacher assignment validated successfully', {
                teacherId: userId,
                classId,
                subjectId
            });

            return true;
        } catch (error) {
            if (error.isOperational) {
                throw error; // Re-throw operational errors as-is
            }
            logger.error('Teacher assignment validation failed', {
                userId,
                classId,
                subjectId,
                error: error.message,
                stack: error.stack
            });
            throw new ValidationError(`Teacher assignment validation failed: ${error.message}`, { 
                userId, 
                classId, 
                subjectId 
            });
        }
    }

    /**
     * Validate that a student is enrolled in a specific class
     * @param {string} studentId - Student ID
     * @param {string} classId - Class ID
     * @returns {Promise<boolean>} True if valid, throws error if not
     */
    async validateStudentEnrollment(studentId, classId) {
        try {
            const student = await Student.findById(studentId);
            if (!student) {
                throw new NotFoundError('Student', { studentId });
            }

            if (student.sclassName.toString() !== classId.toString()) {
                throw new StudentNotEnrolledError(studentId, classId);
            }

            return true;
        } catch (error) {
            if (error.isOperational) {
                throw error; // Re-throw operational errors as-is
            }
            logger.error('Student enrollment validation failed', {
                studentId,
                classId,
                error: error.message,
                stack: error.stack
            });
            throw new ValidationError(`Student enrollment validation failed: ${error.message}`, { 
                studentId, 
                classId 
            });
        }
    }

    /**
 * Validate session configuration for a class and subject
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} session - Session name (e.g., "Lecture 1", "Lab 2")
 * @returns {Promise<Object>} Session configuration if valid, throws error if not
 */
async validateSessionConfiguration(classId, subjectId, session) {
    try {
        // Check if session name is valid for the subject-class combination
        const validationResult = await SessionConfiguration.validateSessionName(
            subjectId, 
            classId, 
            session
        );

        if (!validationResult.isValid) {
            // Get all valid session names for better error message
            const validSessions = await SessionConfiguration.getAllSessionNames(subjectId, classId);
            
            // ⭐ ADD THIS: If no configurations exist, allow default sessions
            if (!validSessions || validSessions.length === 0) {
                const defaultSessions = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lab', 'Tutorial'];
                
                if (!defaultSessions.includes(session)) {
                    throw new Error(
                        `Invalid session "${session}". Valid default sessions are: ${defaultSessions.join(', ')}`
                    );
                }
                
                // Return a mock configuration for default sessions
                logger.warn('No session configurations found, using default sessions', {
                    classId,
                    subjectId,
                    session
                });
                
                return {
                    isValid: true,
                    configuration: {
                        sessionName: session,
                        isDefault: true
                    }
                };
            }
            
            throw new Error(
                `Invalid session "${session}". Valid sessions are: ${validSessions.join(', ')}`
            );
        }

        return validationResult.configuration;
    } catch (error) {
        // ⭐ ADD THIS: Catch and handle when no configurations exist at all
        if (error.message.includes('No session configurations found') || 
            error.message.includes('Valid sessions are: ')) {
            
            const defaultSessions = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lab', 'Tutorial'];
            
            if (defaultSessions.includes(session)) {
                logger.warn('Using default session configuration', {
                    classId,
                    subjectId,
                    session
                });
                
                return {
                    sessionName: session,
                    isDefault: true
                };
            }
        }
        
        throw new Error(`Session configuration validation failed: ${error.message}`);
    }
}

    /**
     * Validate that the attendance date is within acceptable range
     * @param {Date} date - Attendance date
     * @param {Object} options - Validation options
     * @returns {boolean} True if valid, throws error if not
     */
    validateDateRange(date, options = {}) {
        try {
            const attendanceDate = new Date(date);
            const today = new Date();
            
            // Set time to start of day for comparison
            today.setHours(0, 0, 0, 0);
            attendanceDate.setHours(0, 0, 0, 0);

            const {
                maxFutureDays = 0, // Don't allow future dates by default
                maxPastDays = 30,   // Allow up to 30 days in the past
                allowWeekends = true
            } = options;

            // Check if date is too far in the future
            const maxFutureDate = new Date(today);
            maxFutureDate.setDate(maxFutureDate.getDate() + maxFutureDays);
            
            if (attendanceDate > maxFutureDate) {
                throw new Error(`Attendance date cannot be more than ${maxFutureDays} days in the future`);
            }

            // Check if date is too far in the past
            const maxPastDate = new Date(today);
            maxPastDate.setDate(maxPastDate.getDate() - maxPastDays);
            
            if (attendanceDate < maxPastDate) {
                throw new Error(`Attendance date cannot be more than ${maxPastDays} days in the past`);
            }

            // Check weekend restriction if applicable
            if (!allowWeekends) {
                const dayOfWeek = attendanceDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
                    throw new Error('Attendance cannot be marked for weekends');
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Date range validation failed: ${error.message}`);
        }
    }

    /**
     * Validate attendance status value
     * @param {string} status - Attendance status
     * @returns {boolean} True if valid, throws error if not
     */
    validateAttendanceStatus(status) {
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid attendance status "${status}". Valid statuses are: ${validStatuses.join(', ')}`);
        }

        return true;
    }

    /**
     * Validate that a class exists and is active
     * @param {string} classId - Class ID
     * @returns {Promise<Object>} Class object if valid, throws error if not
     */
    async validateClassExists(classId) {
        try {
            const sclass = await SClass.findById(classId);
            if (!sclass) {
                throw new Error('Class not found');
            }

            return sclass;
        } catch (error) {
            throw new Error(`Class validation failed: ${error.message}`);
        }
    }

    /**
     * Validate that a subject exists and is active
     * @param {string} subjectId - Subject ID
     * @returns {Promise<Object>} Subject object if valid, throws error if not
     */
    async validateSubjectExists(subjectId) {
        try {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                throw new Error('Subject not found');
            }

            return subject;
        } catch (error) {
            throw new Error(`Subject validation failed: ${error.message}`);
        }
    }

    /**
     * Validate bulk attendance data structure
     * @param {Array} studentAttendance - Array of student attendance records
     * @returns {boolean} True if valid, throws error if not
     */
    validateBulkAttendanceData(studentAttendance) {
        if (!Array.isArray(studentAttendance)) {
            throw new Error('Student attendance data must be an array');
        }

        if (studentAttendance.length === 0) {
            throw new Error('Student attendance data cannot be empty');
        }

        for (let i = 0; i < studentAttendance.length; i++) {
            const record = studentAttendance[i];
            
            if (!record.studentId) {
                throw new Error(`Student ID is required for record at index ${i}`);
            }

            if (!record.status) {
                throw new Error(`Attendance status is required for record at index ${i}`);
            }

            // Validate status
            this.validateAttendanceStatus(record.status);
        }

        return true;
    }

    /**
     * Validate attendance marking permissions based on time constraints
     * @param {Date} attendanceDate - Date of attendance being marked
     * @param {string} teacherId - Teacher ID
     * @param {Object} options - Time constraint options
     * @returns {Promise<boolean>} True if allowed, throws error if not
     */
    async validateAttendanceMarkingTime(attendanceDate, teacherId, options = {}) {
        try {
            const {
                maxEditWindowHours = 168, // 7 days default
                allowSameDayOnly = false
            } = options;

            const now = new Date();
            const markingDate = new Date(attendanceDate);
            const hoursDifference = Math.abs(now - markingDate) / (1000 * 60 * 60);

            if (allowSameDayOnly) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                markingDate.setHours(0, 0, 0, 0);
                
                if (markingDate.getTime() !== today.getTime()) {
                    throw new Error('Attendance can only be marked for today');
                }
            } else if (hoursDifference > maxEditWindowHours) {
                throw new Error(`Attendance can only be marked within ${maxEditWindowHours} hours of the session date`);
            }

            return true;
        } catch (error) {
            throw new Error(`Attendance marking time validation failed: ${error.message}`);
        }
    }

    /**
     * Validate user permissions for attendance operations
     * @param {string} userId - User ID
     * @param {string} userRole - User role (teacher, admin)
     * @param {string} operation - Operation being performed
     * @param {Object} context - Additional context for validation
     * @returns {Promise<boolean>} True if authorized, throws error if not
     */
    async validateUserPermissions(userId, userRole, operation, context = {}) {
        try {
            const allowedOperations = {
                teacher: ['mark', 'update', 'view'],
                admin: ['mark', 'update', 'view', 'delete', 'bulk_manage']
            };

            if (!allowedOperations[userRole]) {
                throw new Error('Invalid user role');
            }

            if (!allowedOperations[userRole].includes(operation)) {
                throw new Error(`User role "${userRole}" is not authorized to perform "${operation}" operation`);
            }

            // Additional context-based validations
            if (userRole === 'teacher' && (operation === 'mark' || operation === 'update')) {
                const { classId, subjectId } = context;
                if (classId && subjectId) {
                    await this.validateTeacherAssignment(userId, classId, subjectId);
                }
            }

            return true;
        } catch (error) {
            throw new Error(`User permission validation failed: ${error.message}`);
        }
    }

    /**
     * Comprehensive validation for attendance marking request
     * @param {Object} attendanceData - Complete attendance data
     * @param {string} userId - User performing the operation
     * @param {string} userRole - User role
     * @returns {Promise<boolean>} True if all validations pass
     */
    async validateAttendanceMarkingRequest(attendanceData, userId, userRole) {
        try {
            const { classId, subjectId, teacherId, date, session, studentAttendance } = attendanceData;

            // Validate required fields
            if (!classId || !subjectId || !teacherId || !date || !session || !studentAttendance) {
                throw new Error('Missing required fields in attendance data');
            }

            // Validate user permissions
            await this.validateUserPermissions(userId, userRole, 'mark', { classId, subjectId });

            // Validate class and subject exist
            await this.validateClassExists(classId);
            await this.validateSubjectExists(subjectId);

            // Validate teacher assignment
            await this.validateTeacherAssignment(teacherId, classId, subjectId);

            // Validate session configuration
            await this.validateSessionConfiguration(classId, subjectId, session);

            // Validate date range
            this.validateDateRange(date);

            // Validate bulk attendance data
            this.validateBulkAttendanceData(studentAttendance);

            // Validate attendance marking time constraints
            await this.validateAttendanceMarkingTime(date, teacherId);

            return true;
        } catch (error) {
            throw new Error(`Attendance marking validation failed: ${error.message}`);
        }
    }
}

module.exports = new ValidationService();