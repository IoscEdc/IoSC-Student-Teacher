const mongoose = require('mongoose');

// Import models
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const SessionConfiguration = require('../models/sessionConfigurationSchema');
const Subject = require('../models/subjectSchema');
const SClass = require('../models/sclassSchema');

/**
 * Data validation and integrity check migration
 * This script validates the migrated data and ensures integrity
 */

class DataValidationMigration {
    constructor() {
        this.validationLog = [];
        this.errors = [];
        this.warnings = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.validationLog.push(logMessage);
    }

    logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR ${context}: ${error.message || error}`;
        console.error(errorMessage);
        this.errors.push({ timestamp, error: error.message || error, context });
    }

    logWarning(warning, context = '') {
        const timestamp = new Date().toISOString();
        const warningMessage = `[${timestamp}] WARNING ${context}: ${warning}`;
        console.warn(warningMessage);
        this.warnings.push({ timestamp, warning, context });
    }

    async validateAttendanceRecords() {
        this.log('Validating attendance records...');

        try {
            const totalRecords = await AttendanceRecord.countDocuments();
            this.log(`Total attendance records: ${totalRecords}`);

            // Check for orphaned records (references to non-existent documents)
            const orphanedStudents = await AttendanceRecord.aggregate([
                {
                    $lookup: {
                        from: 'students',
                        localField: 'studentId',
                        foreignField: '_id',
                        as: 'student'
                    }
                },
                {
                    $match: { student: { $size: 0 } }
                },
                {
                    $count: 'orphanedStudents'
                }
            ]);

            const orphanedStudentCount = orphanedStudents[0]?.orphanedStudents || 0;
            if (orphanedStudentCount > 0) {
                this.logError(`Found ${orphanedStudentCount} attendance records with invalid student references`, 'Orphaned Students');
            }

            // Check for orphaned teacher references
            const orphanedTeachers = await AttendanceRecord.aggregate([
                {
                    $match: { teacherId: { $ne: null } }
                },
                {
                    $lookup: {
                        from: 'teachers',
                        localField: 'teacherId',
                        foreignField: '_id',
                        as: 'teacher'
                    }
                },
                {
                    $match: { teacher: { $size: 0 } }
                },
                {
                    $count: 'orphanedTeachers'
                }
            ]);

            const orphanedTeacherCount = orphanedTeachers[0]?.orphanedTeachers || 0;
            if (orphanedTeacherCount > 0) {
                this.logError(`Found ${orphanedTeacherCount} attendance records with invalid teacher references`, 'Orphaned Teachers');
            }

            // Check for invalid status values
            const invalidStatuses = await AttendanceRecord.find({
                status: { $nin: ['present', 'absent', 'late', 'excused'] }
            });

            if (invalidStatuses.length > 0) {
                this.logError(`Found ${invalidStatuses.length} attendance records with invalid status values`, 'Invalid Status');
            }

            // Check for duplicate records
            const duplicates = await AttendanceRecord.aggregate([
                {
                    $group: {
                        _id: {
                            studentId: '$studentId',
                            subjectId: '$subjectId',
                            classId: '$classId',
                            date: '$date',
                            session: '$session'
                        },
                        count: { $sum: 1 },
                        ids: { $push: '$_id' }
                    }
                },
                {
                    $match: { count: { $gt: 1 } }
                }
            ]);

            if (duplicates.length > 0) {
                this.logWarning(`Found ${duplicates.length} duplicate attendance record groups`, 'Duplicates');
            }

            this.log('Attendance record validation completed');
            return {
                totalRecords,
                orphanedStudents: orphanedStudentCount,
                orphanedTeachers: orphanedTeacherCount,
                invalidStatuses: invalidStatuses.length,
                duplicates: duplicates.length
            };

        } catch (error) {
            this.logError(error, 'Attendance record validation');
            throw error;
        }
    }

    async validateAttendanceSummaries() {
        this.log('Validating attendance summaries...');

        try {
            const totalSummaries = await AttendanceSummary.countDocuments();
            this.log(`Total attendance summaries: ${totalSummaries}`);

            // Check for summaries without corresponding records
            const summariesWithoutRecords = await AttendanceSummary.aggregate([
                {
                    $lookup: {
                        from: 'attendancerecords',
                        let: { 
                            studentId: '$studentId', 
                            subjectId: '$subjectId', 
                            classId: '$classId' 
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$studentId', '$$studentId'] },
                                            { $eq: ['$subjectId', '$$subjectId'] },
                                            { $eq: ['$classId', '$$classId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'records'
                    }
                },
                {
                    $match: { records: { $size: 0 } }
                },
                {
                    $count: 'summariesWithoutRecords'
                }
            ]);

            const summariesWithoutRecordsCount = summariesWithoutRecords[0]?.summariesWithoutRecords || 0;
            if (summariesWithoutRecordsCount > 0) {
                this.logWarning(`Found ${summariesWithoutRecordsCount} summaries without corresponding attendance records`, 'Orphaned Summaries');
            }

            // Validate summary calculations
            const summaries = await AttendanceSummary.find().limit(100); // Sample validation
            let calculationErrors = 0;

            for (const summary of summaries) {
                const records = await AttendanceRecord.find({
                    studentId: summary.studentId,
                    subjectId: summary.subjectId,
                    classId: summary.classId
                });

                const actualCounts = {
                    present: records.filter(r => r.status === 'present').length,
                    absent: records.filter(r => r.status === 'absent').length,
                    late: records.filter(r => r.status === 'late').length,
                    excused: records.filter(r => r.status === 'excused').length
                };

                const actualTotal = actualCounts.present + actualCounts.absent + actualCounts.late + actualCounts.excused;
                const actualPercentage = actualTotal > 0 ? Math.round((actualCounts.present / actualTotal) * 100) : 0;

                if (
                    summary.presentCount !== actualCounts.present ||
                    summary.absentCount !== actualCounts.absent ||
                    summary.lateCount !== actualCounts.late ||
                    summary.excusedCount !== actualCounts.excused ||
                    summary.attendancePercentage !== actualPercentage
                ) {
                    calculationErrors++;
                }
            }

            if (calculationErrors > 0) {
                this.logError(`Found ${calculationErrors} summaries with incorrect calculations`, 'Calculation Errors');
            }

            this.log('Attendance summary validation completed');
            return {
                totalSummaries,
                summariesWithoutRecords: summariesWithoutRecordsCount,
                calculationErrors
            };

        } catch (error) {
            this.logError(error, 'Attendance summary validation');
            throw error;
        }
    }

    async validateStudentEnrollments() {
        this.log('Validating student enrollments...');

        try {
            // Check for students without enrolled subjects
            const studentsWithoutSubjects = await Student.find({
                $or: [
                    { enrolledSubjects: { $exists: false } },
                    { enrolledSubjects: { $size: 0 } }
                ]
            });

            if (studentsWithoutSubjects.length > 0) {
                this.logWarning(`Found ${studentsWithoutSubjects.length} students without enrolled subjects`, 'Missing Enrollments');
            }

            // Check for invalid subject references in enrollments
            const studentsWithInvalidSubjects = await Student.aggregate([
                { $unwind: '$enrolledSubjects' },
                {
                    $lookup: {
                        from: 'subjects',
                        localField: 'enrolledSubjects.subjectId',
                        foreignField: '_id',
                        as: 'subject'
                    }
                },
                {
                    $match: { subject: { $size: 0 } }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        invalidSubjects: { $push: '$enrolledSubjects.subjectId' }
                    }
                }
            ]);

            if (studentsWithInvalidSubjects.length > 0) {
                this.logError(`Found ${studentsWithInvalidSubjects.length} students with invalid subject enrollments`, 'Invalid Subject References');
            }

            this.log('Student enrollment validation completed');
            return {
                studentsWithoutSubjects: studentsWithoutSubjects.length,
                studentsWithInvalidSubjects: studentsWithInvalidSubjects.length
            };

        } catch (error) {
            this.logError(error, 'Student enrollment validation');
            throw error;
        }
    }

    async validateTeacherAssignments() {
        this.log('Validating teacher assignments...');

        try {
            // Check for teachers without assigned subjects
            const teachersWithoutSubjects = await Teacher.find({
                $or: [
                    { assignedSubjects: { $exists: false } },
                    { assignedSubjects: { $size: 0 } }
                ]
            });

            if (teachersWithoutSubjects.length > 0) {
                this.logWarning(`Found ${teachersWithoutSubjects.length} teachers without assigned subjects`, 'Missing Assignments');
            }

            // Check for invalid subject/class references in assignments
            const teachersWithInvalidAssignments = await Teacher.aggregate([
                { $unwind: '$assignedSubjects' },
                {
                    $lookup: {
                        from: 'subjects',
                        localField: 'assignedSubjects.subjectId',
                        foreignField: '_id',
                        as: 'subject'
                    }
                },
                {
                    $lookup: {
                        from: 'sclasses',
                        localField: 'assignedSubjects.classId',
                        foreignField: '_id',
                        as: 'class'
                    }
                },
                {
                    $match: {
                        $or: [
                            { subject: { $size: 0 } },
                            { class: { $size: 0 } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        invalidAssignments: { $push: '$assignedSubjects' }
                    }
                }
            ]);

            if (teachersWithInvalidAssignments.length > 0) {
                this.logError(`Found ${teachersWithInvalidAssignments.length} teachers with invalid assignments`, 'Invalid Assignment References');
            }

            this.log('Teacher assignment validation completed');
            return {
                teachersWithoutSubjects: teachersWithoutSubjects.length,
                teachersWithInvalidAssignments: teachersWithInvalidAssignments.length
            };

        } catch (error) {
            this.logError(error, 'Teacher assignment validation');
            throw error;
        }
    }

    async validateSessionConfigurations() {
        this.log('Validating session configurations...');

        try {
            const totalConfigurations = await SessionConfiguration.countDocuments();
            this.log(`Total session configurations: ${totalConfigurations}`);

            // Check for configurations with invalid references
            const invalidConfigurations = await SessionConfiguration.aggregate([
                {
                    $lookup: {
                        from: 'subjects',
                        localField: 'subjectId',
                        foreignField: '_id',
                        as: 'subject'
                    }
                },
                {
                    $lookup: {
                        from: 'sclasses',
                        localField: 'classId',
                        foreignField: '_id',
                        as: 'class'
                    }
                },
                {
                    $match: {
                        $or: [
                            { subject: { $size: 0 } },
                            { class: { $size: 0 } }
                        ]
                    }
                },
                {
                    $count: 'invalidConfigurations'
                }
            ]);

            const invalidConfigurationCount = invalidConfigurations[0]?.invalidConfigurations || 0;
            if (invalidConfigurationCount > 0) {
                this.logError(`Found ${invalidConfigurationCount} session configurations with invalid references`, 'Invalid Configuration References');
            }

            this.log('Session configuration validation completed');
            return {
                totalConfigurations,
                invalidConfigurations: invalidConfigurationCount
            };

        } catch (error) {
            this.logError(error, 'Session configuration validation');
            throw error;
        }
    }

    async runValidation() {
        this.log('Starting data validation...');
        
        const startTime = Date.now();
        
        try {
            // Run all validations
            const attendanceRecordResults = await this.validateAttendanceRecords();
            const attendanceSummaryResults = await this.validateAttendanceSummaries();
            const studentEnrollmentResults = await this.validateStudentEnrollments();
            const teacherAssignmentResults = await this.validateTeacherAssignments();
            const sessionConfigurationResults = await this.validateSessionConfigurations();

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            this.log(`Data validation completed in ${duration} seconds`);
            this.log(`Summary: 
                - Errors found: ${this.errors.length}
                - Warnings found: ${this.warnings.length}`);

            const hasErrors = this.errors.length > 0;
            const hasWarnings = this.warnings.length > 0;

            return {
                success: !hasErrors,
                duration,
                results: {
                    attendanceRecords: attendanceRecordResults,
                    attendanceSummaries: attendanceSummaryResults,
                    studentEnrollments: studentEnrollmentResults,
                    teacherAssignments: teacherAssignmentResults,
                    sessionConfigurations: sessionConfigurationResults
                },
                errors: this.errors,
                warnings: this.warnings,
                hasErrors,
                hasWarnings
            };

        } catch (error) {
            this.logError(error, 'Validation execution');
            throw error;
        }
    }

    async fixDataIntegrityIssues() {
        this.log('Starting data integrity fixes...');

        try {
            let fixedIssues = 0;

            // Fix orphaned attendance records
            const orphanedRecords = await AttendanceRecord.find({
                $or: [
                    { studentId: { $exists: false } },
                    { subjectId: { $exists: false } },
                    { classId: { $exists: false } }
                ]
            });

            if (orphanedRecords.length > 0) {
                await AttendanceRecord.deleteMany({
                    _id: { $in: orphanedRecords.map(r => r._id) }
                });
                fixedIssues += orphanedRecords.length;
                this.log(`Removed ${orphanedRecords.length} orphaned attendance records`);
            }

            // Fix duplicate attendance records (keep the latest one)
            const duplicates = await AttendanceRecord.aggregate([
                {
                    $group: {
                        _id: {
                            studentId: '$studentId',
                            subjectId: '$subjectId',
                            classId: '$classId',
                            date: '$date',
                            session: '$session'
                        },
                        count: { $sum: 1 },
                        docs: { $push: { id: '$_id', markedAt: '$markedAt' } }
                    }
                },
                {
                    $match: { count: { $gt: 1 } }
                }
            ]);

            for (const duplicate of duplicates) {
                // Sort by markedAt and keep the latest
                const sortedDocs = duplicate.docs.sort((a, b) => new Date(b.markedAt) - new Date(a.markedAt));
                const toDelete = sortedDocs.slice(1); // Remove all except the first (latest)

                await AttendanceRecord.deleteMany({
                    _id: { $in: toDelete.map(doc => doc.id) }
                });

                fixedIssues += toDelete.length;
            }

            if (duplicates.length > 0) {
                this.log(`Fixed ${duplicates.length} duplicate record groups`);
            }

            // Recalculate all attendance summaries
            const summaries = await AttendanceSummary.find();
            for (const summary of summaries) {
                await AttendanceSummary.recalculateFromRecords(
                    summary.studentId,
                    summary.subjectId,
                    summary.classId
                );
            }

            this.log(`Recalculated ${summaries.length} attendance summaries`);

            this.log(`Data integrity fixes completed. Fixed ${fixedIssues} issues`);
            return { fixedIssues };

        } catch (error) {
            this.logError(error, 'Data integrity fixes');
            throw error;
        }
    }
}

module.exports = DataValidationMigration;