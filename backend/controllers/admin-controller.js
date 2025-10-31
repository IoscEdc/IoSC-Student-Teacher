const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');
const Notice = require('../models/noticeSchema.js');
const Complain = require('../models/complainSchema.js');

const config=require("../config.js");

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.apiKeys.email,
        pass: config.apiKeys.pass
    }
});

// const adminRegister = async (req, res) => {
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hashedPass = await bcrypt.hash(req.body.password, salt);

//         const admin = new Admin({
//             ...req.body,
//             password: hashedPass
//         });

//         const existingAdminByEmail = await Admin.findOne({ email: req.body.email });
//         const existingSchool = await Admin.findOne({ schoolName: req.body.schoolName });

//         if (existingAdminByEmail) {
//             res.send({ message: 'Email already exists' });
//         }
//         else if (existingSchool) {
//             res.send({ message: 'School name already exists' });
//         }
//         else {
//             let result = await admin.save();
//             result.password = undefined;
//             res.send(result);
//         }
//     } catch (err) {
//         res.status(500).json(err);
//     }
// };

// const adminLogIn = async (req, res) => {
//     if (req.body.email && req.body.password) {
//         let admin = await Admin.findOne({ email: req.body.email });
//         if (admin) {
//             const validated = await bcrypt.compare(req.body.password, admin.password);
//             if (validated) {
//                 admin.password = undefined;
//                 res.send(admin);
//             } else {
//                 res.send({ message: "Invalid password" });
//             }
//         } else {
//             res.send({ message: "User not found" });
//         }
//     } else {
//         res.send({ message: "Email and password are required" });
//     }
// };

const adminRegister = async (req, res) => {
    // Admin registration is disabled - only students and teachers can register
    res.status(403).json({ 
        error: "Admin registration is not allowed", 
        message: "Only students and teachers can register. Admins are created by system administrators." 
    });
};

const adminLogIn = async (req, res) => {
    console.log('🔍 ADMIN LOGIN DEBUG - Request received:', { email: req.body.email, password: '***' });
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email }).select('+password');
        console.log('🔍 ADMIN LOGIN DEBUG - Admin found:', !!admin);
        
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await admin.comparePassword(password);
        console.log('🔍 ADMIN LOGIN DEBUG - Password match:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token for admin
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: admin._id }, config.security.jwtSecret, { expiresIn: config.security.jetExpire });
        
        admin.password = undefined;
        console.log('🔍 ADMIN LOGIN DEBUG - Login successful, token generated');
        
        res.json({ success: true, token, admin });
    } catch (err) {
        console.error('🚨 ADMIN LOGIN ERROR:', err);
        res.status(500).json({ error: "Login failed", details: err.message });
    }
};

const getAdminDetail = async (req, res) => {
    try {
        let admin = await Admin.findById(req.params.id);
        if (admin) {
            admin.password = undefined;
            res.send(admin);
        }
        else {
            res.send({ message: "No admin found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

// Helper function to generate user-friendly password for admins
const generateAdminFriendlyPassword = (admin) => {
    // Get first name (remove spaces and special characters)
    const firstName = admin.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    
    // Get school info (remove spaces and special characters)
    const schoolInfo = admin.schoolName.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Generate random 3-digit number
    const randomNum = Math.floor(100 + Math.random() * 900);
    
    // Create password: firstname + school + admin + random number
    const newPassword = `${firstName}${schoolInfo}admin${randomNum}`;
    
    return newPassword;
};

// FORGOT PASSWORD
const adminForgotPassword = async (req, res) => {
    console.log('🔍 BACKEND DEBUG - Admin Forgot Password endpoint hit');
    console.log('🔍 BACKEND DEBUG - Request body:', req.body);
    
    try {
        const { email } = req.body;
        console.log('🔍 BACKEND DEBUG - Email extracted:', email);
        
        const admin = await Admin.findOne({ email }).select('+password');
        console.log('🔍 BACKEND DEBUG - Admin found:', !!admin);
        
        if (!admin) {
            console.log('🔍 BACKEND DEBUG - Admin not found, returning 404');
            return res.status(404).json({ error: "Email not found" });
        }

        // Generate user-friendly password
        const newPassword = generateAdminFriendlyPassword(admin);
        console.log('🔍 BACKEND DEBUG - New password generated:', newPassword);

        // Update admin password in database
        admin.password = newPassword; // Will be hashed by pre-save middleware
        await admin.save();
        console.log('🔍 BACKEND DEBUG - Password updated in database');

        // Send email with new password
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c2143; text-align: center;">🔑 Your New Admin Password</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Hello ${admin.name},</strong></p>
                    <p>We've generated a new password for your admin account. You can use this password to login immediately:</p>
                    
                    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #f57c00; margin: 0; font-size: 24px; letter-spacing: 2px;">${newPassword}</h3>
                    </div>
                    
                    <p><strong>Account Details:</strong></p>
                    <ul style="list-style-type: none; padding: 0;">
                        <li>📧 <strong>Email:</strong> ${admin.email}</li>
                        <li>👨‍💼 <strong>Name:</strong> ${admin.name}</li>
                        <li>🏫 <strong>School:</strong> ${admin.schoolName}</li>
                        <li>🎓 <strong>Role:</strong> ${admin.role}</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <p><strong>🔒 Security Note:</strong></p>
                    <p>For your security, please change this password after logging in by going to your profile settings.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:3000/Adminlogin" style="background-color: #2c2143; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Login Now
                    </a>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        `;

        await transporter.sendMail({
            to: admin.email,
            subject: "🔑 Your New Admin Password - School Management System",
            html: emailHtml
        });
        console.log('🔍 BACKEND DEBUG - Email sent successfully');

        res.json({ 
            success: true, 
            message: "New password has been sent to your email. You can login immediately with the new password." 
        });
        console.log('🔍 BACKEND DEBUG - Response sent');
    } catch (err) {
        console.error('🚨 BACKEND ERROR - Admin forgot password error:', err);
        res.status(500).json({ error: "Failed to send reset email", details: err.message });
    }
};

// const deleteAdmin = async (req, res) => {
//     try {
//         const result = await Admin.findByIdAndDelete(req.params.id)

//         await Sclass.deleteMany({ school: req.params.id });
//         await Student.deleteMany({ school: req.params.id });
//         await Teacher.deleteMany({ school: req.params.id });
//         await Subject.deleteMany({ school: req.params.id });
//         await Notice.deleteMany({ school: req.params.id });
//         await Complain.deleteMany({ school: req.params.id });

//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// const updateAdmin = async (req, res) => {
//     try {
//         if (req.body.password) {
//             const salt = await bcrypt.genSalt(10)
//             res.body.password = await bcrypt.hash(res.body.password, salt)
//         }
//         let result = await Admin.findByIdAndUpdate(req.params.id,
//             { $set: req.body },
//             { new: true })

//         result.password = undefined;
//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// module.exports = { adminRegister, adminLogIn, getAdminDetail, deleteAdmin, updateAdmin };

module.exports = { adminRegister, adminLogIn, getAdminDetail, adminForgotPassword };
