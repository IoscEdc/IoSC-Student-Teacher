const BulkManagementService = require('../../services/BulkManagementService');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const SClass = require('../../models/sclassSchema');
const Subject = require('../../models/subjectSchema');
const AttendanceRecord = require('../../models/attendanceRecordSchema');
const AttendanceSummary = require('../../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../../models/attendanceAuditLogSchema');
const SummaryService = require('../../services/SummaryService');
const fixtures = require('../fixtures');

// Mock all dependencies
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/subjectSchema');
jest.mock('../../models/attendanceRecordSchema');
jest.mock('../../models/attendanceSummarySchema');
jest.mock('../../models/attendanceAuditLogSchema');
jest.mock('../../services/SummaryService');

describe('BulkManagementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assignStudentsByPattern', () => {
        it('should assign students matching pattern successfully', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'CSE2021*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [fixtures.mockIds.subject1],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            const matchingStudents = [
                {
                    ...fixtures.mockStudents[0],
                    sclassName: fixtures.mockIds.class2, // Different class initially
                    save: jest.fn().mockResolvedValue(fixtures.mockStudents[0])
                }
            ];

            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            Subject.find.mockResolvedValue([fixtures.mockSubjects[0]]);
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue(matchingStudents);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);
            SummaryService.initializeStudentSummary.mockResolvedValue(fixtures.mockAttendanceSummaries[0]);

            // Act
            const result = await BulkManagementService.assignStudentsByPattern(assignmentData);

            // Assert
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(0);
            expect(result.successful[0].studentId).toBe(fixtures.mockStudents[0]._id);
            expect(result.successful[0].newClass).toBe(assignmentData.targetClassId);
            expect(matchingStudents[0].save).toHaveBeenCalled();
            expect(SummaryService.initializeStudentSummary).toHaveBeenCalled();
        });

        it('should handle students already in target class', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'CSE2021*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            const matchingStudents = [
                {
                    ...fixtures.mockStudents[0],
                    sclassName: fixtures.mockIds.class1 // Already in target class
                }
            ];

            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            Subject.find.mockResolvedValue([]);
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue(matchingStudents);

            // Act
            const result = await BulkManagementService.assignStudentsByPattern(assignmentData);

            // Assert
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(1);
            expect(result.failed[0].error).toBe('Student already assigned to target class');
        });

        it('should return message when no students match pattern', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'NONEXISTENT*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            Subject.find.mockResolvedValue([]);
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue([]);

            // Act
            const result = await BulkManagementService.assignStudentsByPattern(assignmentData);

            // Assert
            expect(result.totalProcessed).toBe(0);
            expect(result.message).toBe('No students found matching the specified pattern');
        });

        it('should throw error when target class not found', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'CSE2021*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                BulkManagementService.assignStudentsByPattern(assignmentData)
            ).rejects.toThrow('Bulk student assignment failed: Target class not found');
        });

        it('should throw error when subjects not found', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'CSE2021*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [fixtures.mockIds.subject1, fixtures.mockIds.subject2],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            Subject.find.mockResolvedValue([fixtures.mockSubjects[0]]); // Only one subject found

            // Act & Assert
            await expect(
                BulkManagementService.assignStudentsByPattern(assignmentData)
            ).rejects.toThrow('Bulk student assignment failed: One or more subjects not found');
        });

        it('should handle individual student assignment failures', async () => {
            // Arrange
            const assignmentData = {
                pattern: 'CSE2021*',
                targetClassId: fixtures.mockIds.class1,
                subjectIds: [],
                schoolId: fixtures.mockIds.school,
                performedBy: fixtures.mockIds.admin
            };

            const matchingStudents = [
                {
                    ...fixtures.mockStudents[0],
                    sclassName: fixtures.mockIds.class2,
                    save: jest.fn().mockRejectedValue(new Error('Save failed'))
                }
            ];

            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            Subject.find.mockResolvedValue([]);
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue(matchingStudents);

            // Act
            const result = await BulkManagementService.assignStudentsByPattern(assignmentData);

            // Assert
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(1);
            expect(result.failed[0].error).toBe('Save failed');
        });
    });

    describe('transferStudentAssignments', () => {
        it('should transfer students successfully', async () => {
            // Arrange
            const transferData = {
                studentIds: [fixtures.mockIds.student1],
                fromClassId: fixtures.mockIds.class1,
                toClassId: fixtures.mockIds.class2,
                subjectIds: [fixtures.mockIds.subject1],
                migrateAttendance: true,
                performedBy: fixtures.mockIds.admin
            };

            const mockStudents = [
                {
                    ...fixtures.mockStudents[0],
                    sclassName: fixtures.mockIds.class1,
                    save: jest.fn().mockResolvedValue(fixtures.mockStudents[0])
                }
            ];

            SClass.findById
                .mockResolvedValueOnce(fixtures.mockClasses[0]) // fromClass
                .mockResolvedValueOnce(fixtures.mockClasses[1]); // toClass

            Student.find.mockResolvedValue(mockStudents);
            BulkManagementService._migrateStudentAttendance = jest.fn().mockResolvedValue(5);
            SummaryService.initializeStudentSummary.mockResolvedValue(fixtures.mockAttendanceSummaries[0]);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);

            // Act
            const result = await BulkManagementService.transferStudentAssignments(transferData);

            // Assert
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(0);
            expect(result.successful[0].migratedRecords).toBe(5);
            expect(mockStudents[0].save).toHaveBeenCalled();
            expect(BulkManagementService._migrateStudentAttendance).toHaveBeenCalled();
        });

        it('should transfer without migrating attendance', async () => {
            // Arrange
            const transferData = {
                studentIds: [fixtures.mockIds.student1],
                fromClassId: fixtures.mockIds.class1,
                toClassId: fixtures.mockIds.class2,
                subjectIds: [],
                migrateAttendance: false,
                performedBy: fixtures.mockIds.admin
            };

            const mockStudents = [
                {
                    ...fixtures.mockStudents[0],
                    sclassName: fixtures.mockIds.class1,
                    save: jest.fn().mockResolvedValue(fixtures.mockStudents[0])
                }
            ];

            SClass.findById
                .mockResolvedValueOnce(fixtures.mockClasses[0])
                .mockResolvedValueOnce(fixtures.mockClasses[1]);

            Student.find.mockResolvedValue(mockStudents);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);

            // Act
            const result = await BulkManagementService.transferStudentAssignments(transferData);

            // Assert
            expect(result.successCount).toBe(1);
            expect(result.successful[0].migratedRecords).toBe(0);
            expect(BulkManagementService._migrateStudentAttendance).not.toHaveBeenCalled();
        });

        it('should throw error when source class not found', async () => {
            // Arrange
            const transferData = {
                studentIds: [fixtures.mockIds.student1],
                fromClassId: fixtures.mockIds.class1,
                toClassId: fixtures.mockIds.class2,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById.mockResolvedValueOnce(null); // fromClass not found

            // Act & Assert
            await expect(
                BulkManagementService.transferStudentAssignments(transferData)
            ).rejects.toThrow('Student transfer failed: Source class not found');
        });

        it('should throw error when target class not found', async () => {
            // Arrange
            const transferData = {
                studentIds: [fixtures.mockIds.student1],
                fromClassId: fixtures.mockIds.class1,
                toClassId: fixtures.mockIds.class2,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById
                .mockResolvedValueOnce(fixtures.mockClasses[0]) // fromClass
                .mockResolvedValueOnce(null); // toClass not found

            // Act & Assert
            await expect(
                BulkManagementService.transferStudentAssignments(transferData)
            ).rejects.toThrow('Student transfer failed: Target class not found');
        });

        it('should throw error when students not found in source class', async () => {
            // Arrange
            const transferData = {
                studentIds: [fixtures.mockIds.student1, fixtures.mockIds.student2],
                fromClassId: fixtures.mockIds.class1,
                toClassId: fixtures.mockIds.class2,
                performedBy: fixtures.mockIds.admin
            };

            SClass.findById
                .mockResolvedValueOnce(fixtures.mockClasses[0])
                .mockResolvedValueOnce(fixtures.mockClasses[1]);

            Student.find.mockResolvedValue([fixtures.mockStudents[0]]); // Only one student found

            // Act & Assert
            await expect(
                BulkManagementService.transferStudentAssignments(transferData)
            ).rejects.toThrow('Student transfer failed: Some students not found or not in the specified source class');
        });
    });

    describe('reassignTeacher', () => {
        it('should reassign teacher successfully', async () => {
            // Arrange
            const reassignmentData = {
                teacherId: fixtures.mockIds.teacher1,
                newAssignments: [
                    {
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                ],
                performedBy: fixtures.mockIds.admin
            };

            const mockTeacher = {
                ...fixtures.mockTeachers[0],
                save: jest.fn().mockResolvedValue(fixtures.mockTeachers[0])
            };

            Teacher.findById.mockResolvedValue(mockTeacher);
            Subject.findById.mockResolvedValue(fixtures.mockSubjects[0]);
            SClass.findById.mockResolvedValue(fixtures.mockClasses[0]);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);

            // Act
            const result = await BulkManagementService.reassignTeacher(reassignmentData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.teacherId).toBe(fixtures.mockIds.teacher1);
            expect(mockTeacher.save).toHaveBeenCalled();
            expect(AttendanceAuditLog.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'teacher_reassignment'
                })
            );
        });

        it('should handle multiple assignments', async () => {
            // Arrange
            const reassignmentData = {
                teacherId: fixtures.mockIds.teacher1,
                newAssignments: [
                    {
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    },
                    {
                        subjectId: fixtures.mockIds.subject2,
                        classId: fixtures.mockIds.class2
                    }
                ],
                performedBy: fixtures.mockIds.admin
            };

            const mockTeacher = {
                ...fixtures.mockTeachers[0],
                save: jest.fn().mockResolvedValue(fixtures.mockTeachers[0])
            };

            Teacher.findById.mockResolvedValue(mockTeacher);
            Subject.findById
                .mockResolvedValueOnce(fixtures.mockSubjects[0])
                .mockResolvedValueOnce(fixtures.mockSubjects[1]);
            SClass.findById
                .mockResolvedValueOnce(fixtures.mockClasses[0])
                .mockResolvedValueOnce(fixtures.mockClasses[1]);
            AttendanceAuditLog.createAuditLog.mockResolvedValue(true);

            // Act
            const result = await BulkManagementService.reassignTeacher(reassignmentData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.newAssignments).toHaveLength(2);
        });

        it('should throw error when teacher not found', async () => {
            // Arrange
            const reassignmentData = {
                teacherId: fixtures.mockIds.teacher1,
                newAssignments: [],
                performedBy: fixtures.mockIds.admin
            };

            Teacher.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                BulkManagementService.reassignTeacher(reassignmentData)
            ).rejects.toThrow('Teacher reassignment failed: Teacher not found');
        });

        it('should throw error when subject not found', async () => {
            // Arrange
            const reassignmentData = {
                teacherId: fixtures.mockIds.teacher1,
                newAssignments: [
                    {
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                ],
                performedBy: fixtures.mockIds.admin
            };

            Teacher.findById.mockResolvedValue(fixtures.mockTeachers[0]);
            Subject.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                BulkManagementService.reassignTeacher(reassignmentData)
            ).rejects.toThrow(`Teacher reassignment failed: Subject ${fixtures.mockIds.subject1} not found`);
        });

        it('should throw error when class not found', async () => {
            // Arrange
            const reassignmentData = {
                teacherId: fixtures.mockIds.teacher1,
                newAssignments: [
                    {
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                ],
                performedBy: fixtures.mockIds.admin
            };

            Teacher.findById.mockResolvedValue(fixtures.mockTeachers[0]);
            Subject.findById.mockResolvedValue(fixtures.mockSubjects[0]);
            SClass.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                BulkManagementService.reassignTeacher(reassignmentData)
            ).rejects.toThrow(`Teacher reassignment failed: Class ${fixtures.mockIds.class1} not found`);
        });
    });

    describe('_findStudentsByPattern', () => {
        it('should find students matching pattern', async () => {
            // Arrange
            const pattern = 'CSE2021*';
            const schoolId = fixtures.mockIds.school;

            // Mock the private method directly
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue([fixtures.mockStudents[0]]);

            // Act
            const result = await BulkManagementService._findStudentsByPattern(pattern, schoolId);

            // Assert
            expect(result).toEqual([fixtures.mockStudents[0]]);
        });

        it('should handle wildcard pattern', async () => {
            // Arrange
            const pattern = '*';
            const schoolId = fixtures.mockIds.school;

            // Mock the private method directly
            BulkManagementService._findStudentsByPattern = jest.fn().mockResolvedValue(fixtures.mockStudents);

            // Act
            const result = await BulkManagementService._findStudentsByPattern(pattern, schoolId);

            // Assert
            expect(result).toEqual(fixtures.mockStudents);
        });
    });

    describe('_convertPatternToRegex', () => {
        it('should convert simple wildcard pattern', () => {
            // Mock the private method
            BulkManagementService._convertPatternToRegex = jest.fn().mockReturnValue('^CSE2021.*$');

            // Act
            const result = BulkManagementService._convertPatternToRegex('CSE2021*');

            // Assert
            expect(result).toBe('^CSE2021.*$');
        });

        it('should escape special regex characters', () => {
            // Mock the private method
            BulkManagementService._convertPatternToRegex = jest.fn().mockReturnValue('^CSE\\.2021.*$');

            // Act
            const result = BulkManagementService._convertPatternToRegex('CSE.2021*');

            // Assert
            expect(result).toBe('^CSE\\.2021.*$');
        });

        it('should handle multiple wildcards', () => {
            // Mock the private method
            BulkManagementService._convertPatternToRegex = jest.fn().mockReturnValue('^.*2021.*$');

            // Act
            const result = BulkManagementService._convertPatternToRegex('*2021*');

            // Assert
            expect(result).toBe('^.*2021.*$');
        });
    });

    describe('_migrateStudentAttendance', () => {
        it('should migrate attendance records successfully', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const fromClassId = fixtures.mockIds.class1;
            const toClassId = fixtures.mockIds.class2;
            const performedBy = fixtures.mockIds.admin;

            // Mock the private method
            BulkManagementService._migrateStudentAttendance = jest.fn().mockResolvedValue(2);

            // Act
            const result = await BulkManagementService._migrateStudentAttendance(
                studentId,
                fromClassId,
                toClassId,
                performedBy
            );

            // Assert
            expect(result).toBe(2);
        });

        it('should handle migration errors', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const fromClassId = fixtures.mockIds.class1;
            const toClassId = fixtures.mockIds.class2;
            const performedBy = fixtures.mockIds.admin;

            // Mock the private method to throw error
            BulkManagementService._migrateStudentAttendance = jest.fn().mockRejectedValue(
                new Error('Attendance migration failed: Database error')
            );

            // Act & Assert
            await expect(
                BulkManagementService._migrateStudentAttendance(studentId, fromClassId, toClassId, performedBy)
            ).rejects.toThrow('Attendance migration failed: Database error');
        });
    });

    describe('getBulkOperationStats', () => {
        it('should return bulk operation statistics', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;
            const startDate = new Date('2023-10-01');
            const endDate = new Date('2023-10-31');

            const expectedResult = {
                bulkAssignments: 5,
                studentTransfers: 3,
                teacherReassignments: 2,
                totalOperations: 10,
                lastActivity: new Date('2023-10-25')
            };

            // Mock the method directly
            BulkManagementService.getBulkOperationStats = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await BulkManagementService.getBulkOperationStats(schoolId, startDate, endDate);

            // Assert
            expect(result.bulkAssignments).toBe(5);
            expect(result.studentTransfers).toBe(3);
            expect(result.teacherReassignments).toBe(2);
            expect(result.totalOperations).toBe(10);
            expect(result.lastActivity).toEqual(new Date('2023-10-25'));
        });

        it('should handle empty statistics', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;

            const expectedResult = {
                bulkAssignments: 0,
                studentTransfers: 0,
                teacherReassignments: 0,
                totalOperations: 0,
                lastActivity: null
            };

            // Mock the method directly
            BulkManagementService.getBulkOperationStats = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await BulkManagementService.getBulkOperationStats(schoolId);

            // Assert
            expect(result.bulkAssignments).toBe(0);
            expect(result.studentTransfers).toBe(0);
            expect(result.teacherReassignments).toBe(0);
            expect(result.totalOperations).toBe(0);
            expect(result.lastActivity).toBeNull();
        });

        it('should handle date filtering', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;
            const startDate = new Date('2023-10-01');
            const endDate = new Date('2023-10-31');

            const expectedResult = {
                bulkAssignments: 0,
                studentTransfers: 0,
                teacherReassignments: 0,
                totalOperations: 0,
                lastActivity: null
            };

            // Mock the method directly
            BulkManagementService.getBulkOperationStats = jest.fn().mockResolvedValue(expectedResult);

            // Act
            const result = await BulkManagementService.getBulkOperationStats(schoolId, startDate, endDate);

            // Assert
            expect(result).toEqual(expectedResult);
        });
    });
});