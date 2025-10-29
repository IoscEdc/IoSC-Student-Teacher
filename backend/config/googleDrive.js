const { google } = require("googleapis");
const path = require("path");
// const { fileURLToPath } = require("url"); // <-- Removed (not needed)
const dotenv = require("dotenv");
dotenv.config();

// const _filename = fileURLToPath(import.meta.url); // <-- Removed (ESM syntax)
const _dirname = __dirname; // <-- Use the CJS global '__dirname' directly

// service account JSON filename (placed in backend root)
// This path will correctly resolve to '.../backend/service-account.json'
const keyFile = path.join(_dirname, "..", process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "service-account.json");

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/drive"]
});

const drive = google.drive({ version: "v3", auth });
module.exports = drive;