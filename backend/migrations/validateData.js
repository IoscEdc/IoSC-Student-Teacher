const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
require('dotenv').config();

/**
 * Data validation script for attendance system migration
 * Checks data integrity and consistency
 */

class DataValidator {
    constructor() {
        this.validationResults = {
            students: { total: 0, valid: 0, issues: [] },
            teachers: { total: 0, valid: 0, issues: [] },
            attendanceRecords: { total: 0, valid: 0, issues: [] },
            summaries: { total: 0, valid: 0, issues: [] },
            relationships: { valid: 0, issues: [] }
        };
    }

    /**
     * Run complete data validation
     */
    async validate() {
        console.log('Starting data validation...');
        
        try {
            await this.validateStudents();
            await this.validateTeachers();
            await this.validateAttendanceRecords();
            await this.validateAttendanceSummaries();
            await this.validateRelationships();
            
            this.printResults();
            
        } catch (error) {
            console.error('Validation failed:', error);
            throw error;
        }
    }

    /**
     * Validate student data
     */
    async validateStudents() {
        console.log('Validating students...');
        
        const students = await Student.find({});
        this.validationResults.students.total = students.length;
        
        for (const student of students) {
            let isValid = true;
            
            // Check required fields
            if (!student.name || !student.rollNum || !student.sclassName || !student.school) {
                this.validationResults.students.issues.push(
                    `Student ${student._id}: Missing required fields`
                );
                isValid = false;
            }
            
            // Check universityId exists
            if (!student.universityId) {
                this.validationResults.students.issues.push(
                    `Student ${student._id}: Missing universityId`
                );
                isValid = false;
            }
            
            // Check enrolledSubjects field
            if (!student.enrolledSubjects || !Array.isArray(student.enrolledSubjects)) {
                this.validationResults.students.issues.push(
                    `Student ${student._id}: Missing or invalid enrolledSubjects`
                );
                isValid = false;
            }
            
            // Check for old attendance array (should be removed)
            if (student.attendance) {
                this.validationResults.students.issues.push(
                    `Student ${student._id}: Old attendance array still exists`
                );
                isValid = false;
            }
            
            if (isValid) {
                this.validationResults.students.valid++;
            }
        }
    }

    /**
     * Validate teacher data
     */
    async validateTeachers() {
        console.log('Validating teachers...');
        
        const teachers = await Teacher.find({});
        this.validationResults.teachers.total = teachers.length;
        
        for (const teacher of teachers) {
            let isValid = true;
            
            // Check required fields
            if (!teacher.name || !teacher.email || !teacher.school) {
                this.validationResults.teachers.issues.push(
                    `Teacher ${teacher._id}: Missing required fields`
                );
                isValid = false;
            }
            
            // Check assignedSubjects field
            if (!teacher.assignedSubjects || !Array.isArray(teacher.assignedSubjects)) {
                this.validationResults.teachers.issues.push(
                    `Teacher ${teacher._id}: Missing or invalid assignedSubjects`
                );
                isValid = false;
            }
            
            // Check for old attendance array (should be removed)
            if (teacher.attendance) {
                this.validationResults.teachers.issues.push(
                    `Teacher ${teacher._id}: Old attendance array still exists`
                );
                isValid = false;
            }
            
            if (isValid) {
                this.validationResults.teachers.valid++;
            }
        }
    }

    /**
     * Validate attendance records
     */
    async validateAttendanceRecords() {
        console.log('Validating attendance records...');
        
        const records = await AttendanceRecord.find({});
        this.validationResults.attendanceRecords.total = records.length;
        
        for (const record of records) {
            let isValid = true;
            
            // Check required fields
            const requiredFields = ['classId', 'subjectId', 'teacherId', 'studentId', 'date', 'session', 'status', 'markedBy', 'schoolId'];
            for (const field of requiredFields) {
                if (!record[field]) {
                    this.validationResults.attendanceRecords.issues.push(
                        `Record ${record._id}: Missing ${field}`
                    );
                    isValid = false;
                }
            }
            
            // Check valid status values
            const validStatuses = ['present', 'absent', 'late', 'excused'];
            if (!validStatuses.includes(record.status)) {
                this.validationResults.attendanceRecords.issues.push(
                    `Record ${record._id}: Invalid status '${record.status}'`
                );
                isValid = false;
            }
            
            // Check valid session values
            const validSessions = ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lab 1', 'Lab 2', 'Tutorial 1', 'Tutorial 2'];
            if (!validSessions.includes(record.session)) {
                this.validationResults.attendanceRecords.issues.push(
                    `Record ${record._id}: Invalid session '${record.session}'`
                );
                isValid = false;
            }
            
            if (isValid) {
                this.validationResults.attendanceRecords.valid++;
            }
        }
    }

    /**
     * Validate attendance summaries
     */
    async validateAttendanceSummaries() {
        console.log('Validating attendance summaries...');
        
        const summaries = await AttendanceSummary.find({});
        this.validationResults.summaries.total = summaries.length;
        
        for (const summary of summaries) {
            let isValid = true;
            
            // Check required fields
            const requiredFields = ['studentId', 'subjectId', 'classId', 'schoolId'];
            for (const field of requiredFields) {
                if (!summary[field]) {
                    this.validationResults.summaries.issues.push(
                        `Summary ${summary._id}: Missing ${field}`
                    );
                    isValid = false;
                }
            }
            
            // Check numeric fields are non-negative
            const numericFields = ['totalSessions', 'presentCount', 'absentCount', 'lateCount', 'excusedCount'];
            for (const field of numericFields) {
                if (summary[field] < 0) {
                    this.validationResults.summaries.issues.push(
                        `Summary ${summary._id}: Negative value for ${field}`
                    );
                    isValid = false;
                }
            }
            
            // Check attendance percentage is valid
            if (summary.attendancePercentage < 0 || summary.attendancePercentage > 100) {
                this.validationResults.summaries.issues.push(
                    `Summary ${summary._id}: Invalid attendance percentage ${summary.attendancePercentage}`
                );
                isValid = false;
            }
            
            // Check total sessions calculation
            const calculatedTotal = summary.presentCount + summary.absentCount + summary.lateCount + summary.excusedCount;
            if (summary.totalSessions !== calculatedTotal) {
                this.validationResults.summaries.issues.push(
                    `Summary ${summary._id}: Total sessions mismatch (${summary.totalSessions} vs ${calculatedTotal})`
                );
                isValid = false;
            }
            
            if (isValid) {
                this.validationResults.summaries.valid++;
            }
        }
    }

    /**
     * Validate relationships between collections
     */
    async validateRelationships() {
        console.log('Validating relationships...');
        
        // Check attendance records have valid references
        const records = await AttendanceRecord.find({});
        
        for (const record of records) {
            // Check student exists
            const student = await Student.findById(record.studentId);
            if (!student) {
                this.validationResults.relationships.issues.push(
                    `Record ${record._id}: Student ${record.studentId} not found`
                );
                continue;
            }
            
            // Check teacher exists
            const teacher = await Teacher.findById(record.teacherId);
            if (!teacher) {
                this.validationResults.relationships.issues.push(
                    `Record ${record._id}: Teacher ${record.teacherId} not found`
                );
                continue;
            }
            
            // Check teacher is assigned to the subject/class
            const isAssigned = teacher.assignedSubjects.some(assignment => 
                assignment.subjectId.toString() === record.subjectId.toString() &&
                assignment.classId.toString() === record.classId.toString()
            );
            
            if (!isAssigned) {
                this.validationResults.relationships.issues.push(
                    `Record ${record._id}: Teacher ${record.teacherId} not assigned to subject/class`
                );
                continue;
            }
            
            // Check student is enrolled in the subject
            const isEnrolled = student.enrolledSubjects.some(enrollment =>
                enrollment.subjectId.toString() === record.subjectId.toString()
            );
            
            if (!isEnrolled) {
                this.validationResults.relationships.issues.push(
                    `Record ${record._id}: Student ${record.studentId} not enrolled in subject`
                );
                continue;
            }
            
            this.validationResults.relationships.valid++;
        }
    }

    /**
     * Print validation results
     */
    printResults() {
        console.log('\n=== Data Validation Results ===');
        
        // Students
        console.log(`\nStudents: ${this.validationResults.students.valid}/${this.validationResults.students.total} valid`);
        if (this.validationResults.students.issues.length > 0) {
            console.log('Student Issues:');
            this.validationResults.students.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Teachers
        console.log(`\nTeachers: ${this.validationResults.teachers.valid}/${this.validationResults.teachers.total} valid`);
        if (this.validationResults.teachers.issues.length > 0) {
            console.log('Teacher Issues:');
            this.validationResults.teachers.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Attendance Records
        console.log(`\nAttendance Records: ${this.validationResults.attendanceRecords.valid}/${this.validationResults.attendanceRecords.total} valid`);
        if (this.validationResults.attendanceRecords.issues.length > 0) {
            console.log('Attendance Record Issues:');
            this.validationResults.attendanceRecords.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Summaries
        console.log(`\nAttendance Summaries: ${this.validationResults.summaries.valid}/${this.validationResults.summaries.total} valid`);
        if (this.validationResults.summaries.issues.length > 0) {
            console.log('Summary Issues:');
            this.validationResults.summaries.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Relationships
        console.log(`\nRelationships: ${this.validationResults.relationships.valid} valid`);
        if (this.validationResults.relationships.issues.length > 0) {
            console.log('Relationship Issues:');
            this.validationResults.relationships.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Overall summary
        const totalIssues = this.validationResults.students.issues.length +
                           this.validationResults.teachers.issues.length +
                           this.validationResults.attendanceRecords.issues.length +
                           this.validationResults.summaries.issues.length +
                           this.validationResults.relationships.issues.length;
        
        console.log(`\n=== Summary ===`);
        console.log(`Total Issues Found: ${totalIssues}`);
        
        if (totalIssues === 0) {
            console.log('✅ All data validation checks passed!');
        } else {
            console.log('❌ Data validation found issues that need to be addressed.');
        }
    }

    /**
     * Get validation summary for programmatic use
     */
    getValidationSummary() {
        const totalIssues = this.validationResults.students.issues.length +
                           this.validationResults.teachers.issues.length +
                           this.validationResults.attendanceRecords.issues.length +
                           this.validationResults.summaries.issues.length +
                           this.validationResults.relationships.issues.length;
        
        return {
            isValid: totalIssues === 0,
            totalIssues,
            results: this.validationResults
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    async function runValidation() {
        try {
            // Connect to database
            console.log('Connecting to database...');
            await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Database connected successfully');

            // Create validator instance
            const validator = new DataValidator();

            // Run validation
            await validator.validate();

            const summary = validator.getValidationSummary();
            process.exit(summary.isValid ? 0 : 1);
            
        } catch (error) {
            console.error('Validation failed:', error.message);
            process.exit(1);
            
        } finally {
            // Close database connection
            await mongoose.connection.close();
            console.log('Database connection closed');
        }
    }

    runValidation();
}

module.exports = DataValidator;