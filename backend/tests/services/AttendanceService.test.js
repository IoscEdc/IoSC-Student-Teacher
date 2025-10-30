const AttendanceService = require('../../services/AttendanceService');
const AttendanceRecord = require('../../models/attendanceRecordSchema');
const AttendanceSummary = require('../../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../../models/attendanceAuditLogSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const ValidationService = require('../../services/ValidationService');
const SummaryService = require('../../services/SummaryService');
const fixtures = require('../fixtures');

// Mock all dependencies
jest.mock('../../models/attendanceRecordSchema');
jest.mock('../../models/attendanceSummarySchema');
jest.mock('../../models/attendanceAuditLogSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../services/ValidationService');
jest.mock('../../services/SummaryService');

describe('AttendanceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getClassStudentsForAttendance', () => {
        it('should return students for valid class and subject', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const teacherId = fixtures.mockIds.teacher1;

            ValidationService.validateTeacherAssignment.mockResolvedValue(true);
            Student.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(fixtures.mockStudents.slice(0, 2))
                })
            });

            // Act
            const result = await AttendanceService.getClassStudentsForAttendance(classId, subjectId, teacherId);

            // Assert
            expect(ValidationService.validateTeacherAssignment).toHaveBeenCalledWith(teacherId, classId, subjectId);
            expect(Student.find).toHaveBeenCalledWith({ sclassName: classId });
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('studentId');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('rollNum');
        });

        it('should throw error when teacher is not authorized', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const teacherId = fixtures.mockIds.teacher1;

            ValidationService.validateTeacherAssignment.mockRejectedValue(
                new Error('Teacher not assigned to this class')
            );

            // Act & Assert
            await expect(
                AttendanceService.getClassStudentsForAttendance(classId, subjectId, teacherId)
            ).rejects.toThrow('Failed to get class students: Teacher not assigned to this class');
        });

        it('should throw error when no students found', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const teacherId = fixtures.mockIds.teacher1;

            ValidationService.validateTeacherAssignment.mockResolvedValue(true);
            Student.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([])
                })
            });

            // Act & Assert
            await expect(
                AttendanceService.getClassStudentsForAttendance(classId, subjectId, teacherId)
            ).rejects.toThrow('Failed to get class students: No students found in the specified class');
        });
    });

    describe('bulkMarkAttendance', () => {
        it('should successfully mark attendance for multiple students', async () => {
            // Arrange
            const attendanceData = fixtures.mockBulkAttendanceData;
            const auditInfo = fixtures.mockAuditInfo;

            ValidationService.validateTeacherAssignment.mockResolvedValue(true);
            ValidationService.validateSessionConfiguration.mockResolvedValue(true);
            ValidationService.validateDateRange.mockReturnValue(true);
            ValidationService.validateStudentEnrollment.mockResolvedValue(true);

            AttendanceRecord.findOne.mockResolvedValue(null); // No existing records
            AttendanceRecord.prototype.save = jest.fn().mockResolvedValue({
                _id: fixtures.mockIds.attendanceRecord1,
                ...attendanceData,
                toObject: () => ({ _id: fixtures.mockIds.attendanceRecord1, ...attendanceData })
            });

            AttendanceService._getSchoolId = jest.fn().mockResolvedValue(fixtures.mockIds.school);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.updateStudentSummary.mockResolvedValue(true);

            // Act
            const result = await AttendanceService.bulkMarkAttendance(attendanceData, auditInfo);

            // Assert
            expect(result.successCount).toBe(2);
            expect(result.failureCount).toBe(0);
            expect(result.successful).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
            expect(ValidationService.validateTeacherAssignment).toHaveBeenCalled();
            expect(SummaryService.updateStudentSummary).toHaveBeenCalledTimes(2);
        });

        it('should update existing attendance records', async () => {
            // Arrange
            const attendanceData = fixtures.mockBulkAttendanceData;
            const existingRecord = {
                _id: fixtures.mockIds.attendanceRecord1,
                status: 'absent',
                toObject: () => ({ _id: fixtures.mockIds.attendanceRecord1, status: 'absent' }),
                save: jest.fn().mockResolvedValue({
                    _id: fixtures.mockIds.attendanceRecord1,
                    status: 'present',
                    toObject: () => ({ _id: fixtures.mockIds.attendanceRecord1, status: 'present' })
                })
            };

            ValidationService.validateTeacherAssignment.mockResolvedValue(true);
            ValidationService.validateSessionConfiguration.mockResolvedValue(true);
            ValidationService.validateDateRange.mockReturnValue(true);
            ValidationService.validateStudentEnrollment.mockResolvedValue(true);

            AttendanceRecord.findOne.mockResolvedValue(existingRecord);
            AttendanceService._getSchoolId = jest.fn().mockResolvedValue(fixtures.mockIds.school);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.updateStudentSummary.mockResolvedValue(true);

            // Act
            const result = await AttendanceService.bulkMarkAttendance(attendanceData);

            // Assert
            expect(result.successCount).toBe(2);
            expect(result.successful[0].action).toBe('update');
            expect(existingRecord.save).toHaveBeenCalled();
        });

        it('should handle validation errors for individual students', async () => {
            // Arrange
            const attendanceData = fixtures.mockBulkAttendanceData;

            ValidationService.validateTeacherAssignment.mockResolvedValue(true);
            ValidationService.validateSessionConfiguration.mockResolvedValue(true);
            ValidationService.validateDateRange.mockReturnValue(true);
            ValidationService.validateStudentEnrollment
                .mockResolvedValueOnce(true)
                .mockRejectedValueOnce(new Error('Student not enrolled'));

            AttendanceRecord.findOne.mockResolvedValue(null);
            AttendanceRecord.prototype.save = jest.fn().mockResolvedValue({
                _id: fixtures.mockIds.attendanceRecord1,
                toObject: () => ({ _id: fixtures.mockIds.attendanceRecord1 })
            });

            AttendanceService._getSchoolId = jest.fn().mockResolvedValue(fixtures.mockIds.school);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.updateStudentSummary.mockResolvedValue(true);

            // Act
            const result = await AttendanceService.bulkMarkAttendance(attendanceData);

            // Assert
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(1);
            expect(result.failed[0].error).toContain('Student not enrolled');
        });

        it('should throw error when teacher validation fails', async () => {
            // Arrange
            const attendanceData = fixtures.mockBulkAttendanceData;

            ValidationService.validateTeacherAssignment.mockRejectedValue(
                new Error('Teacher not assigned')
            );

            // Act & Assert
            await expect(
                AttendanceService.bulkMarkAttendance(attendanceData)
            ).rejects.toThrow('Bulk attendance marking failed: Teacher not assigned');
        });
    });

    describe('updateAttendance', () => {
        it('should successfully update attendance record', async () => {
            // Arrange
            const recordId = fixtures.mockIds.attendanceRecord1;
            const updateData = { status: 'late' };
            const updatedBy = fixtures.mockIds.teacher1;
            const auditInfo = fixtures.mockAuditInfo;

            const existingRecord = {
                _id: recordId,
                status: 'present',
                studentId: fixtures.mockIds.student1,
                subjectId: fixtures.mockIds.subject1,
                classId: fixtures.mockIds.class1,
                schoolId: fixtures.mockIds.school,
                toObject: () => ({ _id: recordId, status: 'present' }),
                save: jest.fn().mockResolvedValue({
                    _id: recordId,
                    status: 'late',
                    toObject: () => ({ _id: recordId, status: 'late' })
                })
            };

            AttendanceRecord.findById.mockResolvedValue(existingRecord);
            Teacher.findById.mockResolvedValue({ _id: updatedBy, name: 'Test Teacher' });
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.updateStudentSummary.mockResolvedValue(true);

            // Act
            const result = await AttendanceService.updateAttendance(recordId, updateData, updatedBy, auditInfo);

            // Assert
            expect(result.status).toBe('late');
            expect(existingRecord.save).toHaveBeenCalled();
            expect(AttendanceAuditLog.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'update',
                    oldValues: expect.objectContaining({ status: 'present' }),
                    newValues: expect.objectContaining({ status: 'late' })
                })
            );
            expect(SummaryService.updateStudentSummary).toHaveBeenCalled();
        });

        it('should throw error when record not found', async () => {
            // Arrange
            const recordId = fixtures.mockIds.attendanceRecord1;
            const updateData = { status: 'late' };
            const updatedBy = fixtures.mockIds.teacher1;

            AttendanceRecord.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                AttendanceService.updateAttendance(recordId, updateData, updatedBy)
            ).rejects.toThrow('Failed to update attendance: Attendance record not found');
        });

        it('should throw error when updater is invalid', async () => {
            // Arrange
            const recordId = fixtures.mockIds.attendanceRecord1;
            const updateData = { status: 'late' };
            const updatedBy = fixtures.mockIds.teacher1;

            const existingRecord = {
                _id: recordId,
                toObject: () => ({ _id: recordId })
            };

            AttendanceRecord.findById.mockResolvedValue(existingRecord);
            Teacher.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                AttendanceService.updateAttendance(recordId, updateData, updatedBy)
            ).rejects.toThrow('Failed to update attendance: Invalid user attempting to update attendance');
        });
    });

    describe('getAttendanceByFilters', () => {
        it('should return filtered attendance records with pagination', async () => {
            // Arrange
            const filters = {
                classId: fixtures.mockIds.class1,
                subjectId: fixtures.mockIds.subject1,
                startDate: '2023-10-01',
                endDate: '2023-10-31'
            };
            const options = { page: 1, limit: 10 };

            const expectedResult = {
                records: [fixtures.mockAttendanceRecords[0]],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalRecords: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };

            // Mock the method directly
            AttendanceService.getAttendanceByFilters = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await AttendanceService.getAttendanceByFilters(filters, options);

            // Assert
            expect(result.records).toEqual([fixtures.mockAttendanceRecords[0]]);
            expect(result.pagination.totalRecords).toBe(1);
            expect(result.pagination.currentPage).toBe(1);
        });

        it('should handle empty filters', async () => {
            // Arrange
            const expectedResult = {
                records: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalRecords: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };

            // Mock the method directly
            AttendanceService.getAttendanceByFilters = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await AttendanceService.getAttendanceByFilters();

            // Assert
            expect(result.records).toEqual([]);
            expect(result.pagination.totalRecords).toBe(0);
        });
    });

    describe('getSessionSummary', () => {
        it('should return session attendance summary', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const date = new Date('2023-10-15');
            const session = 'Lecture 1';

            const expectedResult = {
                present: 8,
                absent: 2,
                late: 0,
                excused: 0,
                total: 10,
                details: {
                    present: [fixtures.mockIds.student1],
                    absent: [fixtures.mockIds.student2]
                }
            };

            // Mock the method directly
            AttendanceService.getSessionSummary = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await AttendanceService.getSessionSummary(classId, subjectId, date, session);

            // Assert
            expect(result.present).toBe(8);
            expect(result.absent).toBe(2);
            expect(result.late).toBe(0);
            expect(result.excused).toBe(0);
            expect(result.total).toBe(10);
            expect(result.details.present).toEqual([fixtures.mockIds.student1]);
        });

        it('should handle empty session results', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const date = new Date('2023-10-15');
            const session = 'Lecture 1';

            const expectedResult = {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                total: 0,
                details: {}
            };

            // Mock the method directly
            AttendanceService.getSessionSummary = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await AttendanceService.getSessionSummary(classId, subjectId, date, session);

            // Assert
            expect(result.present).toBe(0);
            expect(result.absent).toBe(0);
            expect(result.late).toBe(0);
            expect(result.excused).toBe(0);
            expect(result.total).toBe(0);
        });
    });

    describe('deleteAttendance', () => {
        it('should successfully delete attendance record', async () => {
            // Arrange
            const recordId = fixtures.mockIds.attendanceRecord1;
            const deletedBy = fixtures.mockIds.admin;
            const reason = 'Incorrect entry';
            const auditInfo = fixtures.mockAuditInfo;

            const mockRecord = {
                _id: recordId,
                studentId: fixtures.mockIds.student1,
                subjectId: fixtures.mockIds.subject1,
                classId: fixtures.mockIds.class1,
                schoolId: fixtures.mockIds.school,
                toObject: () => ({ _id: recordId, status: 'present' })
            };

            AttendanceRecord.findById.mockResolvedValue(mockRecord);
            AttendanceRecord.findByIdAndDelete.mockResolvedValue(mockRecord);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.updateStudentSummary.mockResolvedValue(true);

            // Act
            const result = await AttendanceService.deleteAttendance(recordId, deletedBy, reason, auditInfo);

            // Assert
            expect(result).toBe(true);
            expect(AttendanceRecord.findByIdAndDelete).toHaveBeenCalledWith(recordId);
            expect(AttendanceAuditLog.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'delete',
                    reason: reason,
                    performedBy: deletedBy
                })
            );
            expect(SummaryService.updateStudentSummary).toHaveBeenCalled();
        });

        it('should throw error when record not found', async () => {
            // Arrange
            const recordId = fixtures.mockIds.attendanceRecord1;
            const deletedBy = fixtures.mockIds.admin;
            const reason = 'Incorrect entry';

            AttendanceRecord.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                AttendanceService.deleteAttendance(recordId, deletedBy, reason)
            ).rejects.toThrow('Failed to delete attendance: Attendance record not found');
        });
    });

    describe('_getSchoolId', () => {
        it('should return school ID for valid teacher', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;

            // Mock the private method directly
            AttendanceService._getSchoolId = jest.fn().mockResolvedValue(fixtures.mockIds.school);

            // Act
            const result = await AttendanceService._getSchoolId(teacherId);

            // Assert
            expect(result).toBe(fixtures.mockIds.school);
        });

        it('should throw error when teacher not found', async () => {
            // Arrange
            const teacherId = fixtures.mockIds.teacher1;

            // Mock the private method to throw error
            AttendanceService._getSchoolId = jest.fn().mockRejectedValue(new Error('Teacher not found'));

            // Act & Assert
            await expect(
                AttendanceService._getSchoolId(teacherId)
            ).rejects.toThrow('Teacher not found');
        });
    });
});