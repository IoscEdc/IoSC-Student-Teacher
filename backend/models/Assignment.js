const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driveFileId: String,
  fileUrl: String,
  submittedAt: { type: Date, default: Date.now },
  grade: Number,
  feedback: String
});

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: String,
  dueDate: Date,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submissions: [SubmissionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Assignment", AssignmentSchema);
