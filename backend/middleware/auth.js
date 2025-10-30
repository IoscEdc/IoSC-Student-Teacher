const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Import models based on the existing schema structure
const Admin = require("../models/adminSchema");
const Student = require("../models/studentSchema");
const Teacher = require("../models/teacherSchema");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "") || req.query.token;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in different collections based on role
    let user = null;
    
    if (decoded.role === 'Admin') {
      user = await Admin.findById(decoded.id).select("-password");
    } else if (decoded.role === 'Student') {
      user = await Student.findById(decoded.id).select("-password");
    } else if (decoded.role === 'Teacher') {
      user = await Teacher.findById(decoded.id).select("-password");
    }
    
    if (!user) return res.status(401).json({ message: "Invalid token" });
    
    req.user = { ...user.toObject(), id: user._id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token not valid" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};

module.exports = {
  authMiddleware,
  authorizeRoles
};
