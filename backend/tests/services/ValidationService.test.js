const ValidationService = require('../../services/ValidationService');
const Teacher = require('../../models/teacherSchema');
const Student = require('../../models/studentSchema');
const SessionConfiguration = require('../../models/sessionConfigurationSchema');
const Subject = require('../../models/subjectSchema');
const SClass = require('../../models/sclassSchema');
const fixtures = require('../fixtures');

// Mock all dependencies
jest.mock('../../models/teacherSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/sessionConfigurationSchema');
jest.mock('../../models/subjectSchema');
jest.mock('../../models/sclassSchema');

describe('ValidationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateTeacherAssignment', () => {
        it('should validate teacher assignment successfully', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;

            const mockTeacher = {
                _id: teacherId,
                teachSclass: classId,
                teachSubject: subjectId
            };

            Teacher.findById.mockResolvedValue(mockTeacher);

            // Act
            const result = await ValidationService.validateTeacherAssignment(teacherId, classId, subjectId);

            // Assert
            expect(result).toBe(true);
            expect(Teacher.findById).toHaveBeenCalledWith(teacherId);
        });

        it('should throw error when teacher not found', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;

            Teacher.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                ValidationService.validateTeacherAssignment(teacherId, classId, subjectId)
            ).rejects.toThrow('Teacher assignment validation failed: Teacher not found');
        });

        it('should throw error when teacher not assigned to class', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;

            const mockTeacher = {
                _id: teacherId,
                teachSclass: fixtures.mockIds.class2, // Different class
                teachSubject: subjectId
            };

            Teacher.findById.mockResolvedValue(mockTeacher);

            // Act & Assert
            await expect(
                ValidationService.validateTeacherAssignment(teacherId, classId, subjectId)
            ).rejects.toThrow('Teacher assignment validation failed: Teacher is not assigned to this class');
        });

        it('should throw error when teacher not assigned to subject', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;

            const mockTeacher = {
                _id: teacherId,
                teachSclass: classId,
                teachSubject: fixtures.mockIds.subject2 // Different subject
            };

            Teacher.findById.mockResolvedValue(mockTeacher);

            // Act & Assert
            await expect(
                ValidationService.validateTeacherAssignment(teacherId, classId, subjectId)
            ).rejects.toThrow('Teacher assignment validation failed: Teacher is not assigned to this subject');
        });

        it('should validate when teacher has no specific subject assignment', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;

            const mockTeacher = {
                _id: teacherId,
                teachSclass: classId,
                teachSubject: null // No specific subject
            };

            Teacher.findById.mockResolvedValue(mockTeacher);

            // Act
            const result = await ValidationService.validateTeacherAssignment(teacherId, classId, subjectId);

            // Assert
            expect(result).toBe(true);
        });
    });

    describe('validateStudentEnrollment', () => {
        it('should validate student enrollment successfully', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const classId = fixtures.mockIds.class1;

            const mockStudent = {
                _id: studentId,
                sclassName: classId
            };

            Student.findById.mockResolvedValue(mockStudent);

            // Act
            const result = await ValidationService.validateStudentEnrollment(studentId, classId);

            // Assert
            expect(result).toBe(true);
            expect(Student.findById).toHaveBeenCalledWith(studentId);
        });

        it('should throw error when student not found', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const classId = fixtures.mockIds.class1;

            Student.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                ValidationService.validateStudentEnrollment(studentId, classId)
            ).rejects.toThrow('Student enrollment validation failed: Student not found');
        });

        it('should throw error when student not enrolled in class', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const classId = fixtures.mockIds.class1;

            const mockStudent = {
                _id: studentId,
                sclassName: fixtures.mockIds.class2 // Different class
            };

            Student.findById.mockResolvedValue(mockStudent);

            // Act & Assert
            await expect(
                ValidationService.validateStudentEnrollment(studentId, classId)
            ).rejects.toThrow('Student enrollment validation failed: Student is not enrolled in this class');
        });
    });

    describe('validateSessionConfiguration', () => {
        it('should validate session configuration successfully', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const session = 'Lecture 1';

            const mockConfiguration = fixtures.mockSessionConfigurations[0];

            SessionConfiguration.validateSessionName.mockResolvedValue({
                isValid: true,
                configuration: mockConfiguration
            });

            // Act
            const result = await ValidationService.validateSessionConfiguration(classId, subjectId, session);

            // Assert
            expect(result).toEqual(mockConfiguration);
            expect(SessionConfiguration.validateSessionName).toHaveBeenCalledWith(subjectId, classId, session);
        });

        it('should throw error for invalid session', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const session = 'Invalid Session';

            SessionConfiguration.validateSessionName.mockResolvedValue({
                isValid: false
            });

            SessionConfiguration.getAllSessionNames.mockResolvedValue(['Lecture 1', 'Lecture 2', 'Lab 1']);

            // Act & Assert
            await expect(
                ValidationService.validateSessionConfiguration(classId, subjectId, session)
            ).rejects.toThrow('Session configuration validation failed: Invalid session "Invalid Session". Valid sessions are: Lecture 1, Lecture 2, Lab 1');
        });
    });

    describe('validateDateRange', () => {
        it('should validate current date successfully', () => {
            // Arrange
            const today = new Date();

            // Act
            const result = ValidationService.validateDateRange(today);

            // Assert
            expect(result).toBe(true);
        });

        it('should validate date within past range', () => {
            // Arrange
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

            // Act
            const result = ValidationService.validateDateRange(pastDate);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for future dates when not allowed', () => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

            // Act & Assert
            expect(() => {
                ValidationService.validateDateRange(futureDate);
            }).toThrow('Date range validation failed: Attendance date cannot be more than 0 days in the future');
        });

        it('should throw error for dates too far in the past', () => {
            // Arrange
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

            // Act & Assert
            expect(() => {
                ValidationService.validateDateRange(oldDate);
            }).toThrow('Date range validation failed: Attendance date cannot be more than 30 days in the past');
        });

        it('should allow future dates when configured', () => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2);
            const options = { maxFutureDays: 7 };

            // Act
            const result = ValidationService.validateDateRange(futureDate, options);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for weekends when not allowed', () => {
            // Arrange
            const today = new Date();
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + (6 - today.getDay())); // Next Saturday
            const options = { allowWeekends: false, maxFutureDays: 7 };

            // Act & Assert
            expect(() => {
                ValidationService.validateDateRange(saturday, options);
            }).toThrow('Date range validation failed: Attendance cannot be marked for weekends');
        });

        it('should allow weekends when configured', () => {
            // Arrange
            const today = new Date();
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + (6 - today.getDay())); // Next Saturday
            const options = { allowWeekends: true, maxFutureDays: 7 };

            // Act
            const result = ValidationService.validateDateRange(saturday, options);

            // Assert
            expect(result).toBe(true);
        });
    });

    describe('validateAttendanceStatus', () => {
        it('should validate present status', () => {
            // Act
            const result = ValidationService.validateAttendanceStatus('present');

            // Assert
            expect(result).toBe(true);
        });

        it('should validate absent status', () => {
            // Act
            const result = ValidationService.validateAttendanceStatus('absent');

            // Assert
            expect(result).toBe(true);
        });

        it('should validate late status', () => {
            // Act
            const result = ValidationService.validateAttendanceStatus('late');

            // Assert
            expect(result).toBe(true);
        });

        it('should validate excused status', () => {
            // Act
            const result = ValidationService.validateAttendanceStatus('excused');

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for invalid status', () => {
            // Act & Assert
            expect(() => {
                ValidationService.validateAttendanceStatus('invalid');
            }).toThrow('Invalid attendance status "invalid". Valid statuses are: present, absent, late, excused');
        });
    });

    describe('validateClassExists', () => {
        it('should validate existing class', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const mockClass = fixtures.mockClasses[0];

            SClass.findById.mockResolvedValue(mockClass);

            // Act
            const result = await ValidationService.validateClassExists(classId);

            // Assert
            expect(result).toEqual(mockClass);
            expect(SClass.findById).toHaveBeenCalledWith(classId);
        });

        it('should throw error when class not found', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;

            SClass.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                ValidationService.validateClassExists(classId)
            ).rejects.toThrow('Class validation failed: Class not found');
        });
    });

    describe('validateSubjectExists', () => {
        it('should validate existing subject', async () => {
            // Arrange
            const subjectId = fixtures.mockIds.subject1;
            const mockSubject = fixtures.mockSubjects[0];

            Subject.findById.mockResolvedValue(mockSubject);

            // Act
            const result = await ValidationService.validateSubjectExists(subjectId);

            // Assert
            expect(result).toEqual(mockSubject);
            expect(Subject.findById).toHaveBeenCalledWith(subjectId);
        });

        it('should throw error when subject not found', async () => {
            // Arrange
            const subjectId = fixtures.mockIds.subject1;

            Subject.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                ValidationService.validateSubjectExists(subjectId)
            ).rejects.toThrow('Subject validation failed: Subject not found');
        });
    });

    describe('validateBulkAttendanceData', () => {
        it('should validate correct bulk attendance data', () => {
            // Arrange
            const studentAttendance = [
                { studentId: fixtures.mockIds.student1, status: 'present' },
                { studentId: fixtures.mockIds.student2, status: 'absent' }
            ];

            // Act
            const result = ValidationService.validateBulkAttendanceData(studentAttendance);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for non-array data', () => {
            // Arrange
            const studentAttendance = 'not an array';

            // Act & Assert
            expect(() => {
                ValidationService.validateBulkAttendanceData(studentAttendance);
            }).toThrow('Student attendance data must be an array');
        });

        it('should throw error for empty array', () => {
            // Arrange
            const studentAttendance = [];

            // Act & Assert
            expect(() => {
                ValidationService.validateBulkAttendanceData(studentAttendance);
            }).toThrow('Student attendance data cannot be empty');
        });

        it('should throw error for missing student ID', () => {
            // Arrange
            const studentAttendance = [
                { status: 'present' } // Missing studentId
            ];

            // Act & Assert
            expect(() => {
                ValidationService.validateBulkAttendanceData(studentAttendance);
            }).toThrow('Student ID is required for record at index 0');
        });

        it('should throw error for missing status', () => {
            // Arrange
            const studentAttendance = [
                { studentId: fixtures.mockIds.student1 } // Missing status
            ];

            // Act & Assert
            expect(() => {
                ValidationService.validateBulkAttendanceData(studentAttendance);
            }).toThrow('Attendance status is required for record at index 0');
        });

        it('should throw error for invalid status', () => {
            // Arrange
            const studentAttendance = [
                { studentId: fixtures.mockIds.student1, status: 'invalid' }
            ];

            // Act & Assert
            expect(() => {
                ValidationService.validateBulkAttendanceData(studentAttendance);
            }).toThrow('Invalid attendance status "invalid". Valid statuses are: present, absent, late, excused');
        });
    });

    describe('validateAttendanceMarkingTime', () => {
        it('should validate marking for current date', async () => {
            // Arrange
            const today = new Date();
            const teacherId = fixtures.mockIds.teacher1;

            // Act
            const result = await ValidationService.validateAttendanceMarkingTime(today, teacherId);

            // Assert
            expect(result).toBe(true);
        });

        it('should validate marking within time window', async () => {
            // Arrange
            const recentDate = new Date();
            recentDate.setHours(recentDate.getHours() - 10); // 10 hours ago
            const teacherId = fixtures.mockIds.teacher1;

            // Act
            const result = await ValidationService.validateAttendanceMarkingTime(recentDate, teacherId);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for dates outside time window', async () => {
            // Arrange
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
            const teacherId = fixtures.mockIds.teacher1;

            // Act & Assert
            await expect(
                ValidationService.validateAttendanceMarkingTime(oldDate, teacherId)
            ).rejects.toThrow('Attendance marking time validation failed: Attendance can only be marked within 168 hours of the session date');
        });

        it('should validate same day only when configured', async () => {
            // Arrange
            const today = new Date();
            const teacherId = fixtures.mockIds.teacher1;
            const options = { allowSameDayOnly: true };

            // Act
            const result = await ValidationService.validateAttendanceMarkingTime(today, teacherId, options);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for non-same day when configured', async () => {
            // Arrange
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const teacherId = fixtures.mockIds.teacher1;
            const options = { allowSameDayOnly: true };

            // Act & Assert
            await expect(
                ValidationService.validateAttendanceMarkingTime(yesterday, teacherId, options)
            ).rejects.toThrow('Attendance marking time validation failed: Attendance can only be marked for today');
        });
    });

    describe('validateUserPermissions', () => {
        it('should validate teacher permissions for allowed operations', async () => {
            // Arrange
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';
            const operation = 'mark';

            // Act
            const result = await ValidationService.validateUserPermissions(userId, userRole, operation);

            // Assert
            expect(result).toBe(true);
        });

        it('should validate admin permissions for all operations', async () => {
            // Arrange
            const userId = fixtures.mockIds.admin;
            const userRole = 'admin';
            const operation = 'delete';

            // Act
            const result = await ValidationService.validateUserPermissions(userId, userRole, operation);

            // Assert
            expect(result).toBe(true);
        });

        it('should throw error for invalid user role', async () => {
            // Arrange
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'invalid';
            const operation = 'mark';

            // Act & Assert
            await expect(
                ValidationService.validateUserPermissions(userId, userRole, operation)
            ).rejects.toThrow('User permission validation failed: Invalid user role');
        });

        it('should throw error for unauthorized operation', async () => {
            // Arrange
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';
            const operation = 'delete'; // Teachers can't delete

            // Act & Assert
            await expect(
                ValidationService.validateUserPermissions(userId, userRole, operation)
            ).rejects.toThrow('User permission validation failed: User role "teacher" is not authorized to perform "delete" operation');
        });

        it('should validate teacher assignment for context-based operations', async () => {
            // Arrange
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';
            const operation = 'mark';
            const context = {
                classId: fixtures.mockIds.class1,
                subjectId: fixtures.mockIds.subject1
            };

            ValidationService.validateTeacherAssignment = jest.fn().mockResolvedValue(true);

            // Act
            const result = await ValidationService.validateUserPermissions(userId, userRole, operation, context);

            // Assert
            expect(result).toBe(true);
            expect(ValidationService.validateTeacherAssignment).toHaveBeenCalledWith(
                userId,
                context.classId,
                context.subjectId
            );
        });
    });

    describe('validateAttendanceMarkingRequest', () => {
        it('should validate complete attendance marking request', async () => {
            // Arrange
            const attendanceData = {
                classId: fixtures.mockIds.class1,
                subjectId: fixtures.mockIds.subject1,
                teacherId: fixtures.mockIds.teacher1,
                date: new Date(),
                session: 'Lecture 1',
                studentAttendance: [
                    { studentId: fixtures.mockIds.student1, status: 'present' }
                ]
            };
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';

            // Mock all validation methods
            ValidationService.validateUserPermissions = jest.fn().mockResolvedValue(true);
            ValidationService.validateClassExists = jest.fn().mockResolvedValue(fixtures.mockClasses[0]);
            ValidationService.validateSubjectExists = jest.fn().mockResolvedValue(fixtures.mockSubjects[0]);
            ValidationService.validateTeacherAssignment = jest.fn().mockResolvedValue(true);
            ValidationService.validateSessionConfiguration = jest.fn().mockResolvedValue(fixtures.mockSessionConfigurations[0]);
            ValidationService.validateDateRange = jest.fn().mockReturnValue(true);
            ValidationService.validateBulkAttendanceData = jest.fn().mockReturnValue(true);
            ValidationService.validateAttendanceMarkingTime = jest.fn().mockResolvedValue(true);

            // Act
            const result = await ValidationService.validateAttendanceMarkingRequest(attendanceData, userId, userRole);

            // Assert
            expect(result).toBe(true);
            expect(ValidationService.validateUserPermissions).toHaveBeenCalled();
            expect(ValidationService.validateClassExists).toHaveBeenCalled();
            expect(ValidationService.validateSubjectExists).toHaveBeenCalled();
            expect(ValidationService.validateTeacherAssignment).toHaveBeenCalled();
            expect(ValidationService.validateSessionConfiguration).toHaveBeenCalled();
            expect(ValidationService.validateDateRange).toHaveBeenCalled();
            expect(ValidationService.validateBulkAttendanceData).toHaveBeenCalled();
            expect(ValidationService.validateAttendanceMarkingTime).toHaveBeenCalled();
        });

        it('should throw error for missing required fields', async () => {
            // Arrange
            const attendanceData = {
                classId: fixtures.mockIds.class1,
                // Missing other required fields
            };
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';

            // Act & Assert
            await expect(
                ValidationService.validateAttendanceMarkingRequest(attendanceData, userId, userRole)
            ).rejects.toThrow('Attendance marking validation failed: Missing required fields in attendance data');
        });

        it('should propagate validation errors', async () => {
            // Arrange
            const attendanceData = {
                classId: fixtures.mockIds.class1,
                subjectId: fixtures.mockIds.subject1,
                teacherId: fixtures.mockIds.teacher1,
                date: new Date(),
                session: 'Lecture 1',
                studentAttendance: [
                    { studentId: fixtures.mockIds.student1, status: 'present' }
                ]
            };
            const userId = fixtures.mockIds.teacher1;
            const userRole = 'teacher';

            ValidationService.validateUserPermissions = jest.fn().mockRejectedValue(
                new Error('Permission denied')
            );

            // Act & Assert
            await expect(
                ValidationService.validateAttendanceMarkingRequest(attendanceData, userId, userRole)
            ).rejects.toThrow('Attendance marking validation failed: Permission denied');
        });
    });
});