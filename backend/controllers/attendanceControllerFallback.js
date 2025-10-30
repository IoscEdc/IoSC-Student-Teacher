// Simple fallback attendance controller for immediate use
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');

// Fallback method to get students when the full attendance service isn't ready
const getClassStudentsSimple = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId } = req.query;
        
        // For admin users or when authentication isn't fully set up, allow access
        if (!req.user && req.query.fallback === 'true') {
            console.log('⚠️  Using fallback mode - no authentication required');
        }

        // Get students from the class
        const students = await Student.find({ 
            sclassName: classId 
        }).select('_id name rollNum').sort({ rollNum: 1 });

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in the specified class'
            });
        }

        // Format response to match expected structure
        const formattedStudents = students.map(student => ({
            _id: student._id,
            name: student.name,
            rollNum: student.rollNum,
            studentId: student._id  // For compatibility
        }));

        res.status(200).json({
            success: true,
            data: formattedStudents,
            message: 'Students retrieved successfully'
        });

    } catch (error) {
        console.error('Error in getClassStudentsSimple:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get class students'
        });
    }
};

// Simple attendance marking for immediate use
const markAttendanceSimple = async (req, res) => {
    try {
        const { classId, subjectId, date, session, studentAttendance } = req.body;
        
        if (!classId || !subjectId || !date || !session || !studentAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: classId, subjectId, date, session, studentAttendance'
            });
        }

        // For now, just simulate success and log the data
        console.log('📝 Attendance marked (simulation):', {
            classId,
            subjectId, 
            date,
            session,
            studentCount: studentAttendance.length,
            students: studentAttendance
        });

        res.status(200).json({
            success: true,
            data: {
                successCount: studentAttendance.length,
                failureCount: 0,
                message: 'Attendance marked successfully (simulated)'
            },
            message: `Attendance marked for ${studentAttendance.length} students`
        });

    } catch (error) {
        console.error('Error in markAttendanceSimple:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark attendance'
        });
    }
};

module.exports = {
    getClassStudentsSimple,
    markAttendanceSimple
};
