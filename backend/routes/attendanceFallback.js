const express = require('express');
const { getClassStudentsSimple, markAttendanceSimple } = require('../controllers/attendanceControllerFallback');

const router = express.Router();

// Simple fallback routes for immediate testing
router.get('/class/:classId/students', getClassStudentsSimple);
router.post('/mark', markAttendanceSimple);

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Fallback attendance routes are working',
        timestamp: new Date()
    });
});

module.exports = router;
