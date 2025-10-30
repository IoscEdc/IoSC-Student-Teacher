const express = require('express');
const router = express.Router();
const { getStudentSummarySimple } = require('../controllers/attendanceControllerSimple');

// Simple route without complex middleware
router.get('/summary/student/:studentId', getStudentSummarySimple);

module.exports = router;