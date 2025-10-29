const Assignment= require("../models/Assignment.js");
const fs=require("fs");
const { uploadFileToDrive, makeFilePublic }= require("../utils/driveHelper.js");

const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;
    const assignment = await Assignment.create({
      title,
      description,
      subject,
      dueDate,
      teacher: req.user._id
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("teacher", "name email");
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("teacher", "name email");
    if (!assignment) return res.status(404).json({ message: "Not found" });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "File required" });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const driveFile = await uploadFileToDrive({
      filePath: file.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID]
    });

    const publicFile = await makeFilePublic(driveFile.id);

    const submission = {
      student: req.user._id,
      driveFileId: driveFile.id,
      fileUrl: publicFile.webViewLink || publicFile.webContentLink
    };

    assignment.submissions.push(submission);
    await assignment.save();

    fs.unlinkSync(file.path);
    res.status(201).json({ message: "Submitted", submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const sub = assignment.submissions.id(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    sub.grade = grade;
    sub.feedback = feedback;
    await assignment.save();

    res.json({ message: "Graded", submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createAssignment, listAssignments, getAssignment, submitAssignment, gradeSubmission };