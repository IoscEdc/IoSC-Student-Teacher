const mongoose = require('mongoose');

const attendanceSummarySchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
        index: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
        index: true
    },
    totalSessions: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    presentCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    absentCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    lateCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    excusedCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    attendancePercentage: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true
    }
}, { 
    timestamps: true,
    // Compound indexes for optimal query performance
    indexes: [
        { studentId: 1, subjectId: 1 }, // For student-subject summary queries
        { classId: 1, subjectId: 1 }, // For class-subject summary queries
        { schoolId: 1, attendancePercentage: 1 }, // For school analytics
        { studentId: 1, attendancePercentage: 1 }, // For student performance queries
    ]
});

// Compound unique index to ensure one summary per student-subject combination
attendanceSummarySchema.index(
    { studentId: 1, subjectId: 1, classId: 1 }, 
    { unique: true }
);

// Virtual field to calculate attendance percentage
attendanceSummarySchema.virtual('calculatedPercentage').get(function() {
    if (this.totalSessions === 0) return 0;
    return Math.round((this.presentCount / this.totalSessions) * 100 * 100) / 100; // Round to 2 decimal places
});

// Pre-save middleware to automatically calculate attendance percentage
attendanceSummarySchema.pre('save', function(next) {
    // Update total sessions count
    this.totalSessions = this.presentCount + this.absentCount + this.lateCount + this.excusedCount;
    
    // Calculate attendance percentage (present + late + excused considered as attended)
    if (this.totalSessions > 0) {
        const attendedSessions = this.presentCount + this.lateCount + this.excusedCount;
        this.attendancePercentage = Math.round((attendedSessions / this.totalSessions) * 100 * 100) / 100;
    } else {
        this.attendancePercentage = 0;
    }
    
    this.lastUpdated = new Date();
    next();
});

// Static method to recalculate summary from attendance records
attendanceSummarySchema.statics.recalculateFromRecords = async function(studentId, subjectId, classId) {
    const AttendanceRecord = mongoose.model('AttendanceRecord');
    
    const pipeline = [
        {
            $match: {
                studentId: new mongoose.Types.ObjectId(studentId),
                subjectId: new mongoose.Types.ObjectId(subjectId),
                classId: new mongoose.Types.ObjectId(classId)
            }
        },
        {
            $group: {
                _id: null,
                presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
            }
        }
    ];
    
    const result = await AttendanceRecord.aggregate(pipeline);
    
    if (result.length > 0) {
        const counts = result[0];
        return await this.findOneAndUpdate(
            { studentId, subjectId, classId },
            {
                presentCount: counts.presentCount,
                absentCount: counts.absentCount,
                lateCount: counts.lateCount,
                excusedCount: counts.excusedCount
            },
            { upsert: true, new: true }
        );
    }
    
    return null;
};

module.exports = mongoose.model('AttendanceSummary', attendanceSummarySchema);