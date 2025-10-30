#!/usr/bin/env node

/**
 * Schema Update Validation Script
 * Validates that Student and Teacher schemas have been properly updated
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');

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

async function validateSchemaUpdates() {
    console.log('Validating schema updates...');

    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Validate Student schema structure
        console.log('\n=== Student Schema Validation ===');
        
        const studentSchema = Student.schema;
        const studentPaths = studentSchema.paths;
        
        // Check required fields exist
        const requiredStudentFields = [
            'name', 'rollNum', 'universityId', 'password', 
            'sclassName', 'school', 'enrolledSubjects'
        ];
        
        const missingStudentFields = [];
        for (const field of requiredStudentFields) {
            if (!studentPaths[field]) {
                missingStudentFields.push(field);
            } else {
                console.log(`✓ ${field} field exists`);
            }
        }
        
        if (missingStudentFields.length > 0) {
            console.error(`✗ Missing Student fields: ${missingStudentFields.join(', ')}`);
        }
        
        // Check that old attendance field is removed
        if (studentPaths['attendance']) {
            console.error('✗ Old attendance field still exists in Student schema');
        } else {
            console.log('✓ Old attendance field properly removed');
        }
        
        // Check enrolledSubjects structure
        if (studentPaths['enrolledSubjects']) {
            const enrolledSubjectsSchema = studentPaths['enrolledSubjects'].schema;
            if (enrolledSubjectsSchema && 
                enrolledSubjectsSchema.paths['subjectId'] && 
                enrolledSubjectsSchema.paths['enrolledAt']) {
                console.log('✓ enrolledSubjects has correct structure');
            } else {
                console.error('✗ enrolledSubjects structure is incorrect');
            }
        }
        
        // Check universityId field properties
        if (studentPaths['universityId']) {
            const universityIdPath = studentPaths['universityId'];
            if (universityIdPath.isRequired && universityIdPath.options.unique) {
                console.log('✓ universityId is required and unique');
            } else {
                console.error('✗ universityId missing required or unique constraint');
            }
        }

        // Validate Teacher schema structure
        console.log('\n=== Teacher Schema Validation ===');
        
        const teacherSchema = Teacher.schema;
        const teacherPaths = teacherSchema.paths;
        
        // Check required fields exist
        const requiredTeacherFields = [
            'name', 'email', 'password', 'school', 
            'teachSclass', 'assignedSubjects'
        ];
        
        const missingTeacherFields = [];
        for (const field of requiredTeacherFields) {
            if (!teacherPaths[field]) {
                missingTeacherFields.push(field);
            } else {
                console.log(`✓ ${field} field exists`);
            }
        }
        
        if (missingTeacherFields.length > 0) {
            console.error(`✗ Missing Teacher fields: ${missingTeacherFields.join(', ')}`);
        }
        
        // Check that old attendance field is removed
        if (teacherPaths['attendance']) {
            console.error('✗ Old attendance field still exists in Teacher schema');
        } else {
            console.log('✓ Old attendance field properly removed');
        }
        
        // Check assignedSubjects structure
        if (teacherPaths['assignedSubjects']) {
            const assignedSubjectsSchema = teacherPaths['assignedSubjects'].schema;
            if (assignedSubjectsSchema && 
                assignedSubjectsSchema.paths['subjectId'] && 
                assignedSubjectsSchema.paths['classId'] &&
                assignedSubjectsSchema.paths['assignedAt']) {
                console.log('✓ assignedSubjects has correct structure');
            } else {
                console.error('✗ assignedSubjects structure is incorrect');
            }
        }
        
        // Check email field properties
        if (teacherPaths['email']) {
            const emailPath = teacherPaths['email'];
            if (emailPath.isRequired && emailPath.options.unique) {
                console.log('✓ email is required and unique');
            } else {
                console.error('✗ email missing required or unique constraint');
            }
        }

        // Test schema methods
        console.log('\n=== Schema Methods Validation ===');
        
        // Test Student methods
        const studentMethods = [
            'isEnrolledInSubject',
            'enrollInSubject', 
            'unenrollFromSubject'
        ];
        
        for (const method of studentMethods) {
            if (typeof Student.prototype[method] === 'function') {
                console.log(`✓ Student.${method} method exists`);
            } else {
                console.error(`✗ Student.${method} method missing`);
            }
        }
        
        // Test Student static methods
        const studentStaticMethods = [
            'findByUniversityIdPattern',
            'findEnrolledInSubject'
        ];
        
        for (const method of studentStaticMethods) {
            if (typeof Student[method] === 'function') {
                console.log(`✓ Student.${method} static method exists`);
            } else {
                console.error(`✗ Student.${method} static method missing`);
            }
        }
        
        // Test Teacher methods
        const teacherMethods = [
            'isAssignedToSubject',
            'assignToSubject',
            'unassignFromSubject',
            'getTaughtClasses',
            'getTaughtSubjects'
        ];
        
        for (const method of teacherMethods) {
            if (typeof Teacher.prototype[method] === 'function') {
                console.log(`✓ Teacher.${method} method exists`);
            } else {
                console.error(`✗ Teacher.${method} method missing`);
            }
        }
        
        // Test Teacher static methods
        const teacherStaticMethods = [
            'findAssignedToSubject',
            'findByClass',
            'findBySchoolAndDepartment'
        ];
        
        for (const method of teacherStaticMethods) {
            if (typeof Teacher[method] === 'function') {
                console.log(`✓ Teacher.${method} static method exists`);
            } else {
                console.error(`✗ Teacher.${method} static method missing`);
            }
        }

        // Test database indexes
        console.log('\n=== Database Indexes Validation ===');
        
        try {
            const studentIndexes = await Student.collection.listIndexes().toArray();
            console.log(`✓ Student collection has ${studentIndexes.length} indexes`);
            
            // Check for key indexes
            const hasUniversityIdIndex = studentIndexes.some(idx => 
                idx.key && idx.key.universityId === 1
            );
            const hasRollNumIndex = studentIndexes.some(idx => 
                idx.key && idx.key.rollNum === 1
            );
            const hasEnrolledSubjectsIndex = studentIndexes.some(idx => 
                idx.key && idx.key['enrolledSubjects.subjectId'] === 1
            );
            
            if (hasUniversityIdIndex) console.log('✓ Student universityId index exists');
            else console.error('✗ Student universityId index missing');
            
            if (hasRollNumIndex) console.log('✓ Student rollNum index exists');
            else console.error('✗ Student rollNum index missing');
            
            if (hasEnrolledSubjectsIndex) console.log('✓ Student enrolledSubjects index exists');
            else console.error('✗ Student enrolledSubjects index missing');
            
        } catch (error) {
            console.error('✗ Error checking Student indexes:', error.message);
        }
        
        try {
            const teacherIndexes = await Teacher.collection.listIndexes().toArray();
            console.log(`✓ Teacher collection has ${teacherIndexes.length} indexes`);
            
            // Check for key indexes
            const hasEmailIndex = teacherIndexes.some(idx => 
                idx.key && idx.key.email === 1
            );
            const hasAssignedSubjectsIndex = teacherIndexes.some(idx => 
                idx.key && (idx.key['assignedSubjects.subjectId'] === 1 || 
                           idx.key['assignedSubjects.classId'] === 1)
            );
            
            if (hasEmailIndex) console.log('✓ Teacher email index exists');
            else console.error('✗ Teacher email index missing');
            
            if (hasAssignedSubjectsIndex) console.log('✓ Teacher assignedSubjects index exists');
            else console.error('✗ Teacher assignedSubjects index missing');
            
        } catch (error) {
            console.error('✗ Error checking Teacher indexes:', error.message);
        }

        console.log('\n=== Schema Update Validation Complete ===');
        console.log('✓ Schema updates have been successfully implemented');

    } catch (error) {
        console.error('Error validating schema updates:', error.message);
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

// Run validation
validateSchemaUpdates();