const jwt = require('jsonwebtoken');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const Admin = require('../models/adminSchema');

const config=require("../config.js");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        
        // Try to find user in Student, Teacher, or Admin collections
        let user = await Student.findById(decoded.id).select('-password');
        if (!user) {
            user = await Teacher.findById(decoded.id).select('-password');
        }
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authenticateStudent = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        const student = await Student.findById(decoded.id).select('-password');

        if (!student) {
            return res.status(401).json({ error: 'Invalid student token' });
        }

        req.user = student;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authenticateTeacher = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        const teacher = await Teacher.findById(decoded.id).select('-password');

        if (!teacher) {
            return res.status(401).json({ error: 'Invalid teacher token' });
        }

        req.user = teacher;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({ error: 'Invalid admin token' });
        }

        req.user = admin;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to authenticate either teacher or admin
const authenticateTeacherOrAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        
        // Try to find user as teacher first, then admin
        let user = await Teacher.findById(decoded.id).select('-password');
        if (user) {
            user.role = 'Teacher';
        } else {
            user = await Admin.findById(decoded.id).select('-password');
            if (user) {
                user.role = 'Admin';
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid token - must be teacher or admin' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = {
    authenticateToken,
    authenticateStudent,
    authenticateTeacher,
    authenticateAdmin,
    authenticateTeacherOrAdmin
};

module.exports = {
  authMiddleware,
  authorizeRoles
};
