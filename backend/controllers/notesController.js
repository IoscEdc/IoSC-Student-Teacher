const Note = require("../models/Note");
const fs = require("fs");
const { uploadFileToDrive, makeFilePublic } = require("../utils/driveHelper");

const uploadNote = async (req, res) => {
  try {
    const { title, subject, driveLink } = req.body;

    // simple validation
    if (!title || !subject || !driveLink) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // (Here you’d normally save to MongoDB — for now just send success)
    res.status(200).json({
      message: "Note uploaded successfully",
      data: { title, subject, driveLink },
    });
  } catch (error) {
    console.error("❌ Error in uploadNote:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const listNotes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.year) filter.year = Number(req.query.year);
    const notes = await Note.find(filter).populate("uploadedBy", "name email");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadNote,
  listNotes,
  getNote
};
