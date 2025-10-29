const express = require("express");
const multer = require("multer");
const {
  createAssignment,
  listAssignments,
  getAssignment,
  submitAssignment,
  gradeSubmission
} = require("../controllers/assignmentController");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", authMiddleware, authorizeRoles("teacher", "admin"), createAssignment);
router.get("/", authMiddleware, listAssignments);
router.get("/:id", authMiddleware, getAssignment);

// Student submits assignment
router.post("/:id/submit", authMiddleware, authorizeRoles("student"), upload.single("file"), submitAssignment);

// Teacher grades submission
router.put("/:assignmentId/submissions/:submissionId/grade", authMiddleware, authorizeRoles("teacher", "admin"), gradeSubmission);

module.exports = router;

