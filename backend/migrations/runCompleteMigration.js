#!/usr/bin/env node

/**
 * Complete migration runner with orchestration
 * Usage: 
 *   node runCompleteMigration.js                    # Run complete migration
 *   node runCompleteMigration.js --rollback         # Run safe rollback
 *   node runCompleteMigration.js --status           # Check migration status
 *   node runCompleteMigration.js --validate         # Run validation only
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import database configuration
const connectDB = require('../config/db');

// Import orchestrator
const MigrationOrchestrator = require('./004_migration_orchestrator');

async function runCompleteMigration() {
    const args = process.argv.slice(2);
    const isRollback = args.includes('--rollback');
    const isStatusCheck = args.includes('--status');
    const isValidateOnly = args.includes('--validate');
    const backupFile = args.find(arg => arg.startsWith('--backup='))?.split('=')[1];

    console.log('='.repeat(60));
    console.log('ATTENDANCE SYSTEM MIGRATION ORCHESTRATOR');
    console.log('='.repeat(60));

    try {
        // Connect to database
        await connectDB();
        console.log('✓ Connected to database');

        // Create orchestrator instance
        const orchestrator = new MigrationOrchestrator();

        if (isStatusCheck) {
            console.log('\n📊 Checking migration status...');
            const status = await orchestrator.validateMigrationStatus();
            
            console.log('\n📋 MIGRATION STATUS REPORT');
            console.log('-'.repeat(40));
            console.log(`Migration Completed: ${status.migrationCompleted ? '✓ YES' : '✗ NO'}`);
            console.log(`Data Integrity Issues: ${status.hasDataIntegrityIssues ? '⚠️  YES' : '✓ NO'}`);
            console.log(`Warnings: ${status.hasWarnings ? '⚠️  YES' : '✓ NO'}`);
            
            if (status.validationResults) {
                console.log('\nDetailed Results:');
                console.log(`- Attendance Records: ${status.validationResults.attendanceRecords?.totalRecords || 0}`);
                console.log(`- Attendance Summaries: ${status.validationResults.attendanceSummaries?.totalSummaries || 0}`);
                console.log(`- Session Configurations: ${status.validationResults.sessionConfigurations?.totalConfigurations || 0}`);
            }

        } else if (isValidateOnly) {
            console.log('\n🔍 Running data validation only...');
            const DataValidationMigration = require('./002_data_validation_migration');
            const dataValidation = new DataValidationMigration();
            const validationResult = await dataValidation.runValidation();
            
            console.log('\n📋 VALIDATION REPORT');
            console.log('-'.repeat(40));
            console.log(`Validation Success: ${validationResult.success ? '✓ YES' : '✗ NO'}`);
            console.log(`Errors Found: ${validationResult.errors.length}`);
            console.log(`Warnings Found: ${validationResult.warnings.length}`);
            
            if (validationResult.errors.length > 0) {
                console.log('\n❌ ERRORS:');
                validationResult.errors.forEach(error => {
                    console.log(`  - ${error.context}: ${error.error}`);
                });
            }
            
            if (validationResult.warnings.length > 0) {
                console.log('\n⚠️  WARNINGS:');
                validationResult.warnings.forEach(warning => {
                    console.log(`  - ${warning.context}: ${warning.warning}`);
                });
            }

        } else if (isRollback) {
            console.log('\n🔄 Running safe rollback...');
            if (backupFile) {
                console.log(`Using backup file: ${backupFile}`);
            }
            
            const rollbackResult = await orchestrator.runSafeRollback(backupFile);
            
            console.log('\n📋 ROLLBACK REPORT');
            console.log('-'.repeat(40));
            console.log(`Rollback Success: ${rollbackResult.success ? '✓ YES' : '✗ NO'}`);
            console.log(`Duration: ${rollbackResult.duration} seconds`);
            
            if (rollbackResult.backupFile) {
                console.log(`Backup File: ${rollbackResult.backupFile}`);
            }

        } else {
            console.log('\n🚀 Running complete migration...');
            const result = await orchestrator.runCompleteMigration();
            
            console.log('\n📋 MIGRATION REPORT');
            console.log('-'.repeat(40));
            console.log(`Migration Success: ${result.success ? '✓ YES' : '✗ NO'}`);
            console.log(`Duration: ${result.duration} seconds`);
            console.log(`Backup File: ${result.backupFile}`);
            console.log(`Errors: ${result.errors.length}`);
            console.log(`Warnings: ${result.warnings.length}`);
            
            if (result.report) {
                console.log('\nMigration Details:');
                if (result.report.details.migration) {
                    const migration = result.report.details.migration;
                    console.log(`- Attendance Records Migrated: ${migration.attendanceRecordsMigrated}`);
                    console.log(`- Teacher References Updated: ${migration.teacherReferencesUpdated}`);
                    console.log(`- Summaries Created: ${migration.summariesCreated}`);
                    console.log(`- Configurations Created: ${migration.configurationsCreated}`);
                }
                
                if (result.report.details.validation) {
                    const validation = result.report.details.validation;
                    console.log(`- Total Attendance Records: ${validation.totalAttendanceRecords}`);
                    console.log(`- Total Summaries: ${validation.totalSummaries}`);
                    console.log(`- Data Integrity Issues: ${validation.dataIntegrityIssues ? 'YES' : 'NO'}`);
                }
            }
            
            if (result.errors.length > 0) {
                console.log('\n❌ ERRORS:');
                result.errors.forEach(error => {
                    console.log(`  - ${error.context}: ${error.error}`);
                });
            }
            
            if (result.warnings.length > 0) {
                console.log('\n⚠️  WARNINGS:');
                result.warnings.forEach(warning => {
                    console.log(`  - ${warning.context}: ${warning.warning}`);
                });
            }

            // Generate detailed report file
            const reportFile = await orchestrator.generateMigrationReportFile();
            console.log(`\n📄 Detailed report saved to: ${reportFile}`);
        }

        console.log('\n✅ Operation completed successfully');

    } catch (error) {
        console.error('\n❌ Operation failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node runCompleteMigration.js [options]

Options:
  --rollback              Run safe rollback to previous state
  --backup=<file>         Use specific backup file for rollback
  --status                Check current migration status
  --validate              Run data validation only
  --help, -h              Show this help message

Examples:
  node runCompleteMigration.js                    # Run complete migration
  node runCompleteMigration.js --rollback         # Run safe rollback
  node runCompleteMigration.js --status           # Check migration status
  node runCompleteMigration.js --validate         # Run validation only
  node runCompleteMigration.js --rollback --backup=backup_file.json
    `);
    process.exit(0);
}

// Run the migration
runCompleteMigration();