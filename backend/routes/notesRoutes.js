const express = require("express");
const multer = require("multer");
const { uploadNote, listNotes, getNote } = require("../controllers/notesController");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload a note
router.post("/upload", authMiddleware, authorizeRoles("teacher", "admin"), upload.single("file"), uploadNote);

// List all notes
router.get("/", authMiddleware, listNotes);

// Get note by ID
router.get("/:id", authMiddleware, getNote);

module.exports = router;


