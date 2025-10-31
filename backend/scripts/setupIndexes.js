#!/usr/bin/env node

/**
 * Database Index Setup Script
 * Creates all necessary indexes for optimal query performance
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection function
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
        if (!mongoUrl) {
            throw new Error('MongoDB connection string not found in environment variables');
        }
        await mongoose.connect(mongoUrl);
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

// Import all models to ensure indexes are created
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
const SessionConfiguration = require('../models/sessionConfigurationSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');

async function setupIndexes() {
    console.log('Setting up database indexes...');

    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Create indexes for AttendanceRecord
        console.log('Creating AttendanceRecord indexes...');
        await AttendanceRecord.collection.createIndex({ classId: 1 });
        await AttendanceRecord.collection.createIndex({ subjectId: 1 });
        await AttendanceRecord.collection.createIndex({ teacherId: 1 });
        await AttendanceRecord.collection.createIndex({ studentId: 1 });
        await AttendanceRecord.collection.createIndex({ date: 1 });
        await AttendanceRecord.collection.createIndex({ schoolId: 1 });
        
        // Compound indexes for AttendanceRecord
        await AttendanceRecord.collection.createIndex({ classId: 1, subjectId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ studentId: 1, subjectId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ teacherId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ schoolId: 1, date: 1 });
        await AttendanceRecord.collection.createIndex({ classId: 1, subjectId: 1, date: 1, session: 1 });
        
        // Unique compound index for AttendanceRecord
        await AttendanceRecord.collection.createIndex(
            { studentId: 1, classId: 1, subjectId: 1, date: 1, session: 1 }, 
            { unique: true }
        );

        // Create indexes for AttendanceSummary
        console.log('Creating AttendanceSummary indexes...');
        await AttendanceSummary.collection.createIndex({ studentId: 1 });
        await AttendanceSummary.collection.createIndex({ subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ classId: 1 });
        await AttendanceSummary.collection.createIndex({ schoolId: 1 });
        
        // Compound indexes for AttendanceSummary
        await AttendanceSummary.collection.createIndex({ studentId: 1, subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ classId: 1, subjectId: 1 });
        await AttendanceSummary.collection.createIndex({ schoolId: 1, attendancePercentage: 1 });
        await AttendanceSummary.collection.createIndex({ studentId: 1, attendancePercentage: 1 });
        
        // Unique compound index for AttendanceSummary
        await AttendanceSummary.collection.createIndex(
            { studentId: 1, subjectId: 1, classId: 1 }, 
            { unique: true }
        );

        // Create indexes for AttendanceAuditLog
        console.log('Creating AttendanceAuditLog indexes...');
        await AttendanceAuditLog.collection.createIndex({ recordId: 1 });
        await AttendanceAuditLog.collection.createIndex({ action: 1 });
        await AttendanceAuditLog.collection.createIndex({ performedBy: 1 });
        await AttendanceAuditLog.collection.createIndex({ performedAt: 1 });
        await AttendanceAuditLog.collection.createIndex({ schoolId: 1 });
        
        // Compound indexes for AttendanceAuditLog
        await AttendanceAuditLog.collection.createIndex({ recordId: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ performedBy: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ schoolId: 1, performedAt: -1 });
        await AttendanceAuditLog.collection.createIndex({ action: 1, performedAt: -1 });
        
        // Date range index for AttendanceAuditLog
        await AttendanceAuditLog.collection.createIndex({ performedAt: -1 });

        // Create indexes for SessionConfiguration
        console.log('Creating SessionConfiguration indexes...');
        await SessionConfiguration.collection.createIndex({ subjectId: 1 });
        await SessionConfiguration.collection.createIndex({ classId: 1 });
        await SessionConfiguration.collection.createIndex({ sessionType: 1 });
        await SessionConfiguration.collection.createIndex({ schoolId: 1 });
        await SessionConfiguration.collection.createIndex({ isActive: 1 });
        
        // Compound indexes for SessionConfiguration
        await SessionConfiguration.collection.createIndex({ subjectId: 1, classId: 1 });
        await SessionConfiguration.collection.createIndex({ schoolId: 1, isActive: 1 });
        await SessionConfiguration.collection.createIndex({ sessionType: 1, isActive: 1 });
        
        // Unique compound index for SessionConfiguration
        await SessionConfiguration.collection.createIndex(
            { subjectId: 1, classId: 1, sessionType: 1 }, 
            { unique: true }
        );

        // Create indexes for Student schema
        console.log('Creating Student schema indexes...');
        await Student.collection.createIndex({ rollNum: 1 });
        await Student.collection.createIndex({ universityId: 1 }, { unique: true });
        await Student.collection.createIndex({ sclassName: 1 });
        await Student.collection.createIndex({ school: 1 });
        await Student.collection.createIndex({ isActive: 1 });
        await Student.collection.createIndex({ 'enrolledSubjects.subjectId': 1 });
        
        // Compound indexes for Student
        await Student.collection.createIndex({ school: 1, sclassName: 1 });
        await Student.collection.createIndex({ school: 1, universityId: 1 });
        await Student.collection.createIndex({ sclassName: 1, isActive: 1 });
        
        // Unique compound index for Student (prevent duplicate roll numbers within same school and class)
        await Student.collection.createIndex(
            { school: 1, sclassName: 1, rollNum: 1 }, 
            { unique: true }
        );
        
        // Text index for Student name search
        await Student.collection.createIndex({ name: 'text' });

        // Create indexes for Teacher schema
        console.log('Creating Teacher schema indexes...');
        await Teacher.collection.createIndex({ email: 1 }, { unique: true });
        await Teacher.collection.createIndex({ school: 1 });
        await Teacher.collection.createIndex({ teachSclass: 1 });
        await Teacher.collection.createIndex({ teachSubject: 1 });
        await Teacher.collection.createIndex({ isActive: 1 });
        await Teacher.collection.createIndex({ 'assignedSubjects.subjectId': 1 });
        await Teacher.collection.createIndex({ 'assignedSubjects.classId': 1 });
        await Teacher.collection.createIndex({ department: 1 });
        
        // Compound indexes for Teacher
        await Teacher.collection.createIndex({ school: 1, isActive: 1 });
        await Teacher.collection.createIndex({ school: 1, teachSclass: 1 });
        await Teacher.collection.createIndex({ 'assignedSubjects.subjectId': 1, 'assignedSubjects.classId': 1 });
        await Teacher.collection.createIndex({ school: 1, department: 1 });
        
        // Text index for Teacher name and email search
        await Teacher.collection.createIndex({ name: 'text', email: 'text' });

        console.log('All indexes created successfully!');

        // List all indexes for verification
        console.log('\nVerifying indexes...');
        
        const attendanceRecordIndexes = await AttendanceRecord.collection.listIndexes().toArray();
        console.log(`AttendanceRecord indexes: ${attendanceRecordIndexes.length}`);
        
        const attendanceSummaryIndexes = await AttendanceSummary.collection.listIndexes().toArray();
        console.log(`AttendanceSummary indexes: ${attendanceSummaryIndexes.length}`);
        
        const auditLogIndexes = await AttendanceAuditLog.collection.listIndexes().toArray();
        console.log(`AttendanceAuditLog indexes: ${auditLogIndexes.length}`);
        
        const sessionConfigIndexes = await SessionConfiguration.collection.listIndexes().toArray();
        console.log(`SessionConfiguration indexes: ${sessionConfigIndexes.length}`);
        
        const studentIndexes = await Student.collection.listIndexes().toArray();
        console.log(`Student indexes: ${studentIndexes.length}`);
        
        const teacherIndexes = await Teacher.collection.listIndexes().toArray();
        console.log(`Teacher indexes: ${teacherIndexes.length}`);

        console.log('\nIndex setup completed successfully!');

    } catch (error) {
        console.error('Error setting up indexes:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Run index setup
setupIndexes();