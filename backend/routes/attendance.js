

const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Adjust the path if needed

// Attendance checking route
router.get('/check', async (req, res) => {
  try {
    const students = await Student.find(); // Fetch all students

    const results = students.map(student => {
      const { totalClasses, attendedClasses } = student;

      // Avoid division by zero
      const attendancePercentage = totalClasses > 0 
        ? (attendedClasses / totalClasses) * 100 
        : 0;

      return {
        studentId: student._id,
        name: student.name,
        attendance: attendancePercentage.toFixed(2), // Rounded to 2 decimals
        riskStatus: attendancePercentage < 75 ? "At Risk" : "Good"
      };
    });

    res.json({ students: results });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error checking attendance risk" });
  }
});

module.exports = router;
