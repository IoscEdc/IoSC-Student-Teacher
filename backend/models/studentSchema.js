const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    rollNum: {
        type: Number,
        required: true,
        min: 1,
        index: true // Index for quick lookups
    },
    universityId: {
        type: String,
        required: true, // Required for pattern matching
        unique: true,
        trim: true,
        maxlength: 50, // Increased to accommodate longer university IDs
        index: true // Index for pattern matching queries
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    sclassName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
        index: true // Index for class-based queries
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true // Index for school-based queries
    },
    role: {
        type: String,
        default: "Student",
        enum: ["Student"] // Restrict to valid roles
    },
    enrolledSubjects: [{
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'subject',
            required: true
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
            required: true
        }
    }],
    examResult: [
        {
            subName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'subject',
                required: true
            },
            marksObtained: {
                type: Number,
                default: 0,
                min: 0
            }
        }
    ],
    // Additional fields for enhanced functionality
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    // Compound indexes for optimal query performance
    indexes: [
        { school: 1, sclassName: 1 }, // For school-class queries
        { school: 1, universityId: 1 }, // For school-student ID queries
        { sclassName: 1, isActive: 1 }, // For active students in class
        { 'enrolledSubjects.subjectId': 1 }, // For subject enrollment queries
    ]
});

// Compound unique index to prevent duplicate roll numbers within same school and class
studentSchema.index(
    { school: 1, sclassName: 1, rollNum: 1 },
    { unique: true }
);

// Text index for name search functionality
studentSchema.index({ name: 'text' });

// Pre-save middleware to validate enrolled subjects
studentSchema.pre('save', function (next) {
    // Ensure at least one subject is enrolled for new students
    if (this.isNew && (!this.enrolledSubjects || this.enrolledSubjects.length === 0)) {
        return next(new Error('Student must be enrolled in at least one subject'));
    }

    // Remove duplicate subject enrollments
    if (this.enrolledSubjects && this.enrolledSubjects.length > 0) {
        const uniqueSubjects = [];
        const seenSubjects = new Set();

        for (const enrollment of this.enrolledSubjects) {
            const subjectId = enrollment.subjectId.toString();
            if (!seenSubjects.has(subjectId)) {
                seenSubjects.add(subjectId);
                uniqueSubjects.push(enrollment);
            }
        }

        this.enrolledSubjects = uniqueSubjects;
    }

    next();
});

// Instance method to check if student is enrolled in a subject
studentSchema.methods.isEnrolledInSubject = function (subjectId) {
    return this.enrolledSubjects.some(enrollment =>
        enrollment.subjectId.toString() === subjectId.toString()
    );
};

// Instance method to enroll in a subject
studentSchema.methods.enrollInSubject = function (subjectId) {
    if (!this.isEnrolledInSubject(subjectId)) {
        this.enrolledSubjects.push({
            subjectId: subjectId,
            enrolledAt: new Date()
        });
    }
};

// Instance method to unenroll from a subject
studentSchema.methods.unenrollFromSubject = function (subjectId) {
    this.enrolledSubjects = this.enrolledSubjects.filter(enrollment =>
        enrollment.subjectId.toString() !== subjectId.toString()
    );
};

// Static method to find students by university ID pattern
studentSchema.statics.findByUniversityIdPattern = function (pattern) {
    return this.find({
        universityId: { $regex: pattern, $options: 'i' },
        isActive: true
    });
};

// Static method to get students enrolled in a subject
studentSchema.statics.findEnrolledInSubject = function (subjectId, classId = null) {
    const query = {
        'enrolledSubjects.subjectId': subjectId,
        isActive: true
    };

    if (classId) {
        query.sclassName = classId;
    }

    return this.find(query);
};

module.exports = mongoose.model("student", studentSchema);