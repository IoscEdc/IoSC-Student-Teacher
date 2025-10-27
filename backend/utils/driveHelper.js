const fs = require("fs");
const drive = require("../config/googleDrive");

// ✅ Add your shared Drive folder ID in .env file as DRIVE_PARENT_FOLDER_ID
const DRIVE_PARENT_FOLDER_ID = process.env.DRIVE_PARENT_FOLDER_ID;

/**
 * Upload a local file to Google Drive inside a specific folder.
 * Automatically uploads to the shared folder if DRIVE_PARENT_FOLDER_ID is set.
 */
const uploadFileToDrive = async ({ filePath, fileName, mimeType }) => {
  const media = { mimeType, body: fs.createReadStream(filePath) };
  const resource = { 
    name: fileName,
    parents: DRIVE_PARENT_FOLDER_ID ? [DRIVE_PARENT_FOLDER_ID] : [] // upload to shared folder if available
  };

  const res = await drive.files.create({
    requestBody: resource,
    media,
    fields: "id,name,webViewLink,webContentLink"
  });

  // Make file public
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: "reader", type: "anyone" }
  });

  // Fetch public links
  const { data } = await drive.files.get({
    fileId: res.data.id,
    fields: "id,webViewLink,webContentLink"
  });

  return data; // returns { id, webViewLink, webContentLink }
};

module.exports = {
  uploadFileToDrive
};
