const Note=require("../models/Note.js");
const fs=require("fs");
const { uploadFileToDrive, makeFilePublic }=require("../utils/driveHelper.js");

const uploadNote = async (req, res) => {
  try {
    const file = req.file;
    const { title, subject, year } = req.body;
    if (!file) return res.status(400).json({ message: "File required" });

    const driveFile = await uploadFileToDrive({
      filePath: file.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID]
    });

    const publicFile = await makeFilePublic(driveFile.id);

    const note = await Note.create({
      title,
      subject,
      year,
      driveFileId: driveFile.id,
      fileUrl: publicFile.webViewLink || publicFile.webContentLink,
      uploadedBy: req.user?._id
    });

    fs.unlinkSync(file.path);
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
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

module.exports = {uploadNote,listNotes,getNote};