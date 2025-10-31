const mongoose = require('mongoose');

const attendanceAuditLogSchema = new mongoose.Schema({
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceRecord',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete'],
        index: true
    },
    oldValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    newValues: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        // Can reference either teacher or admin
        refPath: 'performedByModel'
    },
    performedByModel: {
        type: String,
        required: true,
        enum: ['teacher', 'admin']
    },
    performedAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    reason: {
        type: String,
        maxlength: 500
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true
    },
    // Additional context fields for better audit trail
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    sessionId: {
        type: String
    }
}, { 
    timestamps: true,
    // Compound indexes for optimal query performance
    indexes: [
        { recordId: 1, performedAt: -1 }, // For record history queries
        { performedBy: 1, performedAt: -1 }, // For user activity queries
        { schoolId: 1, performedAt: -1 }, // For school audit reports
        { action: 1, performedAt: -1 }, // For action-based queries
    ]
});

// Index for date range queries (commonly used in audit reports)
attendanceAuditLogSchema.index({ performedAt: -1 });

// Static method to create audit log entry
attendanceAuditLogSchema.statics.createAuditLog = async function(auditData) {
    const {
        recordId,
        action,
        oldValues = null,
        newValues,
        performedBy,
        performedByModel,
        reason = null,
        schoolId,
        ipAddress = null,
        userAgent = null,
        sessionId = null
    } = auditData;

    return await this.create({
        recordId,
        action,
        oldValues,
        newValues,
        performedBy,
        performedByModel,
        reason,
        schoolId,
        ipAddress,
        userAgent,
        sessionId
    });
};

// Static method to get audit history for a specific record
attendanceAuditLogSchema.statics.getRecordHistory = async function(recordId, limit = 50) {
    return await this.find({ recordId })
        .populate('performedBy', 'name email')
        .sort({ performedAt: -1 })
        .limit(limit);
};

// Static method to get user activity logs
attendanceAuditLogSchema.statics.getUserActivity = async function(userId, startDate, endDate, limit = 100) {
    const query = { performedBy: userId };
    
    if (startDate || endDate) {
        query.performedAt = {};
        if (startDate) query.performedAt.$gte = new Date(startDate);
        if (endDate) query.performedAt.$lte = new Date(endDate);
    }
    
    return await this.find(query)
        .populate('recordId')
        .sort({ performedAt: -1 })
        .limit(limit);
};

// Static method to get school audit summary
attendanceAuditLogSchema.statics.getSchoolAuditSummary = async function(schoolId, startDate, endDate) {
    const matchStage = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    
    if (startDate || endDate) {
        matchStage.performedAt = {};
        if (startDate) matchStage.performedAt.$gte = new Date(startDate);
        if (endDate) matchStage.performedAt.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                lastPerformed: { $max: '$performedAt' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('AttendanceAuditLog', attendanceAuditLogSchema);