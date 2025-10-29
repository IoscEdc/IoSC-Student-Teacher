const Notice = require("../models/Notice.js");
const fs =require( "fs");
const { uploadFileToDrive, makeFilePublic }= require("../utils/driveHelper.js");

const createNotice = async (req, res) => {
  try {
    const file = req.file;
    const { title, description, department } = req.body;

    let driveFileId = null;
    let fileUrl = null;

    if (file) {
      const driveFile = await uploadFileToDrive({
        filePath: file.path,
        fileName: file.originalname,
        mimeType: file.mimetype,
        parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID]
      });

      const publicFile = await makeFilePublic(driveFile.id);
      driveFileId = driveFile.id;
      fileUrl = publicFile.webViewLink || publicFile.webContentLink;

      fs.unlinkSync(file.path);
    }

    const notice = await Notice.create({
      title,
      description,
      department,
      driveFileId,
      fileUrl,
      createdBy: req.user._id
    });

    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listNotices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    const notices = await Notice.find(filter).populate("createdBy", "name email");
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createNotice, listNotices };
