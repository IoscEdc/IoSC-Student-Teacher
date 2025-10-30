const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure schemas are registered
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
const SessionConfiguration = require('../models/sessionConfigurationSchema');

/**
 * Database index setup script
 * Creates all necessary indexes for optimal performance
 */

class DatabaseIndexSetup {
    constructor() {
        this.indexResults = [];
        this.errors = [];
    }

    /**
     * Main setup function
     */
    async setup() {
        console.log('Setting up database indexes...');
        
        try {
            // Setup indexes for all models
            await this.setupStudentIndexes();
            await this.setupTeacherIndexes();
            await this.setupAttendanceRecordIndexes();
            await this.setupAttendanceSummaryIndexes();
            await this.setupAttendanceAuditLogIndexes();
            await this.setupSessionConfigurationIndexes();
            
            // Create additional custom indexes
            await this.setupCustomIndexes();
            
            // Validate all indexes
            await this.validateIndexes();
            
            this.printResults();
            
        } catch (error) {
            console.error('Index setup failed:', error);
            throw error;
        }
    }

    /**
     * Setup Student collection indexes
     */
    async setupStudentIndexes() {
        console.log('Setting up Student indexes...');
        
        try {
            const collection = Student.collection;
            
            // Single field indexes
            await this.createIndex(collection, { rollNum: 1 }, 'student_rollNum');
            await this.createIndex(collection, { universityId: 1 }, 'student_universityId', { unique: true });
            await this.createIndex(collection, { sclassName: 1 }, 'student_sclassName');
            await this.createIndex(collection, { school: 1 }, 'student_school');
            await this.createIndex(collection, { isActive: 1 }, 'student_isActive');
            
            // Compound indexes
            await this.createIndex(collection, { school: 1, sclassName: 1 }, 'student_school_class');
            await this.createIndex(collection, { school: 1, universityId: 1 }, 'student_school_universityId');
            await this.createIndex(collection, { sclassName: 1, isActive: 1 }, 'student_class_active');
            await this.createIndex(collection, { 'enrolledSubjects.subjectId': 1 }, 'student_enrolledSubjects');
            
            // Unique compound index for roll number within school and class
            await this.createIndex(
                collection, 
                { school: 1, sclassName: 1, rollNum: 1 }, 
                'student_unique_rollNum',
                { unique: true }
            );
            
            // Text index for search
            await this.createIndex(collection, { name: 'text' }, 'student_text_search');
            
        } catch (error) {
            this.errors.push(`Student indexes error: ${error.message}`);
        }
    }

    /**
     * Setup Teacher collection indexes
     */
    async setupTeacherIndexes() {
        console.log('Setting up Teacher indexes...');
        
        try {
            const collection = Teacher.collection;
            
            // Single field indexes
            await this.createIndex(collection, { email: 1 }, 'teacher_email', { unique: true });
            await this.createIndex(collection, { school: 1 }, 'teacher_school');
            await this.createIndex(collection, { teachSubject: 1 }, 'teacher_teachSubject');
            await this.createIndex(collection, { teachSclass: 1 }, 'teacher_teachSclass');
            await this.createIndex(collection, { isActive: 1 }, 'teacher_isActive');
            
            // Compound indexes
            await this.createIndex(collection, { school: 1, isActive: 1 }, 'teacher_school_active');
            await this.createIndex(collection, { school: 1, teachSclass: 1 }, 'teacher_school_class');
            await this.createIndex(
                collection, 
                { 'assignedSubjects.subjectId': 1, 'assignedSubjects.classId': 1 }, 
                'teacher_assignedSubjects'
            );
            await this.createIndex(collection, { school: 1, department: 1 }, 'teacher_school_department');
            
            // Text index for search
            await this.createIndex(collection, { name: 'text', email: 'text' }, 'teacher_text_search');
            
        } catch (error) {
            this.errors.push(`Teacher indexes error: ${error.message}`);
        }
    }

    /**
     * Setup AttendanceRecord collection indexes
     */
    async setupAttendanceRecordIndexes() {
        console.log('Setting up AttendanceRecord indexes...');
        
        try {
            const collection = AttendanceRecord.collection;
            
            // Single field indexes
            await this.createIndex(collection, { classId: 1 }, 'attendance_classId');
            await this.createIndex(collection, { subjectId: 1 }, 'attendance_subjectId');
            await this.createIndex(collection, { teacherId: 1 }, 'attendance_teacherId');
            await this.createIndex(collection, { studentId: 1 }, 'attendance_studentId');
            await this.createIndex(collection, { date: 1 }, 'attendance_date');
            await this.createIndex(collection, { schoolId: 1 }, 'attendance_schoolId');
            await this.createIndex(collection, { status: 1 }, 'attendance_status');
            
            // Compound indexes for common queries
            await this.createIndex(
                collection, 
                { classId: 1, subjectId: 1, date: 1 }, 
                'attendance_class_subject_date'
            );
            await this.createIndex(
                collection, 
                { studentId: 1, subjectId: 1, date: 1 }, 
                'attendance_student_subject_date'
            );
            await this.createIndex(collection, { teacherId: 1, date: 1 }, 'attendance_teacher_date');
            await this.createIndex(collection, { schoolId: 1, date: 1 }, 'attendance_school_date');
            
            // Unique compound index to prevent duplicate attendance records
            await this.createIndex(
                collection,
                { studentId: 1, classId: 1, subjectId: 1, date: 1, session: 1 },
                'attendance_unique_record',
                { unique: true }
            );
            
            // Performance indexes for analytics
            await this.createIndex(
                collection,
                { schoolId: 1, date: 1, status: 1 },
                'attendance_analytics'
            );
            
        } catch (error) {
            this.errors.push(`AttendanceRecord indexes error: ${error.message}`);
        }
    }

    /**
     * Setup AttendanceSummary collection indexes
     */
    async setupAttendanceSummaryIndexes() {
        console.log('Setting up AttendanceSummary indexes...');
        
        try {
            const collection = AttendanceSummary.collection;
            
            // Single field indexes
            await this.createIndex(collection, { studentId: 1 }, 'summary_studentId');
            await this.createIndex(collection, { subjectId: 1 }, 'summary_subjectId');
            await this.createIndex(collection, { classId: 1 }, 'summary_classId');
            await this.createIndex(collection, { schoolId: 1 }, 'summary_schoolId');
            await this.createIndex(collection, { attendancePercentage: 1 }, 'summary_percentage');
            
            // Compound indexes
            await this.createIndex(
                collection, 
                { studentId: 1, subjectId: 1 }, 
                'summary_student_subject'
            );
            await this.createIndex(
                collection, 
                { classId: 1, subjectId: 1 }, 
                'summary_class_subject'
            );
            await this.createIndex(
                collection, 
                { schoolId: 1, attendancePercentage: 1 }, 
                'summary_school_analytics'
            );
            await this.createIndex(
                collection, 
                { studentId: 1, attendancePercentage: 1 }, 
                'summary_student_performance'
            );
            
            // Unique compound index to ensure one summary per student-subject-class
            await this.createIndex(
                collection,
                { studentId: 1, subjectId: 1, classId: 1 },
                'summary_unique',
                { unique: true }
            );
            
        } catch (error) {
            this.errors.push(`AttendanceSummary indexes error: ${error.message}`);
        }
    }

    /**
     * Setup AttendanceAuditLog collection indexes
     */
    async setupAttendanceAuditLogIndexes() {
        console.log('Setting up AttendanceAuditLog indexes...');
        
        try {
            const collection = AttendanceAuditLog.collection;
            
            // Single field indexes
            await this.createIndex(collection, { recordId: 1 }, 'audit_recordId');
            await this.createIndex(collection, { action: 1 }, 'audit_action');
            await this.createIndex(collection, { performedBy: 1 }, 'audit_performedBy');
            await this.createIndex(collection, { performedAt: -1 }, 'audit_performedAt_desc');
            await this.createIndex(collection, { schoolId: 1 }, 'audit_schoolId');
            
            // Compound indexes for common audit queries
            await this.createIndex(
                collection, 
                { recordId: 1, performedAt: -1 }, 
                'audit_record_history'
            );
            await this.createIndex(
                collection, 
                { performedBy: 1, performedAt: -1 }, 
                'audit_user_activity'
            );
            await this.createIndex(
                collection, 
                { schoolId: 1, performedAt: -1 }, 
                'audit_school_reports'
            );
            await this.createIndex(
                collection, 
                { action: 1, performedAt: -1 }, 
                'audit_action_timeline'
            );
            
        } catch (error) {
            this.errors.push(`AttendanceAuditLog indexes error: ${error.message}`);
        }
    }

    /**
     * Setup SessionConfiguration collection indexes
     */
    async setupSessionConfigurationIndexes() {
        console.log('Setting up SessionConfiguration indexes...');
        
        try {
            const collection = SessionConfiguration.collection;
            
            // Single field indexes
            await this.createIndex(collection, { subjectId: 1 }, 'session_subjectId');
            await this.createIndex(collection, { classId: 1 }, 'session_classId');
            await this.createIndex(collection, { schoolId: 1 }, 'session_schoolId');
            
            // Compound indexes
            await this.createIndex(
                collection, 
                { subjectId: 1, classId: 1 }, 
                'session_subject_class'
            );
            await this.createIndex(
                collection, 
                { schoolId: 1, sessionType: 1 }, 
                'session_school_type'
            );
            
            // Unique compound index to ensure one configuration per subject-class
            await this.createIndex(
                collection,
                { subjectId: 1, classId: 1 },
                'session_unique_config',
                { unique: true }
            );
            
        } catch (error) {
            this.errors.push(`SessionConfiguration indexes error: ${error.message}`);
        }
    }

    /**
     * Setup additional custom indexes for cross-collection queries
     */
    async setupCustomIndexes() {
        console.log('Setting up custom indexes...');
        
        try {
            // Additional performance indexes based on common query patterns
            
            // Student attendance performance queries
            await this.createIndex(
                Student.collection,
                { school: 1, sclassName: 1, isActive: 1 },
                'student_active_in_school_class'
            );
            
            // Teacher workload queries
            await this.createIndex(
                Teacher.collection,
                { school: 1, 'assignedSubjects.subjectId': 1, isActive: 1 },
                'teacher_subject_workload'
            );
            
            // Attendance reporting queries
            await this.createIndex(
                AttendanceRecord.collection,
                { schoolId: 1, classId: 1, date: 1, status: 1 },
                'attendance_school_class_reporting'
            );
            
        } catch (error) {
            this.errors.push(`Custom indexes error: ${error.message}`);
        }
    }

    /**
     * Create an index with error handling
     */
    async createIndex(collection, indexSpec, name, options = {}) {
        try {
            const result = await collection.createIndex(indexSpec, { 
                name: name,
                background: true, // Create index in background
                ...options 
            });
            
            this.indexResults.push({
                collection: collection.collectionName,
                name: name,
                spec: indexSpec,
                status: 'created',
                result: result
            });
            
            console.log(`✓ Created index ${name} on ${collection.collectionName}`);
            
        } catch (error) {
            if (error.code === 85) { // Index already exists
                this.indexResults.push({
                    collection: collection.collectionName,
                    name: name,
                    spec: indexSpec,
                    status: 'exists',
                    result: 'Index already exists'
                });
                console.log(`- Index ${name} already exists on ${collection.collectionName}`);
            } else {
                this.errors.push(`Failed to create index ${name} on ${collection.collectionName}: ${error.message}`);
                console.error(`✗ Failed to create index ${name} on ${collection.collectionName}: ${error.message}`);
            }
        }
    }

    /**
     * Validate that all indexes were created successfully
     */
    async validateIndexes() {
        console.log('Validating indexes...');
        
        const collections = [
            { model: Student, name: 'students' },
            { model: Teacher, name: 'teachers' },
            { model: AttendanceRecord, name: 'attendancerecords' },
            { model: AttendanceSummary, name: 'attendancesummaries' },
            { model: AttendanceAuditLog, name: 'attendanceauditlogs' },
            { model: SessionConfiguration, name: 'sessionconfigurations' }
        ];
        
        for (const { model, name } of collections) {
            try {
                const indexes = await model.collection.getIndexes();
                console.log(`${name}: ${Object.keys(indexes).length} indexes`);
                
                // Log index details for verification
                for (const [indexName, indexSpec] of Object.entries(indexes)) {
                    console.log(`  - ${indexName}: ${JSON.stringify(indexSpec.key)}`);
                }
                
            } catch (error) {
                this.errors.push(`Failed to validate indexes for ${name}: ${error.message}`);
            }
        }
    }

    /**
     * Print setup results
     */
    printResults() {
        console.log('\n=== Database Index Setup Results ===');
        
        const created = this.indexResults.filter(r => r.status === 'created').length;
        const existing = this.indexResults.filter(r => r.status === 'exists').length;
        
        console.log(`Indexes created: ${created}`);
        console.log(`Indexes already existing: ${existing}`);
        console.log(`Total errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n=== Errors ===');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\n=== Summary by Collection ===');
        const collectionSummary = {};
        
        for (const result of this.indexResults) {
            if (!collectionSummary[result.collection]) {
                collectionSummary[result.collection] = { created: 0, exists: 0 };
            }
            collectionSummary[result.collection][result.status]++;
        }
        
        for (const [collection, counts] of Object.entries(collectionSummary)) {
            console.log(`${collection}: ${counts.created} created, ${counts.exists} existing`);
        }
        
        if (this.errors.length === 0) {
            console.log('\n✅ All database indexes set up successfully!');
        } else {
            console.log('\n❌ Some indexes failed to be created. Check errors above.');
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    async function runSetup() {
        try {
            // Connect to database
            console.log('Connecting to database...');
            await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Database connected successfully');

            // Create setup instance
            const setup = new DatabaseIndexSetup();

            // Run setup
            await setup.setup();

            process.exit(setup.errors.length === 0 ? 0 : 1);
            
        } catch (error) {
            console.error('Index setup failed:', error.message);
            process.exit(1);
            
        } finally {
            // Close database connection
            await mongoose.connection.close();
            console.log('Database connection closed');
        }
    }

    runSetup();
}

module.exports = DatabaseIndexSetup;