const jwt = require('jsonwebtoken');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const Admin = require('../models/adminSchema');

const config = require("../config.js");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header or query
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.query.token;
        
        console.log('🔑 AUTH MIDDLEWARE - Token received:', token ? 'Yes' : 'No');
        
        if (!token) {
            console.log('❌ AUTH MIDDLEWARE - No token provided');
            return res.status(401).json({ 
                success: false,
                message: "No token provided" 
            });
        }

        // Try both JWT secrets (for backward compatibility)
        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
            console.log('✅ AUTH MIDDLEWARE - Token verified with config.security.jwtSecret');
        } catch (err) {
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('✅ AUTH MIDDLEWARE - Token verified with process.env.JWT_SECRET');
            } catch (err2) {
                console.log('❌ AUTH MIDDLEWARE - Token verification failed with both secrets');
                return res.status(401).json({ 
                    success: false,
                    message: "Invalid token" 
                });
            }
        }

        console.log('🔍 AUTH MIDDLEWARE - Decoded token:', { id: decoded.id, role: decoded.role });

        // Try to find user in different collections based on role
        let user = null;
        
        if (decoded.role === 'Admin') {
            user = await Admin.findById(decoded.id).select("-password");
            console.log('👤 AUTH MIDDLEWARE - Admin user found:', !!user);
            
            if (user) {
                // ✅ FIX: For Admin, the school IS the admin's _id
                req.user = {
                    ...user.toObject(),
                    id: user._id.toString(),
                    role: decoded.role,
                    school: user._id.toString() // Admin IS the school
                };
            }
        } else if (decoded.role === 'Student') {
            user = await Student.findById(decoded.id)
                .populate('school', '_id schoolName')
                .select("-password");
            console.log('👤 AUTH MIDDLEWARE - Student user found:', !!user);
            
            if (user) {
                req.user = {
                    ...user.toObject(),
                    id: user._id.toString(),
                    role: decoded.role,
                    school: user.school?._id?.toString() || user.school?.toString() || user.school
                };
            }
        } else if (decoded.role === 'Teacher') {
            user = await Teacher.findById(decoded.id)
                .populate('school', '_id schoolName')
                .populate('assignedSubjects.subjectId', 'subName')
                .populate('assignedSubjects.classId', 'sclassName')
                .select("-password");
            console.log('👤 AUTH MIDDLEWARE - Teacher user found:', !!user);
            
            if (user) {
                console.log('📚 AUTH MIDDLEWARE - Teacher assignments:', {
                    assignedSubjects: user.assignedSubjects?.length || 0,
                    classInchargeOf: user.classInchargeOf?.length || 0
                });
                
                req.user = {
                    ...user.toObject(),
                    id: user._id.toString(),
                    role: decoded.role,
                    school: user.school?._id?.toString() || user.school?.toString() || user.school
                };
            }
        }
        
        if (!user) {
            console.log('❌ AUTH MIDDLEWARE - User not found in database');
            return res.status(401).json({ 
                success: false,
                message: "Invalid token - user not found" 
            });
        }

        console.log('✅ AUTH MIDDLEWARE - req.user set:', {
            id: req.user.id,
            role: req.user.role,
            name: req.user.name,
            school: req.user.school
        });

        next();
    } catch (err) {
        console.error('❌ AUTH MIDDLEWARE - Error:', err.message);
        res.status(401).json({ 
            success: false,
            message: "Token not valid",
            error: err.message 
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log(`🔒 AUTHORIZE ROLES - Checking role: '${req.user?.role}' against [${roles}]`);

        if (!req.user) {
            console.log('❌ AUTHORIZE ROLES - No user in request');
            return res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
        }

        if (!roles.includes(req.user.role)) {
            console.log('❌ AUTHORIZE ROLES - Role authorization FAILED');
            return res.status(403).json({ 
                success: false,
                message: 'User role is not authorized to access this resource',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        console.log('✅ AUTHORIZE ROLES - Role authorization PASSED');
        next();
    };
};

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
        } catch (err) {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        
        // Try to find user in Student, Teacher, or Admin collections
        let user = await Student.findById(decoded.id).select('-password');
        let schoolId = user?.school;
        
        if (!user) {
            user = await Teacher.findById(decoded.id).select('-password');
            schoolId = user?.school;
        }
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password');
            schoolId = user?._id; // Admin IS the school
        }

        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token' 
            });
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            role: decoded.role,
            school: schoolId?.toString() || schoolId
        };
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

const authenticateStudent = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
        } catch (err) {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }

        const student = await Student.findById(decoded.id).select('-password');

        if (!student) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid student token' 
            });
        }

        req.user = {
            ...student.toObject(),
            id: student._id.toString(),
            role: 'Student',
            school: student.school?.toString() || student.school
        };
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

const authenticateTeacher = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
        } catch (err) {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }

        const teacher = await Teacher.findById(decoded.id)
            .populate('assignedSubjects.subjectId')
            .populate('assignedSubjects.classId')
            .select('-password');

        if (!teacher) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid teacher token' 
            });
        }

        req.user = {
            ...teacher.toObject(),
            id: teacher._id.toString(),
            role: 'Teacher',
            school: teacher.school?.toString() || teacher.school
        };
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
        } catch (err) {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }

        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid admin token' 
            });
        }

        req.user = {
            ...admin.toObject(),
            id: admin._id.toString(),
            role: 'Admin',
            school: admin._id.toString() // Admin IS the school
        };
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

const authenticateTeacherOrAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.security.jwtSecret);
        } catch (err) {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        
        // Try to find user as teacher first, then admin
        let user = await Teacher.findById(decoded.id).select('-password');
        let role = 'Teacher';
        let schoolId = user?.school;
        
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password');
            role = 'Admin';
            schoolId = user?._id; // Admin IS the school
        }

        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token - must be teacher or admin' 
            });
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            role: role,
            school: schoolId?.toString() || schoolId
        };
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

module.exports = {
    authenticateToken,
    authenticateStudent,
    authenticateTeacher,
    authenticateAdmin,
    authenticateTeacherOrAdmin,
    authMiddleware, 
    authorizeRoles
};