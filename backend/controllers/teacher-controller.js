const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const crypto = require("crypto");
const Teacher = require("../models/teacherSchema.js");
const Subject = require("../models/subjectSchema.js");
const Sclass = require("../models/sclassSchema.js");

const config = require("../config.js");

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.apiKeys.email,
        pass: config.apiKeys.pass
    }
});

const verifyEmailTeacher = async (req, res) => {
    try {
        const token = req.params.token;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const teacher = await Teacher.findOne({ 
            verificationToken: hashedToken 
        });

        if (!teacher) {
            return res.redirect('http://localhost:3000/verification-failed?error=invalid');
        }

        teacher.isVerified = true;
        teacher.verificationToken = undefined;
        await teacher.save();

        res.redirect('http://localhost:3000');
    
    } catch (err) {
        console.error("Email verification error:", err.message);
        res.redirect('http://localhost:3000/verification-failed?error=server');
    }
};

const sendTeacherVerificationEmail = async (teacher, req) => {
    const token = teacher.generateVerificationToken();
    await teacher.save({ validateBeforeSave: false });

    const url = `${req.protocol}://${req.get("host")}/api/teacher/verify/${token}`;
    await transporter.sendMail({
        to: teacher.email,
        subject: "Verify Your Teacher Account",
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
    });
};

const teacherRegister = async (req, res) => {
    const { name, email, password, role, school, department } = req.body;
    
    try {
        // Validate required fields
        if (!name || !email || !password || !school) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide all required fields: name, email, password, and school' 
            });
        }

        const existingTeacher = await Teacher.findOne({ email });

        // Handle existing but unverified teachers
        if (existingTeacher && !existingTeacher.isVerified) {
            existingTeacher.name = name;
            existingTeacher.password = password;
            existingTeacher.role = role || 'Teacher';
            existingTeacher.school = school;
            existingTeacher.department = department || '';
            
            await existingTeacher.save();
            await sendTeacherVerificationEmail(existingTeacher, req);

            return res.status(200).json({ 
                success: true, 
                message: "Account exists but was unverified. Verification email resent." 
            });
        }

        if (existingTeacher && existingTeacher.isVerified) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

        // Create new teacher
        const teacher = new Teacher({ 
            name, 
            email, 
            password,
            role: role || 'Teacher',
            school,
            department: department || '',
            isVerified: false,
            isActive: true
        });

        let result = await teacher.save();
        
        // Send verification email
        try {
            await sendTeacherVerificationEmail(result, req);
        } catch (emailError) {
            console.error("Teacher verification email failed to send:", emailError);
        }

        result.password = undefined;
        
        res.status(201).json({ 
            success: true, 
            teacher: result, 
            message: "Registration successful. Please check your email to verify."
        });

    } catch (err) {
        console.error("Teacher registration error:", err.message);
        res.status(500).json({ 
            success: false,
            error: "Registration failed", 
            details: err.message 
        });
    }
};

// TEACHER LOGIN
const teacherLogIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const teacher = await Teacher.findOne({ email })
            .populate('school', 'schoolName')
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .populate('classInchargeOf', 'sclassName');

        if (!teacher || !teacher.password) {
            return res.status(401).json({ 
                success: false,
                error: "Invalid credentials" 
            });
        }

        if (!teacher.isVerified) {
            return res.status(401).json({ 
                success: false,
                error: "Account not verified", 
                message: "Please check your email to verify your account before logging in." 
            });
        }

        if (!teacher.isActive) {
            return res.status(401).json({ 
                success: false,
                error: "Account deactivated", 
                message: "Your account has been deactivated. Please contact the administrator." 
            });
        }

        const isMatch = await teacher.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                error: "Invalid credentials" 
            });
        }

        // Update last login
        teacher.lastLogin = new Date();
        await teacher.save();

        const token = jwt.sign(
            { id: teacher._id, role: teacher.role }, 
            config.security.jwtSecret, 
            { expiresIn: config.security.jwtExpire }
        );

        teacher.password = undefined;

        console.log("Teacher login successful:", teacher.email);

        res.json({ 
            success: true, 
            token, 
            teacher 
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ 
            success: false,
            error: "Login failed", 
            details: err.message 
        });
    }
};

// Helper function to generate user-friendly password
const generateTeacherFriendlyPassword = (teacher) => {
    const firstName = teacher.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newPassword = `${firstName}${randomNum}`;
    
    console.log(`Generated password for ${teacher.email}: ${newPassword}`);
    return newPassword;
};

// FORGOT PASSWORD
const teacherForgotPassword = async (req, res) => {
    console.log('🔍 Teacher Forgot Password endpoint hit');
    
    try {
        const { email } = req.body;
        
        const teacher = await Teacher.findOne({ email })
            .populate('school', 'schoolName')
            .populate('assignedSubjects.classId', 'sclassName');
        
        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                error: "Email not found" 
            });
        }

        const newPassword = generateTeacherFriendlyPassword(teacher);

        teacher.password = newPassword;
        await teacher.save();

        // Get class names for display
        const classNames = teacher.assignedSubjects.length > 0 
            ? teacher.assignedSubjects.map(a => a.classId?.sclassName).filter(Boolean).join(', ')
            : 'Not assigned yet';

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
                        <li>🏫 <strong>School:</strong> ${teacher.school?.schoolName || 'N/A'}</li>
                        <li>📚 <strong>Department:</strong> ${teacher.department || 'Not specified'}</li>
                        <li>🎓 <strong>Classes:</strong> ${classNames}</li>
                        <li>🔖 <strong>Role:</strong> ${teacher.role}</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <p><strong>🔒 Security Note:</strong></p>
                    <p>For your security, please change this password after logging in by going to your profile settings.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:3000/Teacher/login" style="background-color: #2c2143; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
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

        res.json({ 
            success: true, 
            message: "New password has been sent to your email. You can login immediately with the new password." 
        });
    } catch (err) {
        console.error('Teacher forgot password error:', err);
        res.status(500).json({ 
            success: false,
            error: "Failed to send reset email", 
            details: err.message 
        });
    }
};

// RESET PASSWORD
const teacherResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const teacher = await Teacher.findOne({
            resetPasswordToken: hash,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!teacher) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid or expired token" 
            });
        }

        teacher.password = password;
        teacher.resetPasswordToken = undefined;
        teacher.resetPasswordExpires = undefined;
        await teacher.save();

        res.json({ 
            success: true, 
            message: "Password reset successful" 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to reset password", 
            details: err.message 
        });
    }
};

// CHANGE PASSWORD
const changeTeacherPassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                error: "Teacher not found" 
            });
        }

        const isMatch = await teacher.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                error: "Old password is incorrect" 
            });
        }

        teacher.password = newPassword;
        await teacher.save();

        res.json({ 
            success: true, 
            message: "Password changed successfully" 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to change password", 
            details: err.message 
        });
    }
};

// GET ALL TEACHERS
const getTeachers = async (req, res) => {
    try {
        const { school, department, isActive } = req.query;
        
        let query = {};
        if (school) query.school = school;
        if (department) query.department = department;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        let teachers = await Teacher.find(query)
            .populate('school', 'schoolName')
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .populate('classInchargeOf', 'sclassName')
            .select('-password');

        if (teachers.length > 0) {
            res.json({ 
                success: true,
                count: teachers.length,
                teachers 
            });
        } else {
            res.json({ 
                success: true,
                message: "No teachers found",
                teachers: [] 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch teachers",
            details: err.message 
        });
    }
};

// GET SINGLE TEACHER
const getTeacherDetail = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('school', 'schoolName')
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .populate('classInchargeOf', 'sclassName')
            .select('-password');

        if (teacher) {
            res.json({ 
                success: true,
                teacher 
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: "Teacher not found" 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch teacher details",
            details: err.message 
        });
    }
};

// ASSIGN TEACHER TO SUBJECT/CLASS
const assignTeacherToSubject = async (req, res) => {
    try {
        const { teacherId, subjectId, classId } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                error: "Teacher not found" 
            });
        }

        // Use the instance method from schema
        teacher.assignToSubject(subjectId, classId);
        await teacher.save();

        // Update subject with teacher reference

        const updatedTeacher = await Teacher.findById(teacherId)
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .select('-password');

        res.json({ 
            success: true,
            message: "Teacher assigned successfully",
            teacher: updatedTeacher 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to assign teacher",
            details: err.message 
        });
    }
};

// UNASSIGN TEACHER FROM SUBJECT/CLASS
const unassignTeacherFromSubject = async (req, res) => {
    try {
        const { teacherId, subjectId, classId } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                error: "Teacher not found" 
            });
        }

        teacher.unassignFromSubject(subjectId, classId);
        await teacher.save();

        const updatedTeacher = await Teacher.findById(teacherId)
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .select('-password');

        res.json({ 
            success: true,
            message: "Teacher unassigned successfully",
            teacher: updatedTeacher 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to unassign teacher",
            details: err.message 
        });
    }
};

// MAKE TEACHER CLASS INCHARGE
const makeTeacherClassIncharge = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                error: "Teacher not found" 
            });
        }

        teacher.makeClassIncharge(classId);
        await teacher.save();

        // Update class with incharge reference
        await Sclass.findByIdAndUpdate(classId, { 
            classIncharge: teacherId 
        });

        const updatedTeacher = await Teacher.findById(teacherId)
            .populate('classInchargeOf', 'sclassName')
            .select('-password');

        res.json({ 
            success: true,
            message: "Teacher assigned as class incharge",
            teacher: updatedTeacher 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: "Failed to assign class incharge",
            details: err.message 
        });
    }
};

// UPDATE TEACHER SUBJECT (Legacy support)
const updateTeacherSubject = async (req, res) => {
    const { teacherId, teachSubject } = req.body;
    try {
        // 1. Find the teacher
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ success: false, error: "Teacher not found" });
        }

        // 2. Update the legacy field
        teacher.teachSubject = teachSubject;

        // 3. Save the teacher (this will trigger the pre-save hook)
        const updatedTeacher = await teacher.save();

        // 4. Update the subject (this is part of the legacy logic, keep it)
        await Subject.findByIdAndUpdate(teachSubject, { 
            teacher: updatedTeacher._id 
        });

        updatedTeacher.password = undefined; // Hide password
        res.json({ 
            success: true,
            teacher: updatedTeacher 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to update teacher subject",
            details: error.message 
        });
    }
};

// DELETE TEACHER
const deleteTeacher = async (req, res) => {
    try {
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

        if (deletedTeacher) {
            // Remove teacher reference from subjects
            await Subject.updateMany(
                { teacher: deletedTeacher._id },
                { $unset: { teacher: "" } }
            );
            
            // Remove class incharge reference
            await Sclass.updateMany(
                { classIncharge: deletedTeacher._id },
                { $unset: { classIncharge: "" } }
            );

            res.json({ 
                success: true,
                message: "Teacher deleted successfully",
                teacher: deletedTeacher 
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: "Teacher not found" 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to delete teacher",
            details: error.message 
        });
    }
};

// DELETE TEACHERS BY SCHOOL
const deleteTeachers = async (req, res) => {
    try {
        const doomed = await Teacher.find({ school: req.params.id }).select('_id');
        
        if (doomed.length === 0) {
            return res.json({ 
                success: true,
                message: "No teachers found to delete" 
            });
        }
        
        const ids = doomed.map(t => t._id);
        const deletionResult = await Teacher.deleteMany({ _id: { $in: ids } });
        
        await Subject.updateMany(
            { teacher: { $in: ids } },
            { $unset: { teacher: "" } }
        );
        
        await Sclass.updateMany(
            { classIncharge: { $in: ids } },
            { $unset: { classIncharge: "" } }
        );
        
        res.json({ 
            success: true,
            message: `${deletionResult.deletedCount} teachers deleted`,
            deletionResult 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to delete teachers",
            details: error.message 
        });
    }
};

// DELETE TEACHERS BY CLASS
const deleteTeachersByClass = async (req, res) => {
    try {
        const doomed = await Teacher.find({ 
            'assignedSubjects.classId': req.params.id 
        }).select('_id');
        
        if (doomed.length === 0) {
            return res.json({ 
                success: true,
                message: "No teachers found to delete" 
            });
        }
        
        const ids = doomed.map(t => t._id);
        const deletionResult = await Teacher.deleteMany({ _id: { $in: ids } });
        
        await Subject.updateMany(
            { teacher: { $in: ids } },
            { $unset: { teacher: "" } }
        );
        
        res.json({ 
            success: true,
            message: `${deletionResult.deletedCount} teachers deleted`,
            deletionResult 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to delete teachers",
            details: error.message 
        });
    }
};

// GET TEACHERS BY CLASS
const getTeachersByClass = async (req, res) => {
    try {
        const teachers = await Teacher.findByClass(req.params.id)
            .populate('school', 'schoolName')
            .populate('assignedSubjects.subjectId', 'subName')
            .populate('assignedSubjects.classId', 'sclassName')
            .select('-password');

        res.json({ 
            success: true,
            count: teachers.length,
            teachers 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch teachers",
            details: error.message 
        });
    }
};

// TEACHER ATTENDANCE (if needed)
const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;
    try {
        const teacher = await Teacher.findById(req.params.id);
        
        if (!teacher) {
            return res.status(404).json({ 
                success: false,
                message: 'Teacher not found' 
            });
        }

        // Note: attendance field is not in the current schema
        // You may need to add it or handle it differently
        
        res.json({ 
            success: true,
            message: "Attendance feature needs to be implemented in schema" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "Failed to record attendance",
            details: error.message 
        });
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    teacherForgotPassword,
    teacherResetPassword,
    changeTeacherPassword,
    getTeachers,
    verifyEmailTeacher,
    getTeacherDetail,
    assignTeacherToSubject,
    unassignTeacherFromSubject,
    makeTeacherClassIncharge,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    getTeachersByClass,
    teacherAttendance
};