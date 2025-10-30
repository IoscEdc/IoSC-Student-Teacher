#!/usr/bin/env node

/**
 * Complete Database Setup Script
 * Sets up the new attendance system database schema
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import database configuration
const connectDB = require('../config/db');

// Import migration
const AttendanceMigration = require('../migrations/001_attendance_system_migration');

// Import all models to ensure they are registered
require('../models/attendanceRecordSchema');
require('../models/attendanceSummarySchema');
require('../models/attendanceAuditLogSchema');
require('../models/sessionConfigurationSchema');

async function setupDatabase() {
    console.log('Starting complete database setup for attendance system...');

    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Step 1: Create indexes
        console.log('\n=== STEP 1: Setting up database indexes ===');
        const setupIndexes = require('./setupIndexes');
        // Note: We'll run the index creation inline to avoid process exit
        
        // Import models
        const AttendanceRecord = require('../models/attendanceRecordSchema');
        const AttendanceSummary = require('../models/attendanceSummarySchema');
        const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
        const SessionConfiguration = require('../models/sessionConfigurationSchema');

        // Create indexes
        console.log('Creating database indexes...');
        
        // AttendanceRecord indexes
        await AttendanceRecord.collection.createIndex({ classId: 1 });
        await AttendanceRecord.collection.createIndex({ subjectId: 1 });
        await AttendanceRecord.collection.createIndex({ teacherId: 1 });
        await AttendanceRecord.collection.createIndex({ studentId: 1 });
        await AttendanceRecord.collection.createIndex({ date: 1 });
        await AttendanceRecord.collection.createIndex({ schoolId: 1 });
        await AttendanceRecord.collection.createIndex({ classId: 1, subjectId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ studentId: 1, subjectId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ teacherId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ schoolId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ classId: 1, subjectId: 1, date: 1, session: 1 });
        await AttendanceRecord.collection.createIndex(
            { studentId: 1, classId: 1, subjectId: 1, date: 1, session: 1 }, 
            { unique: true }
        );

        // AttendanceSummary indexes
        await AttendanceSummary.collection.createIndex({ studentId: 1 });
        await AttendanceSummary.collection.createIndex({ subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ classId: 1 });
        await AttendanceSummary.collection.createIndex({ schoolId: 1 });
        await AttendanceSummary.collection.createIndex({ studentId: 1, subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ classId: 1, subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ schoolId: 1, attendancePercentage: 1 });
        await AttendanceSummary.collection.createIndex({ studentId: 1, attendancePercentage: 1 });
        await AttendanceSummary.collection.createIndex(
            { studentId: 1, subjectId: 1, classId: 1 }, 
            { unique: true }
        );

        // AttendanceAuditLog indexes
        await AttendanceAuditLog.collection.createIndex({ recordId: 1 });
        await AttendanceAuditLog.collection.createIndex({ action: 1 });
        await AttendanceAuditLog.collection.createIndex({ performedBy: 1 });
        await AttendanceAuditLog.collection.createIndex({ performedAt: 1 });
        await AttendanceAuditLog.collection.createIndex({ schoolId: 1 });
        await AttendanceAuditLog.collection.createIndex({ recordId: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ performedBy: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ schoolId: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ action: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ performedAt: -1 });

        // SessionConfiguration indexes
        await SessionConfiguration.collection.createIndex({ subjectId: 1 });
        await SessionConfiguration.collection.createIndex({ classId: 1 });
        await SessionConfiguration.collection.createIndex({ sessionType: 1 });
        await SessionConfiguration.collection.createIndex({ schoolId: 1 });
        await SessionConfiguration.collection.createIndex({ isActive: 1 });
        await SessionConfiguration.collection.createIndex({ subjectId: 1, classId: 1 });
        await SessionConfiguration.collection.createIndex({ schoolId: 1, isActive: 1 });
        await SessionConfiguration.collection.createIndex({ sessionType: 1, isActive: 1 });
        await SessionConfiguration.collection.createIndex(
            { subjectId: 1, classId: 1, sessionType: 1 }, 
            { unique: true }
        );

        console.log('Database indexes created successfully!');

        // Step 2: Run migration (optional - only if there's existing data)
        console.log('\n=== STEP 2: Checking for existing data to migrate ===');
        
        const Student = require('../models/studentSchema');
        const studentsWithAttendance = await Student.countDocuments({ 
            attendance: { $exists: true, $ne: [] } 
        });

        if (studentsWithAttendance > 0) {
            console.log(`Found ${studentsWithAttendance} students with existing attendance data`);
            console.log('Running migration...');
            
            const migration = new AttendanceMigration();
            const migrationResult = await migration.runMigration();
            
            if (migrationResult.success) {
                console.log('Migration completed successfully!');
                console.log('Migration results:', JSON.stringify(migrationResult.results, null, 2));
            } else {
                console.error('Migration failed');
                throw new Error('Migration failed');
            }
        } else {
            console.log('No existing attendance data found. Skipping migration.');
        }

        // Step 3: Verify setup
        console.log('\n=== STEP 3: Verifying database setup ===');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const requiredCollections = [
            'attendancerecords',
            'attendancesummaries', 
            'attendanceauditlogs',
            'sessionconfigurations'
        ];

        console.log('Checking required collections...');
        for (const collection of requiredCollections) {
            if (collectionNames.includes(collection)) {
                console.log(`✓ ${collection} collection exists`);
            } else {
                console.log(`✗ ${collection} collection missing`);
            }
        }

        // Verify indexes
        console.log('\nVerifying indexes...');
        const attendanceRecordIndexes = await AttendanceRecord.collection.listIndexes().toArray();
        const attendanceSummaryIndexes = await AttendanceSummary.collection.listIndexes().toArray();
        const auditLogIndexes = await AttendanceAuditLog.collection.listIndexes().toArray();
        const sessionConfigIndexes = await SessionConfiguration.collection.listIndexes().toArray();
        
        console.log(`✓ AttendanceRecord indexes: ${attendanceRecordIndexes.length}`);
        console.log(`✓ AttendanceSummary indexes: ${attendanceSummaryIndexes.length}`);
        console.log(`✓ AttendanceAuditLog indexes: ${auditLogIndexes.length}`);
        console.log(`✓ SessionConfiguration indexes: ${sessionConfigIndexes.length}`);

        console.log('\n=== DATABASE SETUP COMPLETED SUCCESSFULLY! ===');
        console.log('The attendance system is now ready to use.');
        console.log('\nNext steps:');
        console.log('1. Update your application to use the new attendance models');
        console.log('2. Test the new attendance functionality');
        console.log('3. Update your frontend to work with the new API endpoints');

    } catch (error) {
        console.error('Database setup error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Run database setup
setupDatabase();