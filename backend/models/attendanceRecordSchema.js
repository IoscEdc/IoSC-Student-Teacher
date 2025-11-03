const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
        index: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
        index: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    session: {
        type: String,
        required: true,
        enum: ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lab', 'Tutorial']
    },
    status: {
        type: String,
        required: true,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'absent'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    markedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    lastModifiedAt: {
        type: Date
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
        { classId: 1, subjectId: 1, date: 1 }, // For class-subject-date queries
        { studentId: 1, subjectId: 1, date: 1 }, // For student attendance queries
        { teacherId: 1, date: 1 }, // For teacher's attendance records
        { schoolId: 1, date: 1 }, // For school-wide reports
        { classId: 1, subjectId: 1, date: 1, session: 1 }, // Unique constraint alternative
    ]
});

// Compound unique index to prevent duplicate attendance records
attendanceRecordSchema.index(
    { studentId: 1, classId: 1, subjectId: 1, date: 1, session: 1 }, 
    { unique: true }
);

// Pre-save middleware to update lastModifiedAt when record is updated
attendanceRecordSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.lastModifiedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);