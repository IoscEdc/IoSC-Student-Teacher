const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
require('dotenv').config();

/**
 * Rollback script for attendance system migration
 * Reverts changes made by the migration and restores backup data
 */

class MigrationRollback {
    constructor() {
        this.rollbackLog = [];
        this.errors = [];
        this.stats = {
            attendanceRecordsRemoved: 0,
            summariesRemoved: 0,
            auditLogsRemoved: 0,
            studentsRestored: 0,
            teachersRestored: 0,
            errors: 0
        };
    }

    /**
     * Main rollback function
     */
    async rollback() {
        console.log('Starting attendance system migration rollback...');
        this.log('Rollback started at: ' + new Date().toISOString());

        try {
            // Step 1: Validate database connection
            await this.validateConnection();

            // Step 2: Find and validate backup collections
            const backupCollections = await this.findBackupCollections();

            // Step 3: Remove new attendance data
            await this.removeNewAttendanceData();

            // Step 4: Restore original data from backups
            await this.restoreFromBackups(backupCollections);

            // Step 5: Validate rollback results
            await this.validateRollback();

            // Step 6: Create rollback audit log
            await this.createRollbackAuditLog();

            console.log('Rollback completed successfully!');
            this.printStats();

        } catch (error) {
            console.error('Rollback failed:', error);
            this.errors.push(`Rollback failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate database connection
     */
    async validateConnection() {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection not established');
        }
        this.log('Database connection validated');
    }

    /**
     * Find backup collections created during migration
     */
    async findBackupCollections() {
        this.log('Finding backup collections...');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupCollections = {
            students: null,
            teachers: null
        };

        // Find the most recent backup collections
        for (const collection of collections) {
            if (collection.name.startsWith('students_backup_')) {
                if (!backupCollections.students || collection.name > backupCollections.students) {
                    backupCollections.students = collection.name;
                }
            }
            if (collection.name.startsWith('teachers_backup_')) {
                if (!backupCollections.teachers || collection.name > backupCollections.teachers) {
                    backupCollections.teachers = collection.name;
                }
            }
        }

        this.log(`Found backup collections: students=${backupCollections.students}, teachers=${backupCollections.teachers}`);
        return backupCollections;
    }

    /**
     * Remove new attendance data created by migration
     */
    async removeNewAttendanceData() {
        this.log('Removing new attendance data...');

        try {
            // Remove all attendance records
            const attendanceResult = await AttendanceRecord.deleteMany({});
            this.stats.attendanceRecordsRemoved = attendanceResult.deletedCount;
            this.log(`Removed ${attendanceResult.deletedCount} attendance records`);

            // Remove all attendance summaries
            const summaryResult = await AttendanceSummary.deleteMany({});
            this.stats.summariesRemoved = summaryResult.deletedCount;
            this.log(`Removed ${summaryResult.deletedCount} attendance summaries`);

            // Remove migration-related audit logs
            const auditResult = await AttendanceAuditLog.deleteMany({
                $or: [
                    { 'newValues.migrationType': 'attendance_system_migration' },
                    { reason: { $regex: /migration/i } }
                ]
            });
            this.stats.auditLogsRemoved = auditResult.deletedCount;
            this.log(`Removed ${auditResult.deletedCount} migration audit logs`);

        } catch (error) {
            throw new Error(`Failed to remove new attendance data: ${error.message}`);
        }
    }

    /**
     * Restore original data from backup collections
     */
    async restoreFromBackups(backupCollections) {
        this.log('Restoring data from backups...');

        // Restore students
        if (backupCollections.students) {
            await this.restoreStudents(backupCollections.students);
        } else {
            this.log('Warning: No student backup found, removing migration-added fields only');
            await this.cleanupStudentFields();
        }

        // Restore teachers
        if (backupCollections.teachers) {
            await this.restoreTeachers(backupCollections.teachers);
        } else {
            this.log('Warning: No teacher backup found, removing migration-added fields only');
            await this.cleanupTeacherFields();
        }
    }

    /**
     * Restore students from backup
     */
    async restoreStudents(backupCollectionName) {
        try {
            // Get backup data
            const backupData = await mongoose.connection.db
                .collection(backupCollectionName)
                .find({})
                .toArray();

            if (backupData.length === 0) {
                this.log('No student backup data found');
                return;
            }

            // Remove current students
            await Student.deleteMany({});

            // Restore from backup
            for (const studentData of backupData) {
                // Remove MongoDB-specific fields that might cause issues
                delete studentData._id;
                delete studentData.__v;
                delete studentData.createdAt;
                delete studentData.updatedAt;

                const student = new Student(studentData);
                await student.save();
                this.stats.studentsRestored++;
            }

            this.log(`Restored ${this.stats.studentsRestored} students from backup`);

        } catch (error) {
            throw new Error(`Failed to restore students: ${error.message}`);
        }
    }

    /**
     * Restore teachers from backup
     */
    async restoreTeachers(backupCollectionName) {
        try {
            // Get backup data
            const backupData = await mongoose.connection.db
                .collection(backupCollectionName)
                .find({})
                .toArray();

            if (backupData.length === 0) {
                this.log('No teacher backup data found');
                return;
            }

            // Remove current teachers
            await Teacher.deleteMany({});

            // Restore from backup
            for (const teacherData of backupData) {
                // Remove MongoDB-specific fields that might cause issues
                delete teacherData._id;
                delete teacherData.__v;
                delete teacherData.createdAt;
                delete teacherData.updatedAt;

                const teacher = new Teacher(teacherData);
                await teacher.save();
                this.stats.teachersRestored++;
            }

            this.log(`Restored ${this.stats.teachersRestored} teachers from backup`);

        } catch (error) {
            throw new Error(`Failed to restore teachers: ${error.message}`);
        }
    }

    /**
     * Cleanup student fields added by migration (if no backup available)
     */
    async cleanupStudentFields() {
        try {
            const result = await Student.updateMany(
                {},
                {
                    $unset: {
                        enrolledSubjects: 1,
                        universityId: 1
                    }
                }
            );

            this.log(`Cleaned up migration fields from ${result.modifiedCount} students`);

        } catch (error) {
            this.log(`Warning: Failed to cleanup student fields: ${error.message}`);
        }
    }

    /**
     * Cleanup teacher fields added by migration (if no backup available)
     */
    async cleanupTeacherFields() {
        try {
            const result = await Teacher.updateMany(
                {},
                {
                    $unset: {
                        assignedSubjects: 1
                    }
                }
            );

            this.log(`Cleaned up migration fields from ${result.modifiedCount} teachers`);

        } catch (error) {
            this.log(`Warning: Failed to cleanup teacher fields: ${error.message}`);
        }
    }

    /**
     * Validate rollback results
     */
    async validateRollback() {
        this.log('Validating rollback results...');

        // Check that new attendance data is removed
        const attendanceRecordCount = await AttendanceRecord.countDocuments({});
        const summaryCount = await AttendanceSummary.countDocuments({});

        if (attendanceRecordCount > 0) {
            this.log(`Warning: ${attendanceRecordCount} attendance records still exist`);
        }

        if (summaryCount > 0) {
            this.log(`Warning: ${summaryCount} attendance summaries still exist`);
        }

        // Check data counts
        const studentCount = await Student.countDocuments({});
        const teacherCount = await Teacher.countDocuments({});

        this.log(`Rollback validation results:`);
        this.log(`- Students: ${studentCount}`);
        this.log(`- Teachers: ${teacherCount}`);
        this.log(`- Attendance Records: ${attendanceRecordCount}`);
        this.log(`- Attendance Summaries: ${summaryCount}`);
    }

    /**
     * Create rollback audit log
     */
    async createRollbackAuditLog() {
        try {
            // Create a special audit log entry for the rollback
            const rollbackLog = new AttendanceAuditLog({
                recordId: new mongoose.Types.ObjectId(), // Dummy record ID for rollback
                action: 'delete',
                oldValues: {
                    rollbackType: 'attendance_system_rollback',
                    stats: this.stats,
                    errors: this.errors,
                    rollbackLog: this.rollbackLog
                },
                newValues: null,
                performedBy: new mongoose.Types.ObjectId(), // System rollback
                performedByModel: 'admin',
                reason: 'Attendance system migration rollback - reverting to previous state',
                schoolId: new mongoose.Types.ObjectId() // System-wide rollback
            });

            await rollbackLog.save();
            this.log('Rollback audit log created');

        } catch (error) {
            this.log(`Warning: Could not create rollback audit log: ${error.message}`);
        }
    }

    /**
     * Log rollback events
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.rollbackLog.push(logEntry);
        console.log(logEntry);
    }

    /**
     * Print rollback statistics
     */
    printStats() {
        console.log('\n=== Rollback Statistics ===');
        console.log(`Attendance records removed: ${this.stats.attendanceRecordsRemoved}`);
        console.log(`Summaries removed: ${this.stats.summariesRemoved}`);
        console.log(`Audit logs removed: ${this.stats.auditLogsRemoved}`);
        console.log(`Students restored: ${this.stats.studentsRestored}`);
        console.log(`Teachers restored: ${this.stats.teachersRestored}`);
        console.log(`Errors encountered: ${this.stats.errors}`);

        if (this.errors.length > 0) {
            console.log('\n=== Errors ===');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
    }
}

// Run rollback if called directly
if (require.main === module) {
    async function runRollback() {
        try {
            // Confirm rollback
            console.log('⚠️  WARNING: This will rollback the attendance system migration!');
            console.log('This will remove all new attendance data and restore from backups.');
            console.log('Make sure you have backups before proceeding.');
            
            // In a real scenario, you might want to add a confirmation prompt here
            // For now, we'll proceed directly
            
            // Connect to database
            console.log('Connecting to database...');
            await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Database connected successfully');

            // Create rollback instance
            const rollback = new MigrationRollback();

            // Run rollback
            await rollback.rollback();

            console.log('\n✅ Rollback completed successfully!');

        } catch (error) {
            console.error('\n❌ Rollback failed:', error.message);
            console.error('Stack trace:', error.stack);
            process.exit(1);

        } finally {
            // Close database connection
            await mongoose.connection.close();
            console.log('Database connection closed');
            process.exit(0);
        }
    }

    runRollback();
}

module.exports = MigrationRollback;