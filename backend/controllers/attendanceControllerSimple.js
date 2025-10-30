const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceSummary = require('../models/attendanceSummarySchema');
const Student = require('../models/studentSchema');

/**
 * Simple student attendance summary - bypasses complex logic
 */
const getStudentSummarySimple = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        console.log(`📊 Simple: Fetching attendance for student: ${studentId}`);

        // Validate studentId
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        console.log(`👤 Simple: Student found: ${student.name}`);

        // Get attendance records directly from database
        const records = await AttendanceRecord.find({ studentId: studentId })
            .populate('subjectId', 'subName subCode')
            .populate('classId', 'sclassName')
            .sort({ date: -1 })
            .lean();

        console.log(`📋 Simple: Found ${records.length} attendance records`);

        // Group records by subject and calculate summaries
        const subjectSummaries = {};
        
        records.forEach(record => {
            const subjectId = record.subjectId._id.toString();
            const subjectName = record.subjectId.subName;
            
            if (!subjectSummaries[subjectId]) {
                subjectSummaries[subjectId] = {
                    subjectId: {
                        _id: record.subjectId._id,
                        subName: subjectName,
                        subCode: record.subjectId.subCode
                    },
                    totalSessions: 0,
                    presentCount: 0,
                    absentCount: 0,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage: 0,
                    records: []
                };
            }
            
            // Count attendance
            subjectSummaries[subjectId].totalSessions++;
            if (record.status === 'present') {
                subjectSummaries[subjectId].presentCount++;
            } else if (record.status === 'absent') {
                subjectSummaries[subjectId].absentCount++;
            } else if (record.status === 'late') {
                subjectSummaries[subjectId].lateCount++;
            } else if (record.status === 'excused') {
                subjectSummaries[subjectId].excusedCount++;
            }
            
            // Add record details
            subjectSummaries[subjectId].records.push({
                date: record.date,
                session: record.session,
                status: record.status,
                markedBy: record.markedBy,
                markedAt: record.markedAt || record.createdAt
            });
        });

        // Calculate percentages
        const summaryArray = Object.values(subjectSummaries).map(summary => {
            if (summary.totalSessions > 0) {
                summary.attendancePercentage = (summary.presentCount / summary.totalSessions) * 100;
            }
            return summary;
        });

        console.log(`📈 Simple: Created ${summaryArray.length} subject summaries`);
        summaryArray.forEach(summary => {
            console.log(`   ${summary.subjectId.subName}: ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%) with ${summary.records.length} records`);
        });

        res.status(200).json({
            success: true,
            data: summaryArray,
            message: 'Student attendance summary retrieved successfully (simple version)'
        });

    } catch (error) {
        console.error('❌ Simple: Error in getStudentSummarySimple:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance data',
            error: error.message
        });
    }
};

module.exports = {
    getStudentSummarySimple
};