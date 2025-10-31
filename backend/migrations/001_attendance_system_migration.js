const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');

/**
 * Migration script for attendance system revamp
 * Converts existing attendance data to new schema format
 * Creates attendance summaries and audit logs
 */

class AttendanceMigration {
    constructor() {
        this.migrationLog = [];
        this.errors = [];
        this.stats = {
            studentsProcessed: 0,
            teachersProcessed: 0,
            attendanceRecordsCreated: 0,
            summariesCreated: 0,
            errors: 0
        };
    }

    /**
     * Main migration function
     */
    async migrate() {
        console.log('Starting attendance system migration...');
        this.log('Migration started at: ' + new Date().toISOString());

        try {
            // Step 1: Validate database connection
            await this.validateConnection();

            // Step 2: Create backup of existing data
            await this.createBackup();

            // Step 3: Migrate student data
            await this.migrateStudentData();

            // Step 4: Migrate teacher data
            await this.migrateTeacherData();

            // Step 5: Create initial attendance summaries
            await this.createInitialSummaries();

            // Step 6: Validate migration results
            await this.validateMigration();

            // Step 7: Create migration audit log
            await this.createMigrationAuditLog();

            console.log('Migration completed successfully!');
            this.printStats();

        } catch (error) {
            console.error('Migration failed:', error);
            this.errors.push(`Migration failed: ${error.message}`);
            await this.rollback();
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
     * Create backup of existing data
     */
    async createBackup() {
        this.log('Creating backup of existing data...');
        
        try {
            // Create backup collections
            const students = await Student.find({}).lean();
            const teachers = await Teacher.find({}).lean();

            // Store backup in separate collections
            if (students.length > 0) {
                await mongoose.connection.db.collection('students_backup_' + Date.now()).insertMany(students);
                this.log(`Backed up ${students.length} student records`);
            }

            if (teachers.length > 0) {
                await mongoose.connection.db.collection('teachers_backup_' + Date.now()).insertMany(teachers);
                this.log(`Backed up ${teachers.length} teacher records`);
            }

        } catch (error) {
            throw new Error(`Backup creation failed: ${error.message}`);
        }
    }

    /**
     * Migrate student data - handle any existing attendance arrays
     */
    async migrateStudentData() {
        this.log('Migrating student data...');
        
        const students = await Student.find({});
        
        for (const student of students) {
            try {
                let needsUpdate = false;
                const updateData = {};

                // Check if student has old attendance array and migrate it
                if (student.attendance && Array.isArray(student.attendance)) {
                    await this.migrateStudentAttendanceArray(student);
                    // Remove old attendance array
                    updateData.$unset = { attendance: 1 };
                    needsUpdate = true;
                }

                // Ensure enrolledSubjects field exists
                if (!student.enrolledSubjects || !Array.isArray(student.enrolledSubjects)) {
                    // Auto-enroll student in class subjects if not already enrolled
                    const classSubjects = await this.getClassSubjects(student.sclassName);
                    updateData.enrolledSubjects = classSubjects.map(subjectId => ({
                        subjectId,
                        enrolledAt: new Date()
                    }));
                    needsUpdate = true;
                }

                // Ensure universityId exists (required for pattern matching)
                if (!student.universityId) {
                    // Generate universityId from rollNum if not exists
                    updateData.universityId = `STU${student.rollNum.toString().padStart(6, '0')}`;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await Student.findByIdAndUpdate(student._id, updateData);
                    this.log(`Updated student: ${student.name} (${student._id})`);
                }

                this.stats.studentsProcessed++;

            } catch (error) {
                this.errors.push(`Error migrating student ${student._id}: ${error.message}`);
                this.stats.errors++;
            }
        }

        this.log(`Processed ${this.stats.studentsProcessed} students`);
    }

    /**
     * Migrate individual student's attendance array to AttendanceRecord collection
     */
    async migrateStudentAttendanceArray(student) {
        if (!student.attendance || !Array.isArray(student.attendance)) {
            return;
        }

        for (const attendanceEntry of student.attendance) {
            try {
                // Extract data from old attendance format
                const {
                    subName: subjectId,
                    present,
                    absent,
                    date
                } = attendanceEntry;

                if (!subjectId || (!present && !absent)) {
                    continue; // Skip invalid entries
                }

                // Create attendance records for each session
                const sessions = ['Lecture 1', 'Lecture 2'];
                
                for (let i = 0; i < sessions.length; i++) {
                    const session = sessions[i];
                    let status = 'absent';

                    // Determine status based on old format
                    if (present && present > i) {
                        status = 'present';
                    } else if (absent && absent > i) {
                        status = 'absent';
                    }

                    // Find teacher for this subject and class
                    const teacher = await Teacher.findOne({
                        $or: [
                            { teachSubject: subjectId, teachSclass: student.sclassName },
                            { 'assignedSubjects.subjectId': subjectId, 'assignedSubjects.classId': student.sclassName }
                        ]
                    });

                    if (!teacher) {
                        this.log(`Warning: No teacher found for subject ${subjectId} in class ${student.sclassName}`);
                        continue;
                    }

                    // Create attendance record
                    const attendanceRecord = new AttendanceRecord({
                        classId: student.sclassName,
                        subjectId: subjectId,
                        teacherId: teacher._id,
                        studentId: student._id,
                        date: date || new Date(),
                        session: session,
                        status: status,
                        markedBy: teacher._id,
                        markedAt: date || new Date(),
                        schoolId: student.school
                    });

                    await attendanceRecord.save();
                    this.stats.attendanceRecordsCreated++;
                }

            } catch (error) {
                this.errors.push(`Error migrating attendance entry for student ${student._id}: ${error.message}`);
            }
        }
    }

    /**
     * Migrate teacher data - ensure assignedSubjects field exists
     */
    async migrateTeacherData() {
        this.log('Migrating teacher data...');
        
        const teachers = await Teacher.find({});
        
        for (const teacher of teachers) {
            try {
                let needsUpdate = false;
                const updateData = {};

                // Remove old attendance array if exists
                if (teacher.attendance) {
                    updateData.$unset = { attendance: 1 };
                    needsUpdate = true;
                }

                // Ensure assignedSubjects field exists and is populated
                if (!teacher.assignedSubjects || !Array.isArray(teacher.assignedSubjects)) {
                    const assignedSubjects = [];
                    
                    // Migrate from old teachSubject and teachSclass fields
                    if (teacher.teachSubject && teacher.teachSclass) {
                        assignedSubjects.push({
                            subjectId: teacher.teachSubject,
                            classId: teacher.teachSclass,
                            assignedAt: new Date()
                        });
                    }
                    
                    updateData.assignedSubjects = assignedSubjects;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await Teacher.findByIdAndUpdate(teacher._id, updateData);
                    this.log(`Updated teacher: ${teacher.name} (${teacher._id})`);
                }

                this.stats.teachersProcessed++;

            } catch (error) {
                this.errors.push(`Error migrating teacher ${teacher._id}: ${error.message}`);
                this.stats.errors++;
            }
        }

        this.log(`Processed ${this.stats.teachersProcessed} teachers`);
    }

    /**
     * Create initial attendance summaries for all student-subject combinations
     */
    async createInitialSummaries() {
        this.log('Creating initial attendance summaries...');
        
        const students = await Student.find({}).populate('enrolledSubjects.subjectId');
        
        for (const student of students) {
            if (!student.enrolledSubjects || !Array.isArray(student.enrolledSubjects)) {
                continue;
            }

            for (const enrollment of student.enrolledSubjects) {
                try {
                    // Check if summary already exists
                    const existingSummary = await AttendanceSummary.findOne({
                        studentId: student._id,
                        subjectId: enrollment.subjectId,
                        classId: student.sclassName
                    });

                    if (!existingSummary) {
                        // Create new summary by calculating from attendance records
                        await AttendanceSummary.recalculateFromRecords(
                            student._id,
                            enrollment.subjectId,
                            student.sclassName
                        );
                        this.stats.summariesCreated++;
                    }

                } catch (error) {
                    this.errors.push(`Error creating summary for student ${student._id}, subject ${enrollment.subjectId}: ${error.message}`);
                }
            }
        }

        this.log(`Created ${this.stats.summariesCreated} attendance summaries`);
    }

    /**
     * Validate migration results
     */
    async validateMigration() {
        this.log('Validating migration results...');
        
        // Check data integrity
        const studentCount = await Student.countDocuments({});
        const teacherCount = await Teacher.countDocuments({});
        const attendanceRecordCount = await AttendanceRecord.countDocuments({});
        const summaryCount = await AttendanceSummary.countDocuments({});

        this.log(`Validation results:`);
        this.log(`- Students: ${studentCount}`);
        this.log(`- Teachers: ${teacherCount}`);
        this.log(`- Attendance Records: ${attendanceRecordCount}`);
        this.log(`- Attendance Summaries: ${summaryCount}`);

        // Validate that all students have enrolledSubjects
        const studentsWithoutEnrollment = await Student.countDocuments({
            $or: [
                { enrolledSubjects: { $exists: false } },
                { enrolledSubjects: { $size: 0 } }
            ]
        });

        if (studentsWithoutEnrollment > 0) {
            this.log(`Warning: ${studentsWithoutEnrollment} students without subject enrollment`);
        }

        // Validate that all teachers have assignedSubjects
        const teachersWithoutAssignment = await Teacher.countDocuments({
            $or: [
                { assignedSubjects: { $exists: false } },
                { assignedSubjects: { $size: 0 } }
            ]
        });

        if (teachersWithoutAssignment > 0) {
            this.log(`Warning: ${teachersWithoutAssignment} teachers without subject assignment`);
        }
    }

    /**
     * Create migration audit log
     */
    async createMigrationAuditLog() {
        try {
            // Create a special audit log entry for the migration
            const migrationLog = new AttendanceAuditLog({
                recordId: new mongoose.Types.ObjectId(), // Dummy record ID for migration
                action: 'create',
                oldValues: null,
                newValues: {
                    migrationType: 'attendance_system_migration',
                    stats: this.stats,
                    errors: this.errors,
                    migrationLog: this.migrationLog
                },
                performedBy: new mongoose.Types.ObjectId(), // System migration
                performedByModel: 'admin',
                reason: 'Attendance system migration from old schema to new schema',
                schoolId: new mongoose.Types.ObjectId() // System-wide migration
            });

            await migrationLog.save();
            this.log('Migration audit log created');

        } catch (error) {
            this.log(`Warning: Could not create migration audit log: ${error.message}`);
        }
    }

    /**
     * Get subjects for a class
     */
    async getClassSubjects(classId) {
        try {
            const Subject = mongoose.model('subject');
            const subjects = await Subject.find({ sclassName: classId });
            return subjects.map(subject => subject._id);
        } catch (error) {
            this.log(`Error getting subjects for class ${classId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Rollback migration in case of failure
     */
    async rollback() {
        this.log('Starting rollback procedure...');
        
        try {
            // Remove created attendance records
            await AttendanceRecord.deleteMany({});
            
            // Remove created attendance summaries
            await AttendanceSummary.deleteMany({});
            
            // Remove migration audit logs
            await AttendanceAuditLog.deleteMany({
                'newValues.migrationType': 'attendance_system_migration'
            });

            this.log('Rollback completed - new attendance data removed');
            
        } catch (error) {
            this.log(`Rollback failed: ${error.message}`);
            throw new Error(`Migration failed and rollback also failed: ${error.message}`);
        }
    }

    /**
     * Log migration events
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.migrationLog.push(logEntry);
        console.log(logEntry);
    }

    /**
     * Print migration statistics
     */
    printStats() {
        console.log('\n=== Migration Statistics ===');
        console.log(`Students processed: ${this.stats.studentsProcessed}`);
        console.log(`Teachers processed: ${this.stats.teachersProcessed}`);
        console.log(`Attendance records created: ${this.stats.attendanceRecordsCreated}`);
        console.log(`Summaries created: ${this.stats.summariesCreated}`);
        console.log(`Errors encountered: ${this.stats.errors}`);
        
        if (this.errors.length > 0) {
            console.log('\n=== Errors ===');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
    }
}

module.exports = AttendanceMigration;