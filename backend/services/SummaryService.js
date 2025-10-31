const AttendanceSummary = require('../models/attendanceSummarySchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const mongoose = require('mongoose');

class SummaryService {
    /**
     * Initialize attendance summary for a new student-subject enrollment
     * @param {string} studentId - Student ID
     * @param {string} subjectId - Subject ID
     * @param {string} classId - Class ID
     * @returns {Promise<Object>} Initialized attendance summary
     */
    async initializeStudentSummary(studentId, subjectId, classId) {
        try {
            // Check if summary already exists
            const existingSummary = await AttendanceSummary.findOne({
                studentId,
                subjectId,
                classId
            });

            if (existingSummary) {
                return existingSummary;
            }

            // Create new summary with zero counts
            const newSummary = new AttendanceSummary({
                studentId,
                subjectId,
                classId,
                totalSessions: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 0,
                schoolId: await this._getSchoolIdFromStudent(studentId)
            });

            return await newSummary.save();
        } catch (error) {
            throw new Error(`Failed to initialize student summary: ${error.message}`);
        }
    }

    /**
     * Update attendance summary for a specific student and subject
     * @param {string} studentId - Student ID
     * @param {string} subjectId - Subject ID
     * @param {string} classId - Class ID
     * @returns {Promise<Object>} Updated attendance summary
     */
    async updateStudentSummary(studentId, subjectId, classId) {
        try {
            // Use the static method from the schema to recalculate from records
            const updatedSummary = await AttendanceSummary.recalculateFromRecords(
                studentId, 
                subjectId, 
                classId
            );

            if (!updatedSummary) {
                // If no attendance records exist, create a summary with zero counts
                const newSummary = new AttendanceSummary({
                    studentId,
                    subjectId,
                    classId,
                    totalSessions: 0,
                    presentCount: 0,
                    absentCount: 0,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage: 0,
                    schoolId: await this._getSchoolIdFromStudent(studentId)
                });

                return await newSummary.save();
            }

            return updatedSummary;
        } catch (error) {
            throw new Error(`Failed to update student summary: ${error.message}`);
        }
    }

    /**
     * Update attendance summaries for all students in a class for a specific subject
     * @param {string} classId - Class ID
     * @param {string} subjectId - Subject ID
     * @returns {Promise<Array>} Array of updated summaries
     */
    async bulkUpdateSummaries(classId, subjectId) {
        try {
            // Get all unique students who have attendance records for this class and subject
            const studentsWithAttendance = await AttendanceRecord.distinct('studentId', {
                classId: new mongoose.Types.ObjectId(classId),
                subjectId: new mongoose.Types.ObjectId(subjectId)
            });

            const updatedSummaries = [];

            for (const studentId of studentsWithAttendance) {
                try {
                    const summary = await this.updateStudentSummary(studentId, subjectId, classId);
                    updatedSummaries.push(summary);
                } catch (error) {
                    console.error(`Failed to update summary for student ${studentId}:`, error.message);
                    // Continue with other students even if one fails
                }
            }

            return updatedSummaries;
        } catch (error) {
            throw new Error(`Failed to bulk update summaries: ${error.message}`);
        }
    }

    /**
     * Calculate attendance percentage based on different criteria
     * @param {Object} summary - Attendance summary object
     * @param {string} calculationMethod - Method for calculation ('standard', 'strict', 'lenient')
     * @returns {number} Calculated attendance percentage
     */
    calculateAttendancePercentage(summary, calculationMethod = 'standard') {
        const { presentCount, absentCount, lateCount, excusedCount } = summary;
        const totalSessions = presentCount + absentCount + lateCount + excusedCount;

        if (totalSessions === 0) return 0;

        let attendedSessions;

        switch (calculationMethod) {
            case 'strict':
                // Only present counts as attended
                attendedSessions = presentCount;
                break;
            case 'lenient':
                // Present, late, and excused all count as attended
                attendedSessions = presentCount + lateCount + excusedCount;
                break;
            case 'standard':
            default:
                // Present and excused count as attended, late counts as half
                attendedSessions = presentCount + excusedCount + (lateCount * 0.5);
                break;
        }

        return Math.round((attendedSessions / totalSessions) * 100 * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get attendance summary for a student across all subjects
     * @param {string} studentId - Student ID
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Array of attendance summaries
     */
    async getStudentAttendanceSummary(studentId, filters = {}) {
        try {
            // Validate studentId
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                throw new Error('Invalid student ID format');
            }

            const query = { studentId: new mongoose.Types.ObjectId(studentId) };

            if (filters.subjectId) {
                if (!mongoose.Types.ObjectId.isValid(filters.subjectId)) {
                    throw new Error('Invalid subject ID format');
                }
                query.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
            }

            if (filters.classId) {
                if (!mongoose.Types.ObjectId.isValid(filters.classId)) {
                    throw new Error('Invalid class ID format');
                }
                query.classId = new mongoose.Types.ObjectId(filters.classId);
            }

            const summaries = await AttendanceSummary.find(query)
                .populate('subjectId', 'subName subCode teacher')
                .populate({
                    path: 'subjectId',
                    populate: {
                        path: 'teacher',
                        select: 'name teachSubject'
                    }
                })
                .populate('classId', 'sclassName')
                .sort({ 'subjectId.subName': 1 })
                .lean(); // Use lean() for better performance

            // Return empty array if no summaries found
            if (!summaries || summaries.length === 0) {
                return [];
            }

            return summaries.map(summary => {
                // Handle cases where populate might fail
                const subjectName = summary.subjectId?.subName || 'Unknown Subject';
                const className = summary.classId?.sclassName || 'Unknown Class';

                return {
                    ...summary,
                    subjectName,
                    className,
                    calculatedPercentages: {
                        standard: this.calculateAttendancePercentage(summary, 'standard'),
                        strict: this.calculateAttendancePercentage(summary, 'strict'),
                        lenient: this.calculateAttendancePercentage(summary, 'lenient')
                    }
                };
            });
        } catch (error) {
            console.error('Error in getStudentAttendanceSummary:', error);
            throw new Error(`Failed to get student attendance summary: ${error.message}`);
        }
    }

    /**
     * Get attendance summary for a class and subject
     * @param {string} classId - Class ID
     * @param {string} subjectId - Subject ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Class attendance summary with statistics
     */
    async getClassAttendanceSummary(classId, subjectId, options = {}) {
        try {
            const { includeStudentDetails = true, sortBy = 'attendancePercentage', sortOrder = 'desc' } = options;

            const query = {
                classId: new mongoose.Types.ObjectId(classId),
                subjectId: new mongoose.Types.ObjectId(subjectId)
            };

            let summariesQuery = AttendanceSummary.find(query);

            if (includeStudentDetails) {
                summariesQuery = summariesQuery.populate('studentId', 'name rollNum');
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
            summariesQuery = summariesQuery.sort(sortOptions);

            const summaries = await summariesQuery;

            // Calculate class statistics
            const classStats = await this._calculateClassStatistics(summaries);

            return {
                classId,
                subjectId,
                studentSummaries: summaries,
                classStatistics: classStats,
                totalStudents: summaries.length
            };
        } catch (error) {
            throw new Error(`Failed to get class attendance summary: ${error.message}`);
        }
    }

    /**
     * Get attendance trends for a student over time
     * @param {string} studentId - Student ID
     * @param {string} subjectId - Subject ID
     * @param {Object} dateRange - Date range for trend analysis
     * @returns {Promise<Object>} Attendance trends data
     */
    async getAttendanceTrends(studentId, subjectId, dateRange = {}) {
        try {
            const { startDate, endDate } = dateRange;
            const matchQuery = {
                studentId: new mongoose.Types.ObjectId(studentId),
                subjectId: new mongoose.Types.ObjectId(subjectId)
            };

            if (startDate || endDate) {
                matchQuery.date = {};
                if (startDate) matchQuery.date.$gte = new Date(startDate);
                if (endDate) matchQuery.date.$lte = new Date(endDate);
            }

            // Aggregate attendance records by week/month for trend analysis
            const weeklyTrends = await AttendanceRecord.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            week: { $week: '$date' }
                        },
                        totalSessions: { $sum: 1 },
                        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                        excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
                    }
                },
                {
                    $addFields: {
                        attendancePercentage: {
                            $multiply: [
                                { $divide: [
                                    { $add: ['$presentCount', '$excusedCount', { $multiply: ['$lateCount', 0.5] }] },
                                    '$totalSessions'
                                ]},
                                100
                            ]
                        }
                    }
                },
                { $sort: { '_id.year': 1, '_id.week': 1 } }
            ]);

            return {
                studentId,
                subjectId,
                weeklyTrends,
                dateRange: { startDate, endDate }
            };
        } catch (error) {
            throw new Error(`Failed to get attendance trends: ${error.message}`);
        }
    }

    /**
     * Get school-wide attendance analytics
     * @param {string} schoolId - School ID
     * @param {Object} options - Analytics options
     * @returns {Promise<Object>} School-wide attendance analytics
     */
    async getSchoolAnalytics(schoolId, options = {}) {
        try {
            const { startDate, endDate, includeClassBreakdown = true, includeSubjectBreakdown = true } = options;

            const matchQuery = { schoolId: new mongoose.Types.ObjectId(schoolId) };

            // Add date filtering if provided
            if (startDate || endDate) {
                // We need to join with AttendanceRecord to filter by date
                const dateFilter = {};
                if (startDate) dateFilter.$gte = new Date(startDate);
                if (endDate) dateFilter.$lte = new Date(endDate);

                // Get attendance records within date range
                const recordsInRange = await AttendanceRecord.find({
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    date: dateFilter
                }).distinct('_id');

                if (recordsInRange.length === 0) {
                    return {
                        schoolId,
                        dateRange: { startDate, endDate },
                        overallStats: this._getEmptyStats(),
                        classBreakdown: [],
                        subjectBreakdown: []
                    };
                }
            }

            // Get overall school statistics
            const overallStats = await AttendanceSummary.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        totalSessions: { $sum: '$totalSessions' },
                        totalPresent: { $sum: '$presentCount' },
                        totalAbsent: { $sum: '$absentCount' },
                        totalLate: { $sum: '$lateCount' },
                        totalExcused: { $sum: '$excusedCount' },
                        averageAttendance: { $avg: '$attendancePercentage' },
                        highestAttendance: { $max: '$attendancePercentage' },
                        lowestAttendance: { $min: '$attendancePercentage' }
                    }
                }
            ]);

            const schoolStats = overallStats[0] || this._getEmptyStats();

            // Calculate additional metrics
            if (schoolStats.totalSessions > 0) {
                schoolStats.overallAttendanceRate = Math.round(
                    ((schoolStats.totalPresent + schoolStats.totalExcused + (schoolStats.totalLate * 0.5)) / 
                     schoolStats.totalSessions) * 100 * 100
                ) / 100;
            } else {
                schoolStats.overallAttendanceRate = 0;
            }

            const result = {
                schoolId,
                dateRange: { startDate, endDate },
                overallStats: schoolStats
            };

            // Include class breakdown if requested
            if (includeClassBreakdown) {
                result.classBreakdown = await AttendanceSummary.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: '$classId',
                            totalStudents: { $sum: 1 },
                            totalSessions: { $sum: '$totalSessions' },
                            totalPresent: { $sum: '$presentCount' },
                            totalAbsent: { $sum: '$absentCount' },
                            totalLate: { $sum: '$lateCount' },
                            totalExcused: { $sum: '$excusedCount' },
                            averageAttendance: { $avg: '$attendancePercentage' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'sclasses',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'classInfo'
                        }
                    },
                    {
                        $addFields: {
                            className: { $arrayElemAt: ['$classInfo.sclassName', 0] },
                            classAttendanceRate: {
                                $cond: [
                                    { $gt: ['$totalSessions', 0] },
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    { $add: ['$totalPresent', '$totalExcused', { $multiply: ['$totalLate', 0.5] }] },
                                                    '$totalSessions'
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            }
                        }
                    },
                    { $sort: { averageAttendance: -1 } }
                ]);
            }

            // Include subject breakdown if requested
            if (includeSubjectBreakdown) {
                result.subjectBreakdown = await AttendanceSummary.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: '$subjectId',
                            totalStudents: { $sum: 1 },
                            totalSessions: { $sum: '$totalSessions' },
                            totalPresent: { $sum: '$presentCount' },
                            totalAbsent: { $sum: '$absentCount' },
                            totalLate: { $sum: '$lateCount' },
                            totalExcused: { $sum: '$excusedCount' },
                            averageAttendance: { $avg: '$attendancePercentage' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'subjects',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'subjectInfo'
                        }
                    },
                    {
                        $addFields: {
                            subjectName: { $arrayElemAt: ['$subjectInfo.subName', 0] },
                            subjectCode: { $arrayElemAt: ['$subjectInfo.subCode', 0] },
                            subjectAttendanceRate: {
                                $cond: [
                                    { $gt: ['$totalSessions', 0] },
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    { $add: ['$totalPresent', '$totalExcused', { $multiply: ['$totalLate', 0.5] }] },
                                                    '$totalSessions'
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            }
                        }
                    },
                    { $sort: { averageAttendance: -1 } }
                ]);
            }

            return result;
        } catch (error) {
            throw new Error(`Failed to get school analytics: ${error.message}`);
        }
    }

    /**
     * Get low attendance alerts for students below threshold
     * @param {string} classId - Class ID
     * @param {string} subjectId - Subject ID (optional)
     * @param {number} threshold - Attendance percentage threshold (default: 75)
     * @returns {Promise<Array>} Array of students with low attendance
     */
    async getLowAttendanceAlerts(classId, subjectId = null, threshold = 75) {
        try {
            const query = { classId: new mongoose.Types.ObjectId(classId) };
            
            if (subjectId) {
                query.subjectId = new mongoose.Types.ObjectId(subjectId);
            }

            query.attendancePercentage = { $lt: threshold };
            query.totalSessions = { $gte: 5 }; // Only consider students with at least 5 sessions

            const lowAttendanceStudents = await AttendanceSummary.find(query)
                .populate('studentId', 'name rollNum')
                .populate('subjectId', 'subName subCode')
                .sort({ attendancePercentage: 1 });

            return lowAttendanceStudents.map(summary => ({
                student: summary.studentId,
                subject: summary.subjectId,
                attendancePercentage: summary.attendancePercentage,
                totalSessions: summary.totalSessions,
                presentCount: summary.presentCount,
                absentCount: summary.absentCount,
                alertLevel: this._getAlertLevel(summary.attendancePercentage, threshold)
            }));
        } catch (error) {
            throw new Error(`Failed to get low attendance alerts: ${error.message}`);
        }
    }

    /**
     * Recalculate all summaries for data consistency (maintenance function)
     * @param {string} schoolId - School ID to limit scope
     * @returns {Promise<Object>} Recalculation results
     */
    async recalculateAllSummaries(schoolId) {
        try {
            const results = {
                processed: 0,
                updated: 0,
                errors: 0,
                errorDetails: []
            };

            // Get all unique student-subject-class combinations
            const combinations = await AttendanceRecord.aggregate([
                { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
                {
                    $group: {
                        _id: {
                            studentId: '$studentId',
                            subjectId: '$subjectId',
                            classId: '$classId'
                        }
                    }
                }
            ]);

            for (const combination of combinations) {
                try {
                    results.processed++;
                    const { studentId, subjectId, classId } = combination._id;
                    
                    await this.updateStudentSummary(studentId, subjectId, classId);
                    results.updated++;
                } catch (error) {
                    results.errors++;
                    results.errorDetails.push({
                        combination: combination._id,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to recalculate all summaries: ${error.message}`);
        }
    }

    /**
     * Calculate class statistics from summaries
     * @private
     */
    async _calculateClassStatistics(summaries) {
        if (summaries.length === 0) {
            return {
                averageAttendance: 0,
                highestAttendance: 0,
                lowestAttendance: 0,
                studentsAboveThreshold: 0,
                studentsBelowThreshold: 0,
                threshold: 75
            };
        }

        const attendancePercentages = summaries.map(s => s.attendancePercentage);
        const threshold = 75;

        return {
            averageAttendance: Math.round((attendancePercentages.reduce((a, b) => a + b, 0) / attendancePercentages.length) * 100) / 100,
            highestAttendance: Math.max(...attendancePercentages),
            lowestAttendance: Math.min(...attendancePercentages),
            studentsAboveThreshold: attendancePercentages.filter(p => p >= threshold).length,
            studentsBelowThreshold: attendancePercentages.filter(p => p < threshold).length,
            threshold
        };
    }

    /**
     * Get school ID from student
     * @private
     */
    async _getSchoolIdFromStudent(studentId) {
        const Student = require('../models/studentSchema');
        const student = await Student.findById(studentId).select('school');
        if (!student) {
            throw new Error('Student not found');
        }
        return student.school;
    }

    /**
     * Trigger real-time summary updates after attendance operations
     * This method should be called after any attendance record is created, updated, or deleted
     * @param {Array} attendanceRecords - Array of attendance records that were affected
     * @returns {Promise<Array>} Array of updated summaries
     */
    async triggerSummaryUpdates(attendanceRecords) {
        try {
            const updatedSummaries = [];
            const processedCombinations = new Set();

            for (const record of attendanceRecords) {
                const { studentId, subjectId, classId } = record;
                const combinationKey = `${studentId}-${subjectId}-${classId}`;

                // Avoid duplicate updates for the same student-subject-class combination
                if (!processedCombinations.has(combinationKey)) {
                    try {
                        const updatedSummary = await this.updateStudentSummary(studentId, subjectId, classId);
                        updatedSummaries.push(updatedSummary);
                        processedCombinations.add(combinationKey);
                    } catch (error) {
                        console.error(`Failed to update summary for ${combinationKey}:`, error.message);
                        // Continue with other updates even if one fails
                    }
                }
            }

            return updatedSummaries;
        } catch (error) {
            throw new Error(`Failed to trigger summary updates: ${error.message}`);
        }
    }

    /**
     * Batch update summaries with transaction-like behavior
     * Ensures data consistency during bulk operations
     * @param {Array} updateOperations - Array of update operations
     * @returns {Promise<Object>} Results of batch update
     */
    async batchUpdateSummaries(updateOperations) {
        try {
            const results = {
                successful: [],
                failed: [],
                totalProcessed: updateOperations.length
            };

            // Process all updates
            for (const operation of updateOperations) {
                try {
                    const { studentId, subjectId, classId } = operation;
                    const updatedSummary = await this.updateStudentSummary(studentId, subjectId, classId);
                    results.successful.push({
                        operation,
                        result: updatedSummary
                    });
                } catch (error) {
                    results.failed.push({
                        operation,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to batch update summaries: ${error.message}`);
        }
    }

    /**
     * Get empty statistics structure
     * @private
     */
    _getEmptyStats() {
        return {
            totalStudents: 0,
            totalSessions: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0,
            totalExcused: 0,
            averageAttendance: 0,
            highestAttendance: 0,
            lowestAttendance: 0,
            overallAttendanceRate: 0
        };
    }

    /**
     * Determine alert level based on attendance percentage
     * @private
     */
    _getAlertLevel(percentage, threshold) {
        if (percentage < threshold * 0.6) return 'critical';
        if (percentage < threshold * 0.8) return 'warning';
        return 'attention';
    }
}

module.exports = new SummaryService();