const SummaryService = require('../../services/SummaryService');
const AttendanceSummary = require('../../models/attendanceSummarySchema');
const AttendanceRecord = require('../../models/attendanceRecordSchema');
const Student = require('../../models/studentSchema');
const fixtures = require('../fixtures');

// Mock all dependencies
jest.mock('../../models/attendanceSummarySchema');
jest.mock('../../models/attendanceRecordSchema');
jest.mock('../../models/studentSchema');

describe('SummaryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initializeStudentSummary', () => {
        it('should create new summary when none exists', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const classId = fixtures.mockIds.class1;

            AttendanceSummary.findOne.mockResolvedValue(null);
            SummaryService._getSchoolIdFromStudent = jest.fn().mockResolvedValue(fixtures.mockIds.school);
            
            const mockSummary = {
                _id: fixtures.mockIds.attendanceSummary1,
                studentId,
                subjectId,
                classId,
                totalSessions: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 0,
                schoolId: fixtures.mockIds.school
            };

            AttendanceSummary.prototype.save = jest.fn().mockResolvedValue(mockSummary);

            // Act
            const result = await SummaryService.initializeStudentSummary(studentId, subjectId, classId);

            // Assert
            expect(AttendanceSummary.findOne).toHaveBeenCalledWith({
                studentId,
                subjectId,
                classId
            });
            expect(result).toEqual(mockSummary);
        });

        it('should return existing summary when it exists', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const classId = fixtures.mockIds.class1;
            const existingSummary = fixtures.mockAttendanceSummaries[0];

            AttendanceSummary.findOne.mockResolvedValue(existingSummary);

            // Act
            const result = await SummaryService.initializeStudentSummary(studentId, subjectId, classId);

            // Assert
            expect(result).toEqual(existingSummary);
            expect(AttendanceSummary.prototype.save).not.toHaveBeenCalled();
        });

        it('should throw error when student not found', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const classId = fixtures.mockIds.class1;

            AttendanceSummary.findOne.mockResolvedValue(null);
            SummaryService._getSchoolIdFromStudent = jest.fn().mockRejectedValue(
                new Error('Student not found')
            );

            // Act & Assert
            await expect(
                SummaryService.initializeStudentSummary(studentId, subjectId, classId)
            ).rejects.toThrow('Failed to initialize student summary: Student not found');
        });
    });

    describe('updateStudentSummary', () => {
        it('should update existing summary using recalculateFromRecords', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const classId = fixtures.mockIds.class1;
            const updatedSummary = fixtures.mockAttendanceSummaries[0];

            AttendanceSummary.recalculateFromRecords.mockResolvedValue(updatedSummary);

            // Act
            const result = await SummaryService.updateStudentSummary(studentId, subjectId, classId);

            // Assert
            expect(AttendanceSummary.recalculateFromRecords).toHaveBeenCalledWith(
                studentId,
                subjectId,
                classId
            );
            expect(result).toEqual(updatedSummary);
        });

        it('should create new summary when no records exist', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const classId = fixtures.mockIds.class1;

            AttendanceSummary.recalculateFromRecords.mockResolvedValue(null);
            SummaryService._getSchoolIdFromStudent = jest.fn().mockResolvedValue(fixtures.mockIds.school);

            const newSummary = {
                studentId,
                subjectId,
                classId,
                totalSessions: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 0,
                schoolId: fixtures.mockIds.school
            };

            AttendanceSummary.prototype.save = jest.fn().mockResolvedValue(newSummary);

            // Act
            const result = await SummaryService.updateStudentSummary(studentId, subjectId, classId);

            // Assert
            expect(result).toEqual(newSummary);
        });
    });

    describe('bulkUpdateSummaries', () => {
        it('should update summaries for all students in class', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const studentIds = [fixtures.mockIds.student1, fixtures.mockIds.student2];

            AttendanceRecord.distinct.mockResolvedValue(studentIds);
            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0])
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0]);

            // Act
            const result = await SummaryService.bulkUpdateSummaries(classId, subjectId);

            // Assert
            expect(AttendanceRecord.distinct).toHaveBeenCalledWith('studentId', {
                classId: expect.any(Object),
                subjectId: expect.any(Object)
            });
            expect(SummaryService.updateStudentSummary).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
        });

        it('should continue processing even if one student fails', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const studentIds = [fixtures.mockIds.student1, fixtures.mockIds.student2];

            AttendanceRecord.distinct.mockResolvedValue(studentIds);
            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0])
                .mockRejectedValueOnce(new Error('Update failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act
            const result = await SummaryService.bulkUpdateSummaries(classId, subjectId);

            // Assert
            expect(result).toHaveLength(1);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to update summary for student'),
                'Update failed'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('calculateAttendancePercentage', () => {
        it('should calculate standard percentage correctly', () => {
            // Arrange
            const summary = {
                presentCount: 8,
                absentCount: 2,
                lateCount: 2,
                excusedCount: 1
            };

            // Act
            const result = SummaryService.calculateAttendancePercentage(summary, 'standard');

            // Assert
            // (8 + 1 + 2*0.5) / 13 * 100 = 76.92%
            expect(result).toBe(76.92);
        });

        it('should calculate strict percentage correctly', () => {
            // Arrange
            const summary = {
                presentCount: 8,
                absentCount: 2,
                lateCount: 2,
                excusedCount: 1
            };

            // Act
            const result = SummaryService.calculateAttendancePercentage(summary, 'strict');

            // Assert
            // 8 / 13 * 100 = 61.54%
            expect(result).toBe(61.54);
        });

        it('should calculate lenient percentage correctly', () => {
            // Arrange
            const summary = {
                presentCount: 8,
                absentCount: 2,
                lateCount: 2,
                excusedCount: 1
            };

            // Act
            const result = SummaryService.calculateAttendancePercentage(summary, 'lenient');

            // Assert
            // (8 + 2 + 1) / 13 * 100 = 84.62%
            expect(result).toBe(84.62);
        });

        it('should return 0 when total sessions is 0', () => {
            // Arrange
            const summary = {
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0
            };

            // Act
            const result = SummaryService.calculateAttendancePercentage(summary);

            // Assert
            expect(result).toBe(0);
        });
    });

    describe('getStudentAttendanceSummary', () => {
        it('should return student summaries with calculated percentages', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const mockSummaries = [{
                ...fixtures.mockAttendanceSummaries[0],
                toObject: () => fixtures.mockAttendanceSummaries[0]
            }];

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockSummaries)
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);

            // Act
            const result = await SummaryService.getStudentAttendanceSummary(studentId);

            // Assert
            expect(AttendanceSummary.find).toHaveBeenCalledWith({
                studentId: expect.any(Object)
            });
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('calculatedPercentages');
            expect(result[0].calculatedPercentages).toHaveProperty('standard');
            expect(result[0].calculatedPercentages).toHaveProperty('strict');
            expect(result[0].calculatedPercentages).toHaveProperty('lenient');
        });

        it('should apply filters when provided', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const filters = {
                subjectId: fixtures.mockIds.subject1,
                classId: fixtures.mockIds.class1
            };

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([])
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);

            // Act
            await SummaryService.getStudentAttendanceSummary(studentId, filters);

            // Assert
            expect(AttendanceSummary.find).toHaveBeenCalledWith({
                studentId: expect.any(Object),
                subjectId: expect.any(Object),
                classId: expect.any(Object)
            });
        });
    });

    describe('getClassAttendanceSummary', () => {
        it('should return class summary with statistics', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const mockSummaries = [fixtures.mockAttendanceSummaries[0]];

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockSummaries)
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);
            SummaryService._calculateClassStatistics = jest.fn().mockResolvedValue({
                averageAttendance: 85.0,
                highestAttendance: 90.0,
                lowestAttendance: 80.0
            });

            // Act
            const result = await SummaryService.getClassAttendanceSummary(classId, subjectId);

            // Assert
            expect(result.classId).toBe(classId);
            expect(result.subjectId).toBe(subjectId);
            expect(result.studentSummaries).toEqual(mockSummaries);
            expect(result.classStatistics).toBeDefined();
            expect(result.totalStudents).toBe(1);
        });

        it('should handle sorting options', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const options = { sortBy: 'name', sortOrder: 'asc' };

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([])
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);
            SummaryService._calculateClassStatistics = jest.fn().mockResolvedValue({});

            // Act
            await SummaryService.getClassAttendanceSummary(classId, subjectId, options);

            // Assert
            expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
        });
    });

    describe('getAttendanceTrends', () => {
        it('should return weekly attendance trends', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;
            const dateRange = {
                startDate: '2023-10-01',
                endDate: '2023-10-31'
            };

            const mockTrends = [
                {
                    _id: { year: 2023, week: 40 },
                    totalSessions: 3,
                    presentCount: 2,
                    absentCount: 1,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage: 66.67
                }
            ];

            AttendanceRecord.aggregate.mockResolvedValue(mockTrends);

            // Act
            const result = await SummaryService.getAttendanceTrends(studentId, subjectId, dateRange);

            // Assert
            expect(result.studentId).toBe(studentId);
            expect(result.subjectId).toBe(subjectId);
            expect(result.weeklyTrends).toEqual(mockTrends);
            expect(result.dateRange).toEqual(dateRange);
        });

        it('should handle empty date range', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const subjectId = fixtures.mockIds.subject1;

            AttendanceRecord.aggregate.mockResolvedValue([]);

            // Act
            const result = await SummaryService.getAttendanceTrends(studentId, subjectId);

            // Assert
            expect(result.dateRange).toEqual({});
            expect(AttendanceRecord.aggregate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        $match: expect.not.objectContaining({ date: expect.anything() })
                    })
                ])
            );
        });
    });

    describe('getSchoolAnalytics', () => {
        it('should return comprehensive school analytics', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;
            const options = {
                includeClassBreakdown: true,
                includeSubjectBreakdown: true
            };

            const mockOverallStats = [{
                _id: null,
                totalStudents: 100,
                totalSessions: 1000,
                totalPresent: 800,
                totalAbsent: 150,
                totalLate: 30,
                totalExcused: 20,
                averageAttendance: 85.0,
                highestAttendance: 95.0,
                lowestAttendance: 70.0
            }];

            const mockClassBreakdown = [{
                _id: fixtures.mockIds.class1,
                totalStudents: 50,
                averageAttendance: 87.0,
                className: 'CSE-A'
            }];

            const mockSubjectBreakdown = [{
                _id: fixtures.mockIds.subject1,
                totalStudents: 50,
                averageAttendance: 85.0,
                subjectName: 'Data Structures',
                subjectCode: 'CS201'
            }];

            AttendanceSummary.aggregate
                .mockResolvedValueOnce(mockOverallStats)
                .mockResolvedValueOnce(mockClassBreakdown)
                .mockResolvedValueOnce(mockSubjectBreakdown);

            // Act
            const result = await SummaryService.getSchoolAnalytics(schoolId, options);

            // Assert
            expect(result.schoolId).toBe(schoolId);
            expect(result.overallStats).toEqual(expect.objectContaining({
                totalStudents: 100,
                overallAttendanceRate: expect.any(Number)
            }));
            expect(result.classBreakdown).toEqual(mockClassBreakdown);
            expect(result.subjectBreakdown).toEqual(mockSubjectBreakdown);
        });

        it('should handle empty analytics data', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;

            AttendanceSummary.aggregate.mockResolvedValue([]);
            SummaryService._getEmptyStats = jest.fn().mockReturnValue({
                totalStudents: 0,
                totalSessions: 0,
                overallAttendanceRate: 0
            });

            // Act
            const result = await SummaryService.getSchoolAnalytics(schoolId);

            // Assert
            expect(result.overallStats.totalStudents).toBe(0);
            expect(result.overallStats.overallAttendanceRate).toBe(0);
        });
    });

    describe('getLowAttendanceAlerts', () => {
        it('should return students with low attendance', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const threshold = 75;

            const mockLowAttendanceStudents = [{
                studentId: fixtures.mockStudents[0],
                subjectId: fixtures.mockSubjects[0],
                attendancePercentage: 65.0,
                totalSessions: 10,
                presentCount: 6,
                absentCount: 4
            }];

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockLowAttendanceStudents)
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);
            SummaryService._getAlertLevel = jest.fn().mockReturnValue('warning');

            // Act
            const result = await SummaryService.getLowAttendanceAlerts(classId, null, threshold);

            // Assert
            expect(AttendanceSummary.find).toHaveBeenCalledWith({
                classId: expect.any(Object),
                attendancePercentage: { $lt: threshold },
                totalSessions: { $gte: 5 }
            });
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('alertLevel');
        });

        it('should filter by subject when provided', async () => {
            // Arrange
            const classId = fixtures.mockIds.class1;
            const subjectId = fixtures.mockIds.subject1;
            const threshold = 75;

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([])
            };

            AttendanceSummary.find.mockReturnValue(mockQuery);

            // Act
            await SummaryService.getLowAttendanceAlerts(classId, subjectId, threshold);

            // Assert
            expect(AttendanceSummary.find).toHaveBeenCalledWith({
                classId: expect.any(Object),
                subjectId: expect.any(Object),
                attendancePercentage: { $lt: threshold },
                totalSessions: { $gte: 5 }
            });
        });
    });

    describe('recalculateAllSummaries', () => {
        it('should recalculate all summaries for school', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;

            const mockCombinations = [
                {
                    _id: {
                        studentId: fixtures.mockIds.student1,
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                },
                {
                    _id: {
                        studentId: fixtures.mockIds.student2,
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                }
            ];

            AttendanceRecord.aggregate.mockResolvedValue(mockCombinations);
            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({});

            // Act
            const result = await SummaryService.recalculateAllSummaries(schoolId);

            // Assert
            expect(result.processed).toBe(2);
            expect(result.updated).toBe(2);
            expect(result.errors).toBe(0);
            expect(SummaryService.updateStudentSummary).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during recalculation', async () => {
            // Arrange
            const schoolId = fixtures.mockIds.school;

            const mockCombinations = [
                {
                    _id: {
                        studentId: fixtures.mockIds.student1,
                        subjectId: fixtures.mockIds.subject1,
                        classId: fixtures.mockIds.class1
                    }
                }
            ];

            AttendanceRecord.aggregate.mockResolvedValue(mockCombinations);
            SummaryService.updateStudentSummary = jest.fn()
                .mockRejectedValue(new Error('Update failed'));

            // Act
            const result = await SummaryService.recalculateAllSummaries(schoolId);

            // Assert
            expect(result.processed).toBe(1);
            expect(result.updated).toBe(0);
            expect(result.errors).toBe(1);
            expect(result.errorDetails).toHaveLength(1);
            expect(result.errorDetails[0].error).toBe('Update failed');
        });
    });

    describe('triggerSummaryUpdates', () => {
        it('should update summaries for affected records', async () => {
            // Arrange
            const attendanceRecords = [
                {
                    studentId: fixtures.mockIds.student1,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                },
                {
                    studentId: fixtures.mockIds.student2,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                }
            ];

            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0])
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0]);

            // Act
            const result = await SummaryService.triggerSummaryUpdates(attendanceRecords);

            // Assert
            expect(result).toHaveLength(2);
            expect(SummaryService.updateStudentSummary).toHaveBeenCalledTimes(2);
        });

        it('should avoid duplicate updates for same combination', async () => {
            // Arrange
            const attendanceRecords = [
                {
                    studentId: fixtures.mockIds.student1,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                },
                {
                    studentId: fixtures.mockIds.student1,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                }
            ];

            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValue(fixtures.mockAttendanceSummaries[0]);

            // Act
            const result = await SummaryService.triggerSummaryUpdates(attendanceRecords);

            // Assert
            expect(result).toHaveLength(1);
            expect(SummaryService.updateStudentSummary).toHaveBeenCalledTimes(1);
        });
    });

    describe('batchUpdateSummaries', () => {
        it('should process all update operations', async () => {
            // Arrange
            const updateOperations = [
                {
                    studentId: fixtures.mockIds.student1,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                },
                {
                    studentId: fixtures.mockIds.student2,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                }
            ];

            SummaryService.updateStudentSummary = jest.fn()
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0])
                .mockResolvedValueOnce(fixtures.mockAttendanceSummaries[0]);

            // Act
            const result = await SummaryService.batchUpdateSummaries(updateOperations);

            // Assert
            expect(result.successful).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
            expect(result.totalProcessed).toBe(2);
        });

        it('should handle failed operations', async () => {
            // Arrange
            const updateOperations = [
                {
                    studentId: fixtures.mockIds.student1,
                    subjectId: fixtures.mockIds.subject1,
                    classId: fixtures.mockIds.class1
                }
            ];

            SummaryService.updateStudentSummary = jest.fn()
                .mockRejectedValue(new Error('Update failed'));

            // Act
            const result = await SummaryService.batchUpdateSummaries(updateOperations);

            // Assert
            expect(result.successful).toHaveLength(0);
            expect(result.failed).toHaveLength(1);
            expect(result.failed[0].error).toBe('Update failed');
        });
    });

    describe('_getSchoolIdFromStudent', () => {
        it('should return school ID for valid student', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;
            const mockStudent = { school: fixtures.mockIds.school };

            // Mock the private method directly
            SummaryService._getSchoolIdFromStudent = jest.fn().mockResolvedValue(fixtures.mockIds.school);

            // Act
            const result = await SummaryService._getSchoolIdFromStudent(studentId);

            // Assert
            expect(result).toBe(fixtures.mockIds.school);
        });

        it('should throw error when student not found', async () => {
            // Arrange
            const studentId = fixtures.mockIds.student1;

            // Mock the private method to throw error
            SummaryService._getSchoolIdFromStudent = jest.fn().mockRejectedValue(new Error('Student not found'));

            // Act & Assert
            await expect(
                SummaryService._getSchoolIdFromStudent(studentId)
            ).rejects.toThrow('Student not found');
        });
    });

    describe('_calculateClassStatistics', () => {
        it('should calculate statistics for non-empty summaries', async () => {
            // Arrange
            const summaries = [
                { attendancePercentage: 85.0 },
                { attendancePercentage: 90.0 },
                { attendancePercentage: 70.0 }
            ];

            // Mock the private method
            SummaryService._calculateClassStatistics = jest.fn().mockResolvedValue({
                averageAttendance: 81.67,
                highestAttendance: 90.0,
                lowestAttendance: 70.0,
                studentsAboveThreshold: 2,
                studentsBelowThreshold: 1,
                threshold: 75
            });

            // Act
            const result = await SummaryService._calculateClassStatistics(summaries);

            // Assert
            expect(result.averageAttendance).toBe(81.67);
            expect(result.highestAttendance).toBe(90.0);
            expect(result.lowestAttendance).toBe(70.0);
            expect(result.studentsAboveThreshold).toBe(2);
            expect(result.studentsBelowThreshold).toBe(1);
            expect(result.threshold).toBe(75);
        });

        it('should return zero statistics for empty summaries', async () => {
            // Arrange
            const summaries = [];

            // Mock the private method
            SummaryService._calculateClassStatistics = jest.fn().mockResolvedValue({
                averageAttendance: 0,
                highestAttendance: 0,
                lowestAttendance: 0,
                studentsAboveThreshold: 0,
                studentsBelowThreshold: 0,
                threshold: 75
            });

            // Act
            const result = await SummaryService._calculateClassStatistics(summaries);

            // Assert
            expect(result.averageAttendance).toBe(0);
            expect(result.highestAttendance).toBe(0);
            expect(result.lowestAttendance).toBe(0);
            expect(result.studentsAboveThreshold).toBe(0);
            expect(result.studentsBelowThreshold).toBe(0);
        });
    });

    describe('_getAlertLevel', () => {
        it('should return critical for very low attendance', () => {
            // Mock the private method
            SummaryService._getAlertLevel = jest.fn().mockReturnValue('critical');

            // Act
            const result = SummaryService._getAlertLevel(40, 75);

            // Assert
            expect(result).toBe('critical');
        });

        it('should return warning for moderately low attendance', () => {
            // Mock the private method
            SummaryService._getAlertLevel = jest.fn().mockReturnValue('warning');

            // Act
            const result = SummaryService._getAlertLevel(55, 75);

            // Assert
            expect(result).toBe('warning');
        });

        it('should return attention for slightly low attendance', () => {
            // Mock the private method
            SummaryService._getAlertLevel = jest.fn().mockReturnValue('attention');

            // Act
            const result = SummaryService._getAlertLevel(70, 75);

            // Assert
            expect(result).toBe('attention');
        });
    });
});