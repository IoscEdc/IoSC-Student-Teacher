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
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        index: true
    },
    password: {
        type: String,
        minlength: 6
    },
    role: {
        type: String,
        default: "Teacher",
        enum: ["Teacher", "Admin"]
    },
    // Legacy assignments field (kept for backward compatibility)
    assignments: [{
        subject: {
            type: String,
            required: true
        },
        subjectcode: {
            type: String,
            required: true
        },
        className: {
            type: String,
            required: true
        }
    }],
    // Enhanced assignment structure with class reference
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
    // Direct reference to school
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true
    },
    // Classes where teacher is class incharge
    classInchargeOf: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass'
    }],
    // Legacy fields for backward compatibility
    teachSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject'
    },
    teachSclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass'
    },
    // Additional fields
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date
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
    },
}, { 
    timestamps: true,
    indexes: [
        { school: 1, isActive: 1 },
        { school: 1, teachSclass: 1 },
        { 'assignedSubjects.subjectId': 1, 'assignedSubjects.classId': 1 },
        { school: 1, department: 1 },
        { 'assignedSubjects.classId': 1 }
    ]
});

// Text index for search functionality
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
    
    // If assignedSubjects has one item, sync with legacy fields
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

// Pre-save middleware for password hashing
teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Instance method to check if teacher is assigned to a subject/class
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

// Instance method to check if teacher is class incharge
teacherSchema.methods.isClassIncharge = function(classId) {
    return this.classInchargeOf.some(id => id.toString() === classId.toString());
};

// Instance method to make teacher class incharge
teacherSchema.methods.makeClassIncharge = function(classId) {
    if (!this.isClassIncharge(classId)) {
        this.classInchargeOf.push(classId);
    }
};

// Instance method to remove teacher as class incharge
teacherSchema.methods.removeClassIncharge = function(classId) {
    this.classInchargeOf = this.classInchargeOf.filter(id => 
        id.toString() !== classId.toString()
    );
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

// Static method to find class incharge for a specific class
teacherSchema.statics.findClassIncharge = function(classId) {
    return this.findOne({
        classInchargeOf: classId,
        isActive: true
    });
};

// Static method to find all teachers in a school
teacherSchema.statics.findBySchool = function(schoolId, activeOnly = true) {
    const query = { school: schoolId };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query);
};

// Compare password
teacherSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
teacherSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    this.verificationToken = hash;
    return token;
};

// Generate reset password token
teacherSchema.methods.generateResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordToken = hash;
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return token;
};

module.exports = mongoose.model("Teacher", teacherSchema);