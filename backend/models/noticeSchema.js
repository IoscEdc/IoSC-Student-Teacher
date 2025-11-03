const mongoose = require("mongoose")

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    school: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for flexibility
        ref: 'admin'
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("notice", noticeSchema)