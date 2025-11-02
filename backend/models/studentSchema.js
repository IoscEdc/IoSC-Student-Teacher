const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- SUB-SCHEMAS for better data structure ---

const examResultSchema = new mongoose.Schema({
    subName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject', // Ref to your subject model
        required: true
    },
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    examType: { // e.g., "Midterm", "Final"
        type: String,
        trim: true
    }
});

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    subName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject', // Ref to your subject model
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        required: true,
        default: 'Absent'
    }
});

// --- MAIN STUDENT SCHEMA ---

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, // Added
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'], // Added
        index: true // Added
    },
    school: {
        type: mongoose.Schema.Types.ObjectId, // Changed from String
        ref: 'admin', // Changed from String
        required: true,
        index: true // Added
    },
    sclassName: {
        type: mongoose.Schema.Types.ObjectId, // Changed from String
        ref: 'sclass', // Changed from String
        required: true,
        index: true // Added
    },
    // sbatchName: has been removed
    rollNum: {
        type: String,
        required: true,
        trim: true
        // Removed global 'unique: true' - will be handled by compound index
    },
    password: {
        type: String,
        required: true,
        select: false // Good practice: hides password from default queries
    },
    role: {
        type: String,
        enum: ['Student'],
        default: 'Student'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: { // Added
        type: Boolean,
        default: true,
        index: true
    },
    // Token fields added to match teacherSchema
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    examResult: [examResultSchema], // Changed from Mixed
    attendance: [attendanceSchema], // Changed from Mixed

}, { 
    timestamps: true 
});

// --- INDEXES ---

// Ensures rollNum is unique *within* a specific class
studentSchema.index({ sclassName: 1, rollNum: 1 }, { unique: true });

// --- HOOKS & METHODS (Unchanged) ---

// Hash password before saving
studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
    // Need to re-fetch password since it has 'select: false'
    const student = await this.constructor.findOne({ _id: this._id }).select('+password');
    return await bcrypt.compare(candidatePassword, student.password);
};

module.exports = mongoose.model('Student', studentSchema);