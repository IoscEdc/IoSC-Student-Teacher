const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        index: true // Index for login queries
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        default: "Teacher",
        enum: ["Teacher", "Admin"] // Restrict to valid roles
    },
     assignments: [{
        subject: {
            type: String,
            required: true
        },
        subjectcode: {
            type: String,
            required: true
        },
        className: { // Using 'className' as 'class' is a reserved keyword
            type: String,
            required: true
        }}]
    // Legacy fields - kept for backward compatibility
    // New enhanced assignment structure
    assignedSubjects: [{
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'subject',
            required: true
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sclass',
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now,
            required: true
        }
    }],
    // Additional fields for enhanced functionality
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
        isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    department: {
        type: String,
        trim: true,
        maxlength: 50
    }
}, { 
    timestamps: true,
    // Compound indexes for optimal query performance
    indexes: [
        { school: 1, isActive: 1 }, // For active teachers in school
        { school: 1, teachSclass: 1 }, // For teachers in specific class
        { 'assignedSubjects.subjectId': 1, 'assignedSubjects.classId': 1 }, // For subject-class assignments
        { school: 1, department: 1 }, // For department-based queries
    ]
});

// Text index for name search functionality
teacherSchema.index({ name: 'text', email: 'text' });

// Pre-save middleware to sync legacy fields with assignedSubjects
teacherSchema.pre('save', function(next) {
    // If assignedSubjects is empty but legacy fields exist, populate assignedSubjects
    if ((!this.assignedSubjects || this.assignedSubjects.length === 0) && 
        this.teachSubject && this.teachSclass) {
        this.assignedSubjects = [{
            subjectId: this.teachSubject,
            classId: this.teachSclass,
            assignedAt: new Date()
        }];
    }
    
    // If assignedSubjects has one item, sync with legacy fields for compatibility
    if (this.assignedSubjects && this.assignedSubjects.length === 1) {
        this.teachSubject = this.assignedSubjects[0].subjectId;
        this.teachSclass = this.assignedSubjects[0].classId;
    }
    
    // Remove duplicate assignments
    if (this.assignedSubjects && this.assignedSubjects.length > 0) {
        const uniqueAssignments = [];
        const seenAssignments = new Set();
        
        for (const assignment of this.assignedSubjects) {
            const key = `${assignment.subjectId}_${assignment.classId}`;
            if (!seenAssignments.has(key)) {
                seenAssignments.add(key);
                uniqueAssignments.push(assignment);
            }
        }
        
        this.assignedSubjects = uniqueAssignments;
    }
    
    next();
});

// Instance method to check if teacher is assigned to a subject/class combination
teacherSchema.methods.isAssignedToSubject = function(subjectId, classId) {
    return this.assignedSubjects.some(assignment => 
        assignment.subjectId.toString() === subjectId.toString() &&
        assignment.classId.toString() === classId.toString()
    );
};

// Instance method to assign teacher to a subject/class
teacherSchema.methods.assignToSubject = function(subjectId, classId) {
    if (!this.isAssignedToSubject(subjectId, classId)) {
        this.assignedSubjects.push({
            subjectId: subjectId,
            classId: classId,
            assignedAt: new Date()
        });
    }
};

// Instance method to unassign teacher from a subject/class
teacherSchema.methods.unassignFromSubject = function(subjectId, classId) {
    this.assignedSubjects = this.assignedSubjects.filter(assignment =>
        !(assignment.subjectId.toString() === subjectId.toString() &&
          assignment.classId.toString() === classId.toString())
    );
};

// Instance method to get all classes taught by teacher
teacherSchema.methods.getTaughtClasses = function() {
    const classIds = [...new Set(this.assignedSubjects.map(assignment => 
        assignment.classId.toString()
    ))];
    return classIds;
};

// Instance method to get all subjects taught by teacher
teacherSchema.methods.getTaughtSubjects = function() {
    const subjectIds = [...new Set(this.assignedSubjects.map(assignment => 
        assignment.subjectId.toString()
    ))];
    return subjectIds;
};

// Static method to find teachers assigned to a subject
teacherSchema.statics.findAssignedToSubject = function(subjectId, classId = null) {
    const query = {
        'assignedSubjects.subjectId': subjectId,
        isActive: true
    };
    
    if (classId) {
        query['assignedSubjects.classId'] = classId;
    }
    
    return this.find(query);
};

// Static method to find teachers in a class
teacherSchema.statics.findByClass = function(classId) {
    return this.find({
        $or: [
            { teachSclass: classId },
            { 'assignedSubjects.classId': classId }
        ],
        isActive: true
    });
};

// Static method to find teachers by school and department
teacherSchema.statics.findBySchoolAndDepartment = function(schoolId, department = null) {
    const query = {
        school: schoolId,
        isActive: true
    };
    
    if (department) {
        query.department = department;
    }
    
    return this.find(query);
};

// --- METHODS (UNCHANGED) ---

// Hash password before saving
teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
teacherSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
teacherSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    this.verificationToken = hash;
    return token; // return raw token for emailing
};

// Generate reset password token
teacherSchema.methods.generateResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordToken = hash;
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return token;
};

module.exports = mongoose.model("Teacher", teacherSchema) // Renamed to "Teacher" (standard practice)