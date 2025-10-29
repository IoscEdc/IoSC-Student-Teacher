const express = require("express");
const multer = require("multer");
const { createNotice, listNotices } = require("../controllers/noticeController");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Create a notice
router.post("/", authMiddleware, authorizeRoles("teacher", "admin"), upload.single("file"), createNotice);

// List all notices
router.get("/", authMiddleware, listNotices);

module.exports = router;


