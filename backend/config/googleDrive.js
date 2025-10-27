const { google } = require("googleapis");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// service account JSON filename (placed in backend root)
const keyFile = path.join(
  __dirname,
  "..",
  process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "service-account.json"
);

// authenticate Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// initialize Drive instance
const drive = google.drive({ version: "v3", auth });

// optional: shared parent folder for uploads
const DRIVE_PARENT_FOLDER_ID = process.env.DRIVE_PARENT_FOLDER_ID || null;

module.exports = {
  drive,
  DRIVE_PARENT_FOLDER_ID,
};

