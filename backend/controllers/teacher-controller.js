const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Teacher = require("../models/teacherSchema.js");
const Subject = require("../models/subjectSchema.js");

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// TEACHER REGISTER
const teacherRegister = async (req, res) => {
    const { name, email, password, role, school, teachSubject, teachSclass } = req.body;
    try {
        const existingTeacherByEmail = await Teacher.findOne({ email });

        if (existingTeacherByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const teacher = new Teacher({ 
            name, 
            email, 
            password, // Will be hashed by pre-save middleware
            role, 
            school, 
            teachSubject, 
            teachSclass,
            isVerified: true // For predefined teachers, set as verified
        });

        let result = await teacher.save();
        if (teachSubject) {
            await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id });
        }
        
        result.password = undefined;
        res.status(201).json({ success: true, teacher: result });
    } catch (err) {
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
};

// TEACHER LOGIN
const teacherLogIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const teacher = await Teacher.findOne({ email });

        if (!teacher || !teacher.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await teacher.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        teacher.password = undefined;
        await teacher.populate("teachSubject", "subName sessions");
        await teacher.populate("school", "schoolName");
        await teacher.populate("teachSclass", "sclassName");

        res.json({ success: true, token, teacher });
    } catch (err) {
        res.status(500).json({ error: "Login failed", details: err.message });
    }
};

// Helper function to generate user-friendly password for teachers
const generateTeacherFriendlyPassword = (teacher) => {
    // Get first name (remove spaces and special characters)
    const firstName = teacher.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    
    // Get class info (remove spaces and special characters)
    const classInfo = teacher.teachSclass.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Generate random 3-digit number
    const randomNum = Math.floor(100 + Math.random() * 900);
    
    // Create password: firstname + class + random number
    const newPassword = `${firstName}${classInfo}${randomNum}`;
    
    return newPassword;
};

// FORGOT PASSWORD
const teacherForgotPassword = async (req, res) => {
    console.log('🔍 BACKEND DEBUG - Teacher Forgot Password endpoint hit');
    console.log('🔍 BACKEND DEBUG - Request body:', req.body);
    
    try {
        const { email } = req.body;
        console.log('🔍 BACKEND DEBUG - Email extracted:', email);
        
        const teacher = await Teacher.findOne({ email });
        console.log('🔍 BACKEND DEBUG - Teacher found:', !!teacher);
        
        if (!teacher) {
            console.log('🔍 BACKEND DEBUG - Teacher not found, returning 404');
            return res.status(404).json({ error: "Email not found" });
        }

        // Generate user-friendly password
        const newPassword = generateTeacherFriendlyPassword(teacher);
        console.log('🔍 BACKEND DEBUG - New password generated:', newPassword);

        // Update teacher password in database
        teacher.password = newPassword; // Will be hashed by pre-save middleware
        await teacher.save();
        console.log('🔍 BACKEND DEBUG - Password updated in database');

        // Send email with new password
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c2143; text-align: center;">🔑 Your New Password</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Hello ${teacher.name},</strong></p>
                    <p>We've generated a new password for your teacher account. You can use this password to login immediately:</p>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #2e7d32; margin: 0; font-size: 24px; letter-spacing: 2px;">${newPassword}</h3>
                    </div>
                    
                    <p><strong>Account Details:</strong></p>
                    <ul style="list-style-type: none; padding: 0;">
                        <li>📧 <strong>Email:</strong> ${teacher.email}</li>
                        <li>👨‍🏫 <strong>Name:</strong> ${teacher.name}</li>
                        <li>🏫 <strong>Teaching Class:</strong> ${teacher.teachSclass}</li>
                        <li>🎓 <strong>Role:</strong> ${teacher.role}</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <p><strong>🔒 Security Note:</strong></p>
                    <p>For your security, please change this password after logging in by going to your profile settings.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:3000/Teacherlogin" style="background-color: #2c2143; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Login Now
                    </a>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        `;

        await transporter.sendMail({
            to: teacher.email,
            subject: "🔑 Your New Password - School Management System",
            html: emailHtml
        });
        console.log('🔍 BACKEND DEBUG - Email sent successfully');

        res.json({ 
            success: true, 
            message: "New password has been sent to your email. You can login immediately with the new password." 
        });
        console.log('🔍 BACKEND DEBUG - Response sent');
    } catch (err) {
        console.error('🚨 BACKEND ERROR - Teacher forgot password error:', err);
        res.status(500).json({ error: "Failed to send reset email", details: err.message });
    }
};

// RESET PASSWORD
const teacherResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const teacher = await Teacher.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!teacher) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        teacher.password = password; // Will be hashed by pre-save middleware
        teacher.resetPasswordToken = undefined;
        teacher.resetPasswordExpires = undefined;
        await teacher.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password", details: err.message });
    }
};

// CHANGE PASSWORD
const changeTeacherPassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const teacher = await Teacher.findOne({ email });

        if (!teacher) return res.status(404).json({ error: "Teacher not found" });

        const isMatch = await teacher.comparePassword(oldPassword);
        if (!isMatch) return res.status(401).json({ error: "Old password is incorrect" });

        teacher.password = newPassword; // Will be hashed by pre-save middleware
        await teacher.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to change password", details: err.message });
    }
};

// GET ALL TEACHERS
const getTeachers = async (req, res) => {
    try {
        let teachers = await Teacher.find({ school: req.params.id })
            .populate("teachSubject", "subName")
            .populate("teachSclass", "sclassName");

        if (teachers.length > 0) {
            let modifiedTeachers = teachers.map((teacher) => ({ ...teacher._doc, password: undefined }));
            res.send(modifiedTeachers);
        } else {
            res.send({ message: "No teachers found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// GET SINGLE TEACHER
const getTeacherDetail = async (req, res) => {
    try {
        let teacher = await Teacher.findById(req.params.id)
            .populate("teachSubject", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName");

        if (teacher) {
            teacher.password = undefined;
            res.send(teacher);
        } else {
            res.send({ message: "No teacher found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// UPDATE TEACHER SUBJECT
const updateTeacherSubject = async (req, res) => {
    const { teacherId, teachSubject } = req.body;
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId, { teachSubject }, { new: true });
        await Subject.findByIdAndUpdate(teachSubject, { teacher: updatedTeacher._id });
        res.send(updatedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

// DELETE TEACHER
const deleteTeacher = async (req, res) => {
    try {
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

        if (deletedTeacher) {
            await Subject.updateMany(
                { teacher: deletedTeacher._id },
                { $unset: { teacher: "" } }
            );
        }

        res.send(deletedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

// DELETE TEACHERS BY SCHOOL
const deleteTeachers = async (req, res) => {
    try {
        const doomed = await Teacher.find({ school: req.params.id }).select('_id');
        if (doomed.length === 0) {
            res.send({ message: "No teachers found to delete" });
            return;
        }
        const ids = doomed.map(t => t._id);
        const deletionResult = await Teacher.deleteMany({ _id: { $in: ids } });
        await Subject.updateMany(
            { teacher: { $in: ids } },
            { $unset: { teacher: "" } }
        );
        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

// DELETE TEACHERS BY CLASS
const deleteTeachersByClass = async (req, res) => {
    try {
        const doomed = await Teacher.find({ sclassName: req.params.id }).select('_id');
        if (doomed.length === 0) {
            res.send({ message: "No teachers found to delete" });
            return;
        }
        const ids = doomed.map(t => t._id);
        const deletionResult = await Teacher.deleteMany({ _id: { $in: ids } });
        await Subject.updateMany(
            { teacher: { $in: ids } },
            { $unset: { teacher: "" } }
        );
        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

// TEACHER ATTENDANCE
const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.send({ message: 'Teacher not found' });

        const existingAttendance = teacher.attendance.find(
            (a) => a.date.toDateString() === new Date(date).toDateString()
        );

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            teacher.attendance.push({ date, status });
        }

        const result = await teacher.save();
        if (result) result.password = undefined;
        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    teacherForgotPassword,
    teacherResetPassword,
    changeTeacherPassword,
    getTeachers,
    getTeacherDetail,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    teacherAttendance
};
