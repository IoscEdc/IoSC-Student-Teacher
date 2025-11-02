const Notice = require("../models/noticeSchema.js");
const Teacher = require("../models/teacherSchema.js");
const Admin = require("../models/adminSchema.js");

// Create Notice (Teachers and Admins)
const noticeCreate = async (req, res) => {
    try {
        const { title, details, school, priority, date } = req.body;
        const userId = req.user._id; // From authentication middleware
        const userRole = req.user.role; // From authentication middleware

        console.log('🔍 NOTICE CREATE DEBUG - User:', { userId, userRole });

        if (!title || !details) {
            return res.status(400).json({ error: "Title and details are required" });
        }

        let creator = null;
        let schoolId = school;

        if (userRole === 'Teacher') {
            // Verify teacher exists
            creator = await Teacher.findById(userId);
            if (!creator) {
                return res.status(404).json({ error: "Teacher not found" });
            }
            schoolId = schoolId || creator.school;
        } else if (userRole === 'Admin') {
            // Verify admin exists
            creator = await Admin.findById(userId);
            if (!creator) {
                return res.status(404).json({ error: "Admin not found" });
            }
            schoolId = schoolId || creator._id; // Admin's school is their own ID
        } else {
            return res.status(403).json({ error: "Only teachers and admins can create notices" });
        }

        const noticeData = { 
            title, 
            details, 
            school: schoolId,
            teacher: userRole === 'Teacher' ? userId : null,
            admin: userRole === 'Admin' ? userId : null,
            priority: priority || 'medium',
            date: date ? new Date(date) : new Date()
        };
        
        console.log('🔍 NOTICE CREATE DEBUG - Creating notice with data:', noticeData);
        const newNotice = await Notice.create(noticeData);

        const populatedNotice = await Notice.findById(newNotice._id)
            .populate('admin', 'name email')

        console.log('🔍 NOTICE CREATE DEBUG - Notice created successfully');
        res.status(201).json({ success: true, notice: populatedNotice });
    } catch (error) {
        console.error("Notice creation error:", error);
        res.status(500).json({ error: "Failed to create notice", details: error.message });
    }
};

// Get All Notices (Students and Teachers can view)
const noticeList = async (req, res) => {
    try {
        const { school } = req.params;
        console.log('🔍 NOTICE LIST DEBUG - School param:', school);
        
        let query = { isActive: true };
        
        if (school) {
            // Handle both ObjectId and string school references
            query.school = school;
        }
        
        console.log('🔍 NOTICE LIST DEBUG - Query:', query);
        
        const notices = await Notice.find(query)
            .populate('admin', 'name email')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, notices });
    } catch (error) {
        console.error("Notice fetch error:", error);
        res.status(500).json({ error: "Failed to fetch notices", details: error.message });
    }
};

// Get Notices by Teacher/Admin (User's own notices)
const getTeacherNotices = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        
        let query = {};
        if (userRole === 'Teacher') {
            query = { teacher: userId };
        } else if (userRole === 'Admin') {
            query = { admin: userId };
        }
        
        const notices = await Notice.find(query)
            .populate('teacher', 'name email')
            .populate('admin', 'name email')
            .populate('school', 'schoolName')
            .sort({ createdAt: -1 });

        res.json({ success: true, notices });
    } catch (error) {
        console.error("User notices fetch error:", error);
        res.status(500).json({ error: "Failed to fetch user notices" });
    }
};

// Get Single Notice
const getNoticeDetail = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('school', 'schoolName');

        if (!notice) {
            return res.status(404).json({ error: "Notice not found" });
        }

        res.json({ success: true, notice });
    } catch (error) {
        console.error("Notice detail fetch error:", error);
        res.status(500).json({ error: "Failed to fetch notice details" });
    }
};

// Update Notice (Only by the teacher/admin who created it)
const updateNotice = async (req, res) => {
    try {
        const noticeId = req.params.id;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Check if notice exists and belongs to the user
        let query = { _id: noticeId };
        if (userRole === 'Teacher') {
            query.teacher = userId;
        } else if (userRole === 'Admin') {
            query.admin = userId;
        }

        const existingNotice = await Notice.findOne(query);
        if (!existingNotice) {
            return res.status(404).json({ error: "Notice not found or unauthorized" });
        }

        const updatedNotice = await Notice.findByIdAndUpdate(
            noticeId,
            req.body,
            { new: true }
        ).populate('teacher', 'name email')
         .populate('admin', 'name email')
         .populate('school', 'schoolName');

        res.json({ success: true, notice: updatedNotice });
    } catch (error) {
        console.error("Notice update error:", error);
        res.status(500).json({ error: "Failed to update notice" });
    }
};

// Delete Notice (Only by the teacher/admin who created it)
const deleteNotice = async (req, res) => {
    try {
        const noticeId = req.params.id;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Check if notice exists and belongs to the user
        let query = { _id: noticeId };
        if (userRole === 'Teacher') {
            query.teacher = userId;
        } else if (userRole === 'Admin') {
            query.admin = userId;
        }

        const existingNotice = await Notice.findOne(query);
        if (!existingNotice) {
            return res.status(404).json({ error: "Notice not found or unauthorized" });
        }

        await Notice.findByIdAndDelete(noticeId);
        res.json({ success: true, message: "Notice deleted successfully" });
    } catch (error) {
        console.error("Notice delete error:", error);
        res.status(500).json({ error: "Failed to delete notice" });
    }
};

// Delete All Notices by Teacher
const deleteTeacherNotices = async (req, res) => {
    try {
        const teacherId = req.user._id;
        
        const result = await Notice.deleteMany({ teacher: teacherId });
        res.json({ 
            success: true, 
            message: `${result.deletedCount} notices deleted successfully` 
        });
    } catch (error) {
        console.error("Teacher notices delete error:", error);
        res.status(500).json({ error: "Failed to delete notices" });
    }
};

// Admin function - Delete all notices
const deleteNotices = async (req, res) => {
    try {
        const result = await Notice.deleteMany();
        res.json({ 
            success: true, 
            message: `${result.deletedCount} notices deleted successfully` 
        });
    } catch (error) {
        console.error("Notice delete-all error:", error);
        res.status(500).json({ error: "Failed to delete notices" });
    }
};

module.exports = {
    noticeCreate,
    noticeList,
    getTeacherNotices,
    getNoticeDetail,
    updateNotice,
    deleteNotice,
    deleteTeacherNotices,
    deleteNotices
};