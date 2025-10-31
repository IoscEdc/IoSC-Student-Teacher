const mongoose = require('mongoose');

const sessionConfigurationSchema = new mongoose.Schema({
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
    sessionType: {
        type: String,
        required: true,
        enum: ['lecture', 'lab', 'tutorial'],
        index: true
    },
    sessionsPerWeek: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 3
    },
    sessionDuration: {
        type: Number,
        required: true,
        min: 30,
        max: 180,
        default: 60 // Duration in minutes
    },
    totalSessions: {
        type: Number,
        required: true,
        min: 1,
        default: 45 // Total sessions in a semester/term
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true
    },
    // Additional configuration fields
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    // Session naming pattern configuration
    sessionNamingPattern: {
        type: String,
        default: '{type} {number}', // e.g., "Lecture 1", "Lab 2"
        required: true
    },
    // Days of week when sessions occur
    scheduledDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    // Time slots for sessions
    timeSlots: [{
        startTime: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
        },
        endTime: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
        }
    }]
}, { 
    timestamps: true,
    // Compound indexes for optimal query performance
    indexes: [
        { subjectId: 1, classId: 1 }, // For subject-class configuration queries
        { schoolId: 1, isActive: 1 }, // For active configurations
        { sessionType: 1, isActive: 1 }, // For session type queries
    ]
});

// Compound unique index to ensure one configuration per subject-class-sessionType combination
sessionConfigurationSchema.index(
    { subjectId: 1, classId: 1, sessionType: 1 }, 
    { unique: true }
);

// Validation to ensure endDate is after startDate
sessionConfigurationSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    
    // Validate time slots
    for (let slot of this.timeSlots) {
        if (slot.endTime <= slot.startTime) {
            return next(new Error('End time must be after start time for all time slots'));
        }
    }
    
    next();
});

// Virtual field to get session names based on pattern
sessionConfigurationSchema.virtual('sessionNames').get(function() {
    const names = [];
    
    if (this.sessionType === 'lecture') {
        // For lectures, generate based on sessions per week
        for (let i = 1; i <= this.sessionsPerWeek; i++) {
            names.push(`Lecture ${i}`);
        }
    } else {
        // For other session types (lab, tutorial, etc.), just use the type name
        const typeName = this.sessionType.charAt(0).toUpperCase() + this.sessionType.slice(1);
        names.push(typeName);
    }
    
    return names;
});

// Static method to get active configurations for a class
sessionConfigurationSchema.statics.getActiveConfigurationsForClass = async function(classId) {
    return await this.find({ 
        classId: new mongoose.Types.ObjectId(classId), 
        isActive: true 
    }).populate('subjectId', 'subName subCode');
};

// Static method to get configuration for specific subject and class
sessionConfigurationSchema.statics.getConfiguration = async function(subjectId, classId, sessionType = null) {
    const query = { 
        subjectId: new mongoose.Types.ObjectId(subjectId), 
        classId: new mongoose.Types.ObjectId(classId),
        isActive: true 
    };
    
    if (sessionType) {
        query.sessionType = sessionType;
    }
    
    return await this.findOne(query);
};

// Static method to validate session name against configuration
sessionConfigurationSchema.statics.validateSessionName = async function(subjectId, classId, sessionName) {
    const configurations = await this.find({ 
        subjectId: new mongoose.Types.ObjectId(subjectId), 
        classId: new mongoose.Types.ObjectId(classId),
        isActive: true 
    });
    
    for (let config of configurations) {
        const validNames = config.sessionNames;
        if (validNames.includes(sessionName)) {
            return { isValid: true, configuration: config };
        }
    }
    
    return { isValid: false, configuration: null };
};

// Static method to get all possible session names for a subject-class combination
sessionConfigurationSchema.statics.getAllSessionNames = async function(subjectId, classId) {
    const configurations = await this.find({ 
        subjectId: new mongoose.Types.ObjectId(subjectId), 
        classId: new mongoose.Types.ObjectId(classId),
        isActive: true 
    });
    
    let allSessionNames = [];
    configurations.forEach(config => {
        allSessionNames = allSessionNames.concat(config.sessionNames);
    });
    
    return allSessionNames;
};

module.exports = mongoose.model('SessionConfiguration', sessionConfigurationSchema);