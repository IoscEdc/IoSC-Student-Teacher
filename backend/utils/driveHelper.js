const fs = require("fs");
const drive = require("../config/googleDrive");

/**
 * Upload local file to Drive. parents is array of folder IDs
 */
const uploadFileToDrive = async ({ filePath, fileName, mimeType, parents = [] }) => {
  const media = { mimeType, body: fs.createReadStream(filePath) };
  const resource = { name: fileName };
  if (parents.length) resource.parents = parents;

  const res = await drive.files.create({
    requestBody: resource,
    media,
    fields: "id,name,webViewLink,webContentLink"
  });

  return res.data;
};

/**
 * Make a file public (anyone with link can view) and return links
 */
const makeFilePublic = async (fileId) => {
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" }
  });
  const { data } = await drive.files.get({ fileId, fields: "id,webViewLink,webContentLink" });
  return data;
};

module.exports = {
  uploadFileToDrive,
  makeFilePublic
};
