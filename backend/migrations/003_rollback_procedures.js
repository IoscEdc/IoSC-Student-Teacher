const mongoose = require('mongoose');

// Import models
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const SessionConfiguration = require('../models/sessionConfigurationSchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');

/**
 * Comprehensive rollback procedures for attendance system migration
 * This script provides safe rollback mechanisms with data backup
 */

class RollbackProcedures {
    constructor() {
        this.rollbackLog = [];
        this.errors = [];
        this.backupData = {};
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.rollbackLog.push(logMessage);
    }

    logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR ${context}: ${error.message || error}`;
        console.error(errorMessage);
        this.errors.push({ timestamp, error: error.message || error, context });
    }

    async createBackup() {
        this.log('Creating backup of current data...');

        try {
            // Backup attendance records
            const attendanceRecords = await AttendanceRecord.find().lean();
            this.backupData.attendanceRecords = attendanceRecords;
            this.log(`Backed up ${attendanceRecords.length} attendance records`);

            // Backup attendance summaries
            const attendanceSummaries = await AttendanceSummary.find().lean();
            this.backupData.attendanceSummaries = attendanceSummaries;
            this.log(`Backed up ${attendanceSummaries.length} attendance summaries`);

            // Backup session configurations
            const sessionConfigurations = await SessionConfiguration.find().lean();
            this.backupData.sessionConfigurations = sessionConfigurations;
            this.log(`Backed up ${sessionConfigurations.length} session configurations`);

            // Backup audit logs
            const auditLogs = await AttendanceAuditLog.find().lean();
            this.backupData.auditLogs = auditLogs;
            this.log(`Backed up ${auditLogs.length} audit logs`);

            // Backup current student schemas (enrolledSubjects)
            const students = await Student.find({}, 'enrolledSubjects').lean();
            this.backupData.studentEnrollments = students;
            this.log(`Backed up ${students.length} student enrollments`);

            // Backup current teacher schemas (assignedSubjects)
            const teachers = await Teacher.find({}, 'assignedSubjects').lean();
            this.backupData.teacherAssignments = teachers;
            this.log(`Backed up ${teachers.length} teacher assignments`);

            this.log('Backup creation completed');
            return this.backupData;

        } catch (error) {
            this.logError(error, 'Backup creation');
            throw error;
        }
    }

    async saveBackupToFile() {
        this.log('Saving backup to file...');

        try {
            const fs = require('fs');
            const path = require('path');
            
            const backupDir = path.join(__dirname, '../backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `attendance_system_backup_${timestamp}.json`);

            const backupContent = {
                timestamp: new Date().toISOString(),
                backupData: this.backupData,
                rollbackLog: this.rollbackLog
            };

            fs.writeFileSync(backupFile, JSON.stringify(backupContent, null, 2));
            this.log(`Backup saved to: ${backupFile}`);

            return backupFile;

        } catch (error) {
            this.logError(error, 'Backup file save');
            throw error;
        }
    }

    async restoreOldAttendanceSystem() {
        this.log('Restoring old attendance system...');

        try {
            // This would restore the old attendance arrays in student documents
            // Note: This is a placeholder as the old data structure would need to be reconstructed
            // from the new AttendanceRecord documents

            const attendanceRecords = await AttendanceRecord.find().populate('studentId subjectId');
            const studentAttendanceMap = new Map();

            // Group attendance records by student
            for (const record of attendanceRecords) {
                if (!record.studentId || !record.subjectId) continue;

                const studentId = record.studentId._id.toString();
                if (!studentAttendanceMap.has(studentId)) {
                    studentAttendanceMap.set(studentId, []);
                }

                studentAttendanceMap.get(studentId).push({
                    subName: record.subjectId._id,
                    status: record.status.charAt(0).toUpperCase() + record.status.slice(1), // Capitalize first letter
                    date: record.date
                });
            }

            // Update student documents with old attendance structure
            let updatedStudents = 0;
            for (const [studentId, attendanceArray] of studentAttendanceMap) {
                await Student.findByIdAndUpdate(
                    studentId,
                    { 
                        $set: { attendance: attendanceArray },
                        $unset: { enrolledSubjects: 1 }
                    }
                );
                updatedStudents++;
            }

            this.log(`Restored old attendance structure for ${updatedStudents} students`);

            // Restore old teacher structure (remove assignedSubjects)
            const teacherUpdateResult = await Teacher.updateMany(
                {},
                { $unset: { assignedSubjects: 1 } }
            );

            this.log(`Restored old teacher structure for ${teacherUpdateResult.modifiedCount} teachers`);

            return {
                studentsUpdated: updatedStudents,
                teachersUpdated: teacherUpdateResult.modifiedCount
            };

        } catch (error) {
            this.logError(error, 'Old system restoration');
            throw error;
        }
    }

    async removeNewCollections() {
        this.log('Removing new attendance system collections...');

        try {
            // Remove all new collections
            const attendanceRecordCount = await AttendanceRecord.countDocuments();
            await AttendanceRecord.deleteMany({});
            this.log(`Removed ${attendanceRecordCount} attendance records`);

            const attendanceSummaryCount = await AttendanceSummary.countDocuments();
            await AttendanceSummary.deleteMany({});
            this.log(`Removed ${attendanceSummaryCount} attendance summaries`);

            const sessionConfigCount = await SessionConfiguration.countDocuments();
            await SessionConfiguration.deleteMany({});
            this.log(`Removed ${sessionConfigCount} session configurations`);

            const auditLogCount = await AttendanceAuditLog.countDocuments();
            await AttendanceAuditLog.deleteMany({});
            this.log(`Removed ${auditLogCount} audit logs`);

            // Drop the collections entirely to clean up indexes
            try {
                await mongoose.connection.db.dropCollection('attendancerecords');
                await mongoose.connection.db.dropCollection('attendancesummaries');
                await mongoose.connection.db.dropCollection('sessionconfigurations');
                await mongoose.connection.db.dropCollection('attendanceauditlogs');
                this.log('Dropped new collections and their indexes');
            } catch (dropError) {
                // Collections might not exist, which is fine
                this.log('Collections already dropped or do not exist');
            }

            return {
                attendanceRecordsRemoved: attendanceRecordCount,
                summariesRemoved: attendanceSummaryCount,
                configurationsRemoved: sessionConfigCount,
                auditLogsRemoved: auditLogCount
            };

        } catch (error) {
            this.logError(error, 'Collection removal');
            throw error;
        }
    }

    async validateRollback() {
        this.log('Validating rollback...');

        try {
            // Check that new collections are empty
            const attendanceRecordCount = await AttendanceRecord.countDocuments();
            const attendanceSummaryCount = await AttendanceSummary.countDocuments();
            const sessionConfigCount = await SessionConfiguration.countDocuments();
            const auditLogCount = await AttendanceAuditLog.countDocuments();

            if (attendanceRecordCount > 0 || attendanceSummaryCount > 0 || 
                sessionConfigCount > 0 || auditLogCount > 0) {
                throw new Error('New collections are not empty after rollback');
            }

            // Check that students have old attendance structure
            const studentsWithNewStructure = await Student.countDocuments({
                enrolledSubjects: { $exists: true }
            });

            const studentsWithOldStructure = await Student.countDocuments({
                attendance: { $exists: true }
            });

            this.log(`Students with old structure: ${studentsWithOldStructure}`);
            this.log(`Students with new structure: ${studentsWithNewStructure}`);

            // Check that teachers have old structure
            const teachersWithNewStructure = await Teacher.countDocuments({
                assignedSubjects: { $exists: true }
            });

            this.log(`Teachers with new structure: ${teachersWithNewStructure}`);

            const validationResult = {
                newCollectionsEmpty: attendanceRecordCount === 0 && attendanceSummaryCount === 0 && 
                                   sessionConfigCount === 0 && auditLogCount === 0,
                studentsWithOldStructure,
                studentsWithNewStructure,
                teachersWithNewStructure
            };

            if (validationResult.newCollectionsEmpty && studentsWithNewStructure === 0 && teachersWithNewStructure === 0) {
                this.log('Rollback validation passed');
                return { success: true, ...validationResult };
            } else {
                this.logError('Rollback validation failed', 'Validation');
                return { success: false, ...validationResult };
            }

        } catch (error) {
            this.logError(error, 'Rollback validation');
            throw error;
        }
    }

    async performSafeRollback() {
        this.log('Starting safe rollback procedure...');
        
        const startTime = Date.now();
        
        try {
            // Step 1: Create backup
            await this.createBackup();
            const backupFile = await this.saveBackupToFile();

            // Step 2: Restore old attendance system
            const restorationResult = await this.restoreOldAttendanceSystem();

            // Step 3: Remove new collections
            const removalResult = await this.removeNewCollections();

            // Step 4: Validate rollback
            const validationResult = await this.validateRollback();

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            if (validationResult.success) {
                this.log(`Safe rollback completed successfully in ${duration} seconds`);
                this.log(`Backup saved to: ${backupFile}`);
                
                return {
                    success: true,
                    duration,
                    backupFile,
                    results: {
                        restoration: restorationResult,
                        removal: removalResult,
                        validation: validationResult
                    },
                    errors: this.errors
                };
            } else {
                throw new Error('Rollback validation failed');
            }

        } catch (error) {
            this.logError(error, 'Safe rollback');
            
            // Attempt to restore from backup if available
            if (this.backupData && Object.keys(this.backupData).length > 0) {
                this.log('Attempting to restore from backup due to rollback failure...');
                try {
                    await this.restoreFromBackup();
                } catch (restoreError) {
                    this.logError(restoreError, 'Backup restoration');
                }
            }
            
            throw error;
        }
    }

    async restoreFromBackup() {
        this.log('Restoring from backup...');

        try {
            if (!this.backupData || Object.keys(this.backupData).length === 0) {
                throw new Error('No backup data available');
            }

            // Restore attendance records
            if (this.backupData.attendanceRecords && this.backupData.attendanceRecords.length > 0) {
                await AttendanceRecord.insertMany(this.backupData.attendanceRecords);
                this.log(`Restored ${this.backupData.attendanceRecords.length} attendance records`);
            }

            // Restore attendance summaries
            if (this.backupData.attendanceSummaries && this.backupData.attendanceSummaries.length > 0) {
                await AttendanceSummary.insertMany(this.backupData.attendanceSummaries);
                this.log(`Restored ${this.backupData.attendanceSummaries.length} attendance summaries`);
            }

            // Restore session configurations
            if (this.backupData.sessionConfigurations && this.backupData.sessionConfigurations.length > 0) {
                await SessionConfiguration.insertMany(this.backupData.sessionConfigurations);
                this.log(`Restored ${this.backupData.sessionConfigurations.length} session configurations`);
            }

            // Restore audit logs
            if (this.backupData.auditLogs && this.backupData.auditLogs.length > 0) {
                await AttendanceAuditLog.insertMany(this.backupData.auditLogs);
                this.log(`Restored ${this.backupData.auditLogs.length} audit logs`);
            }

            // Restore student enrollments
            if (this.backupData.studentEnrollments && this.backupData.studentEnrollments.length > 0) {
                for (const student of this.backupData.studentEnrollments) {
                    await Student.findByIdAndUpdate(
                        student._id,
                        { $set: { enrolledSubjects: student.enrolledSubjects } }
                    );
                }
                this.log(`Restored ${this.backupData.studentEnrollments.length} student enrollments`);
            }

            // Restore teacher assignments
            if (this.backupData.teacherAssignments && this.backupData.teacherAssignments.length > 0) {
                for (const teacher of this.backupData.teacherAssignments) {
                    await Teacher.findByIdAndUpdate(
                        teacher._id,
                        { $set: { assignedSubjects: teacher.assignedSubjects } }
                    );
                }
                this.log(`Restored ${this.backupData.teacherAssignments.length} teacher assignments`);
            }

            this.log('Backup restoration completed');

        } catch (error) {
            this.logError(error, 'Backup restoration');
            throw error;
        }
    }

    async loadBackupFromFile(backupFilePath) {
        this.log(`Loading backup from file: ${backupFilePath}`);

        try {
            const fs = require('fs');
            const backupContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
            
            this.backupData = backupContent.backupData;
            this.rollbackLog = backupContent.rollbackLog || [];
            
            this.log(`Backup loaded from ${backupContent.timestamp}`);
            return this.backupData;

        } catch (error) {
            this.logError(error, 'Backup file loading');
            throw error;
        }
    }
}

module.exports = RollbackProcedures;