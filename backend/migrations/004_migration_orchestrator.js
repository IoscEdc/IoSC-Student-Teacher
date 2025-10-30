const mongoose = require('mongoose');

// Import migration classes
const AttendanceMigration = require('./001_attendance_system_migration');
const DataValidationMigration = require('./002_data_validation_migration');
const RollbackProcedures = require('./003_rollback_procedures');

/**
 * Migration orchestrator that manages the complete migration process
 * with validation, rollback capabilities, and comprehensive logging
 */

class MigrationOrchestrator {
    constructor() {
        this.orchestratorLog = [];
        this.errors = [];
        this.warnings = [];
        this.migrationResults = {};
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ORCHESTRATOR: ${message}`;
        console.log(logMessage);
        this.orchestratorLog.push(logMessage);
    }

    logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ORCHESTRATOR ERROR ${context}: ${error.message || error}`;
        console.error(errorMessage);
        this.errors.push({ timestamp, error: error.message || error, context });
    }

    logWarning(warning, context = '') {
        const timestamp = new Date().toISOString();
        const warningMessage = `[${timestamp}] ORCHESTRATOR WARNING ${context}: ${warning}`;
        console.warn(warningMessage);
        this.warnings.push({ timestamp, warning, context });
    }

    async checkPrerequisites() {
        this.log('Checking migration prerequisites...');

        try {
            // Check database connection
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Database not connected');
            }

            // Check if collections exist
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);

            const requiredCollections = ['students', 'teachers', 'subjects', 'sclasses', 'admins'];
            const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));

            if (missingCollections.length > 0) {
                throw new Error(`Missing required collections: ${missingCollections.join(', ')}`);
            }

            // Check if new collections already exist (indicating previous migration)
            const newCollections = ['attendancerecords', 'attendancesummaries', 'sessionconfigurations', 'attendanceauditlogs'];
            const existingNewCollections = newCollections.filter(name => collectionNames.includes(name));

            if (existingNewCollections.length > 0) {
                this.logWarning(`New collections already exist: ${existingNewCollections.join(', ')}`, 'Prerequisites');
            }

            // Check for existing data
            const Student = require('../models/studentSchema');
            const Teacher = require('../models/teacherSchema');

            const studentCount = await Student.countDocuments();
            const teacherCount = await Teacher.countDocuments();

            if (studentCount === 0 || teacherCount === 0) {
                this.logWarning('No students or teachers found in database', 'Prerequisites');
            }

            this.log(`Prerequisites check completed. Students: ${studentCount}, Teachers: ${teacherCount}`);
            
            return {
                success: true,
                studentCount,
                teacherCount,
                existingNewCollections,
                warnings: existingNewCollections.length > 0
            };

        } catch (error) {
            this.logError(error, 'Prerequisites check');
            throw error;
        }
    }

    async runCompleteMigration() {
        this.log('Starting complete attendance system migration...');
        
        const startTime = Date.now();
        
        try {
            // Step 1: Check prerequisites
            const prerequisiteResult = await this.checkPrerequisites();
            this.migrationResults.prerequisites = prerequisiteResult;

            // Step 2: Create backup before migration
            const rollbackProcedures = new RollbackProcedures();
            await rollbackProcedures.createBackup();
            const backupFile = await rollbackProcedures.saveBackupToFile();
            this.migrationResults.backupFile = backupFile;
            this.log(`Backup created: ${backupFile}`);

            // Step 3: Run main migration
            this.log('Running main attendance system migration...');
            const attendanceMigration = new AttendanceMigration();
            const migrationResult = await attendanceMigration.runMigration();
            this.migrationResults.mainMigration = migrationResult;

            if (!migrationResult.success) {
                throw new Error('Main migration failed');
            }

            // Step 4: Run data validation
            this.log('Running data validation...');
            const dataValidation = new DataValidationMigration();
            const validationResult = await dataValidation.runValidation();
            this.migrationResults.validation = validationResult;

            // Step 5: Fix any data integrity issues found
            if (validationResult.hasErrors) {
                this.log('Fixing data integrity issues...');
                const fixResult = await dataValidation.fixDataIntegrityIssues();
                this.migrationResults.fixes = fixResult;

                // Re-run validation after fixes
                this.log('Re-running validation after fixes...');
                const revalidationResult = await dataValidation.runValidation();
                this.migrationResults.revalidation = revalidationResult;

                if (revalidationResult.hasErrors) {
                    this.logWarning('Some data integrity issues could not be automatically fixed', 'Validation');
                }
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            this.log(`Complete migration finished in ${duration} seconds`);
            
            // Generate migration report
            const report = this.generateMigrationReport(duration);
            
            return {
                success: true,
                duration,
                backupFile,
                results: this.migrationResults,
                report,
                errors: this.errors,
                warnings: this.warnings
            };

        } catch (error) {
            this.logError(error, 'Complete migration');
            
            // Attempt automatic rollback on failure
            this.log('Migration failed, attempting automatic rollback...');
            try {
                const rollbackProcedures = new RollbackProcedures();
                await rollbackProcedures.performSafeRollback();
                this.log('Automatic rollback completed successfully');
            } catch (rollbackError) {
                this.logError(rollbackError, 'Automatic rollback');
            }
            
            throw error;
        }
    }

    generateMigrationReport(duration) {
        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration} seconds`,
            summary: {
                success: this.errors.length === 0,
                errorsCount: this.errors.length,
                warningsCount: this.warnings.length
            },
            details: {}
        };

        // Add migration details
        if (this.migrationResults.mainMigration) {
            const main = this.migrationResults.mainMigration;
            report.details.migration = {
                attendanceRecordsMigrated: main.results?.studentMigration?.migratedRecords || 0,
                teacherReferencesUpdated: main.results?.teacherUpdates || 0,
                summariesCreated: main.results?.summariesCreated || 0,
                configurationsCreated: main.results?.configurationsCreated || 0
            };
        }

        // Add validation details
        if (this.migrationResults.validation) {
            const validation = this.migrationResults.validation;
            report.details.validation = {
                totalAttendanceRecords: validation.results?.attendanceRecords?.totalRecords || 0,
                totalSummaries: validation.results?.attendanceSummaries?.totalSummaries || 0,
                dataIntegrityIssues: validation.hasErrors,
                warningsFound: validation.hasWarnings
            };
        }

        // Add fix details if any
        if (this.migrationResults.fixes) {
            report.details.fixes = {
                issuesFixed: this.migrationResults.fixes.fixedIssues || 0
            };
        }

        return report;
    }

    async generateMigrationReportFile() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const reportsDir = path.join(__dirname, '../reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportFile = path.join(reportsDir, `migration_report_${timestamp}.json`);

            const reportContent = {
                orchestratorLog: this.orchestratorLog,
                migrationResults: this.migrationResults,
                errors: this.errors,
                warnings: this.warnings,
                report: this.generateMigrationReport(0)
            };

            fs.writeFileSync(reportFile, JSON.stringify(reportContent, null, 2));
            this.log(`Migration report saved to: ${reportFile}`);

            return reportFile;

        } catch (error) {
            this.logError(error, 'Report generation');
            throw error;
        }
    }

    async runSafeRollback(backupFilePath = null) {
        this.log('Starting safe rollback...');

        try {
            const rollbackProcedures = new RollbackProcedures();
            
            if (backupFilePath) {
                await rollbackProcedures.loadBackupFromFile(backupFilePath);
            }

            const rollbackResult = await rollbackProcedures.performSafeRollback();
            
            this.log('Safe rollback completed successfully');
            return rollbackResult;

        } catch (error) {
            this.logError(error, 'Safe rollback');
            throw error;
        }
    }

    async validateMigrationStatus() {
        this.log('Validating current migration status...');

        try {
            const dataValidation = new DataValidationMigration();
            const validationResult = await dataValidation.runValidation();

            const status = {
                migrationCompleted: !validationResult.hasErrors,
                hasDataIntegrityIssues: validationResult.hasErrors,
                hasWarnings: validationResult.hasWarnings,
                validationResults: validationResult.results
            };

            this.log(`Migration status: ${status.migrationCompleted ? 'COMPLETED' : 'INCOMPLETE'}`);
            
            return status;

        } catch (error) {
            this.logError(error, 'Status validation');
            throw error;
        }
    }
}

module.exports = MigrationOrchestrator;