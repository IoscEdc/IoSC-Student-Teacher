const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const SClass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
const ValidationService = require('./ValidationService');
const SummaryService = require('./SummaryService');

class BulkManagementService {
    /**
     * Assign students to classes based on university ID patterns
     * @param {Object} assignmentData - Assignment configuration
     * @param {string} assignmentData.pattern - University ID pattern (e.g., "CSE2021*", "ECE2022A*")
     * @param {string} assignmentData.targetClassId - Target class ID
     * @param {Array} assignmentData.subjectIds - Array of subject IDs to enroll students in
     * @param {string} assignmentData.schoolId - School ID
     * @param {string} assignmentData.performedBy - Admin user ID performing the operation
     * @param {Object} auditInfo - Audit information
     * @returns {Promise<Object>} Assignment results with success/failure details
     */
    async assignStudentsByPattern(assignmentData, auditInfo = {}) {
        const { pattern, targetClassId, subjectIds = [], schoolId, performedBy } = assignmentData;
        
        try {
            // Validate target class exists
            const targetClass = await SClass.findById(targetClassId);
            if (!targetClass) {
                throw new Error('Target class not found');
            }

            // Validate subjects exist
            if (subjectIds.length > 0) {
                const subjects = await Subject.find({ _id: { $in: subjectIds } });
                if (subjects.length !== subjectIds.length) {
                    throw new Error('One or more subjects not found');
                }
            }

            // Find students matching the pattern
            const matchingStudents = await this._findStudentsByPattern(pattern, schoolId);
            
            if (matchingStudents.length === 0) {
                return {
                    successful: [],
                    failed: [],
                    totalProcessed: 0,
                    successCount: 0,
                    failureCount: 0,
                    message: 'No students found matching the specified pattern'
                };
            }

            const results = {
                successful: [],
                failed: [],
                totalProcessed: matchingStudents.length,
                successCount: 0,
                failureCount: 0
            };

            // Process each matching student
            for (const student of matchingStudents) {
                try {
                    // Check if student is already in the target class
                    if (student.sclassName.toString() === targetClassId) {
                        results.failed.push({
                            studentId: student._id,
                            universityId: student.universityId,
                            name: student.name,
                            error: 'Student already assigned to target class',
                            currentClass: student.sclassName
                        });
                        results.failureCount++;
                        continue;
                    }

                    const oldClassId = student.sclassName;
                    
                    // Update student's class assignment
                    student.sclassName = targetClassId;
                    
                    // Update enrolled subjects if provided
                    if (subjectIds.length > 0) {
                        student.enrolledSubjects = subjectIds.map(subjectId => ({
                            subjectId: subjectId,
                            enrolledAt: new Date()
                        }));
                    }

                    await student.save();

                    // Create audit log for the assignment
                    await AttendanceAuditLog.createAuditLog({
                        recordId: null, // No specific attendance record
                        action: 'bulk_assign',
                        oldValues: { 
                            classId: oldClassId,
                            enrolledSubjects: student.enrolledSubjects 
                        },
                        newValues: { 
                            classId: targetClassId,
                            enrolledSubjects: student.enrolledSubjects 
                        },
                        performedBy: performedBy,
                        performedByModel: 'admin',
                        reason: `Bulk assignment using pattern: ${pattern}`,
                        schoolId: schoolId,
                        metadata: {
                            studentId: student._id,
                            universityId: student.universityId,
                            pattern: pattern
                        },
                        ...auditInfo
                    });

                    // Update attendance summaries for new subjects
                    if (subjectIds.length > 0) {
                        for (const subjectId of subjectIds) {
                            await SummaryService.initializeStudentSummary(student._id, subjectId, targetClassId);
                        }
                    }

                    results.successful.push({
                        studentId: student._id,
                        universityId: student.universityId,
                        name: student.name,
                        previousClass: oldClassId,
                        newClass: targetClassId,
                        enrolledSubjects: subjectIds
                    });
                    results.successCount++;

                } catch (studentError) {
                    results.failed.push({
                        studentId: student._id,
                        universityId: student.universityId || 'N/A',
                        name: student.name,
                        error: studentError.message
                    });
                    results.failureCount++;
                }
            }

            return results;

        } catch (error) {
            throw new Error(`Bulk student assignment failed: ${error.message}`);
        }
    }

    /**
     * Transfer students from one class to another with proper data migration
     * @param {Object} transferData - Transfer configuration
     * @param {Array} transferData.studentIds - Array of student IDs to transfer
     * @param {string} transferData.fromClassId - Source class ID
     * @param {string} transferData.toClassId - Target class ID
     * @param {Array} transferData.subjectIds - New subject enrollments (optional)
     * @param {boolean} transferData.migrateAttendance - Whether to migrate attendance data
     * @param {string} transferData.performedBy - Admin user ID
     * @param {Object} auditInfo - Audit information
     * @returns {Promise<Object>} Transfer results
     */
    async transferStudentAssignments(transferData, auditInfo = {}) {
        const { 
            studentIds, 
            fromClassId, 
            toClassId, 
            subjectIds = [], 
            migrateAttendance = false,
            performedBy 
        } = transferData;

        try {
            // Validate classes exist
            const [fromClass, toClass] = await Promise.all([
                SClass.findById(fromClassId),
                SClass.findById(toClassId)
            ]);

            if (!fromClass) throw new Error('Source class not found');
            if (!toClass) throw new Error('Target class not found');

            // Validate students exist and are in the source class
            const students = await Student.find({
                _id: { $in: studentIds },
                sclassName: fromClassId
            });

            if (students.length !== studentIds.length) {
                throw new Error('Some students not found or not in the specified source class');
            }

            const results = {
                successful: [],
                failed: [],
                totalProcessed: students.length,
                successCount: 0,
                failureCount: 0
            };

            // Process each student transfer
            for (const student of students) {
                try {
                    const oldData = {
                        classId: student.sclassName,
                        enrolledSubjects: student.enrolledSubjects || []
                    };

                    // Update student's class
                    student.sclassName = toClassId;

                    // Update enrolled subjects if provided
                    if (subjectIds.length > 0) {
                        student.enrolledSubjects = subjectIds.map(subjectId => ({
                            subjectId: subjectId,
                            enrolledAt: new Date()
                        }));
                    }

                    await student.save();

                    // Migrate attendance data if requested
                    let migratedRecords = 0;
                    if (migrateAttendance) {
                        migratedRecords = await this._migrateStudentAttendance(
                            student._id, 
                            fromClassId, 
                            toClassId,
                            performedBy
                        );
                    }

                    // Initialize summaries for new subjects
                    if (subjectIds.length > 0) {
                        for (const subjectId of subjectIds) {
                            await SummaryService.initializeStudentSummary(student._id, subjectId, toClassId);
                        }
                    }

                    // Create audit log
                    await AttendanceAuditLog.createAuditLog({
                        recordId: null,
                        action: 'student_transfer',
                        oldValues: oldData,
                        newValues: {
                            classId: toClassId,
                            enrolledSubjects: student.enrolledSubjects
                        },
                        performedBy: performedBy,
                        performedByModel: 'admin',
                        reason: `Student transfer from ${fromClass.sclassName} to ${toClass.sclassName}`,
                        schoolId: student.school,
                        metadata: {
                            studentId: student._id,
                            migratedAttendanceRecords: migratedRecords
                        },
                        ...auditInfo
                    });

                    results.successful.push({
                        studentId: student._id,
                        name: student.name,
                        fromClass: fromClassId,
                        toClass: toClassId,
                        migratedRecords: migratedRecords,
                        newSubjects: subjectIds
                    });
                    results.successCount++;

                } catch (studentError) {
                    results.failed.push({
                        studentId: student._id,
                        name: student.name,
                        error: studentError.message
                    });
                    results.failureCount++;
                }
            }

            return results;

        } catch (error) {
            throw new Error(`Student transfer failed: ${error.message}`);
        }
    }

    /**
     * Reassign teacher from one set of subjects to another
     * @param {Object} reassignmentData - Reassignment configuration
     * @param {string} reassignmentData.teacherId - Teacher ID
     * @param {Array} reassignmentData.newAssignments - New subject/class assignments
     * @param {string} reassignmentData.performedBy - Admin user ID
     * @param {Object} auditInfo - Audit information
     * @returns {Promise<Object>} Reassignment results
     */
    async reassignTeacher(reassignmentData, auditInfo = {}) {
        const { teacherId, newAssignments, performedBy } = reassignmentData;

        try {
            const teacher = await Teacher.findById(teacherId);
            if (!teacher) {
                throw new Error('Teacher not found');
            }

            // Validate new assignments
            for (const assignment of newAssignments) {
                const [subject, sclass] = await Promise.all([
                    Subject.findById(assignment.subjectId),
                    SClass.findById(assignment.classId)
                ]);

                if (!subject) throw new Error(`Subject ${assignment.subjectId} not found`);
                if (!sclass) throw new Error(`Class ${assignment.classId} not found`);
            }

            const oldAssignments = {
                teachSubject: teacher.teachSubject,
                teachSclass: teacher.teachSclass,
                assignedSubjects: teacher.assignedSubjects || []
            };

            // Update teacher assignments
            if (newAssignments.length === 1) {
                // Single assignment (backward compatibility)
                teacher.teachSubject = newAssignments[0].subjectId;
                teacher.teachSclass = newAssignments[0].classId;
            }

            // Multiple assignments (new structure)
            teacher.assignedSubjects = newAssignments.map(assignment => ({
                subjectId: assignment.subjectId,
                classId: assignment.classId,
                assignedAt: new Date()
            }));

            await teacher.save();

            // Create audit log
            await AttendanceAuditLog.createAuditLog({
                recordId: null,
                action: 'teacher_reassignment',
                oldValues: oldAssignments,
                newValues: {
                    teachSubject: teacher.teachSubject,
                    teachSclass: teacher.teachSclass,
                    assignedSubjects: teacher.assignedSubjects
                },
                performedBy: performedBy,
                performedByModel: 'admin',
                reason: 'Teacher subject/class reassignment',
                schoolId: teacher.school,
                metadata: {
                    teacherId: teacherId,
                    assignmentCount: newAssignments.length
                },
                ...auditInfo
            });

            return {
                teacherId: teacherId,
                teacherName: teacher.name,
                oldAssignments: oldAssignments,
                newAssignments: teacher.assignedSubjects,
                success: true
            };

        } catch (error) {
            throw new Error(`Teacher reassignment failed: ${error.message}`);
        }
    }

    /**
     * Find students matching a university ID pattern
     * @private
     * @param {string} pattern - Pattern to match (supports wildcards)
     * @param {string} schoolId - School ID to filter by
     * @returns {Promise<Array>} Matching students
     */
    async _findStudentsByPattern(pattern, schoolId) {
        try {
            // Convert pattern to regex
            const regexPattern = this._convertPatternToRegex(pattern);
            
            const query = {
                school: schoolId
            };

            // Add universityId pattern matching if the field exists
            if (pattern && pattern !== '*') {
                query.universityId = { $regex: regexPattern, $options: 'i' };
            }

            const students = await Student.find(query)
                .populate('sclassName', 'sclassName')
                .sort({ universityId: 1, rollNum: 1 });

            return students;

        } catch (error) {
            throw new Error(`Pattern matching failed: ${error.message}`);
        }
    }

    /**
     * Convert wildcard pattern to regex
     * @private
     * @param {string} pattern - Wildcard pattern
     * @returns {string} Regex pattern
     */
    _convertPatternToRegex(pattern) {
        // Escape special regex characters except *
        let regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        
        // Convert * to regex equivalent
        regexPattern = regexPattern.replace(/\*/g, '.*');
        
        // Anchor the pattern to match the entire string
        return `^${regexPattern}$`;
    }

    /**
     * Migrate attendance records when transferring students
     * @private
     * @param {string} studentId - Student ID
     * @param {string} fromClassId - Source class ID
     * @param {string} toClassId - Target class ID
     * @param {string} performedBy - Admin user ID
     * @returns {Promise<number>} Number of migrated records
     */
    async _migrateStudentAttendance(studentId, fromClassId, toClassId, performedBy) {
        try {
            // Find all attendance records for the student in the old class
            const attendanceRecords = await AttendanceRecord.find({
                studentId: studentId,
                classId: fromClassId
            });

            let migratedCount = 0;

            for (const record of attendanceRecords) {
                const oldValues = record.toObject();
                
                // Update class ID
                record.classId = toClassId;
                record.lastModifiedBy = performedBy;
                record.lastModifiedAt = new Date();
                
                await record.save();

                // Create audit log for the migration
                await AttendanceAuditLog.createAuditLog({
                    recordId: record._id,
                    action: 'migrate_attendance',
                    oldValues: oldValues,
                    newValues: record.toObject(),
                    performedBy: performedBy,
                    performedByModel: 'admin',
                    reason: 'Attendance record migration due to student transfer',
                    schoolId: record.schoolId
                });

                migratedCount++;
            }

            // Update attendance summaries for the new class
            const summaries = await AttendanceSummary.find({
                studentId: studentId,
                classId: fromClassId
            });

            for (const summary of summaries) {
                summary.classId = toClassId;
                await summary.save();
            }

            return migratedCount;

        } catch (error) {
            throw new Error(`Attendance migration failed: ${error.message}`);
        }
    }

    /**
     * Get bulk operation statistics
     * @param {string} schoolId - School ID
     * @param {Date} startDate - Start date for statistics
     * @param {Date} endDate - End date for statistics
     * @returns {Promise<Object>} Bulk operation statistics
     */
    async getBulkOperationStats(schoolId, startDate, endDate) {
        try {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = startDate;
            if (endDate) dateFilter.$lte = endDate;

            const pipeline = [
                {
                    $match: {
                        schoolId: mongoose.Types.ObjectId.isValid(schoolId) ? new mongoose.Types.ObjectId(schoolId) : schoolId,
                        action: { $in: ['bulk_assign', 'student_transfer', 'teacher_reassignment'] },
                        ...(Object.keys(dateFilter).length > 0 && { performedAt: dateFilter })
                    }
                },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 },
                        lastPerformed: { $max: '$performedAt' }
                    }
                }
            ];

            const stats = await AttendanceAuditLog.aggregate(pipeline);
            
            const result = {
                bulkAssignments: 0,
                studentTransfers: 0,
                teacherReassignments: 0,
                totalOperations: 0,
                lastActivity: null
            };

            stats.forEach(stat => {
                switch (stat._id) {
                    case 'bulk_assign':
                        result.bulkAssignments = stat.count;
                        break;
                    case 'student_transfer':
                        result.studentTransfers = stat.count;
                        break;
                    case 'teacher_reassignment':
                        result.teacherReassignments = stat.count;
                        break;
                }
                result.totalOperations += stat.count;
                
                if (!result.lastActivity || stat.lastPerformed > result.lastActivity) {
                    result.lastActivity = stat.lastPerformed;
                }
            });

            return result;

        } catch (error) {
            throw new Error(`Failed to get bulk operation stats: ${error.message}`);
        }
    }
}

module.exports = new BulkManagementService();