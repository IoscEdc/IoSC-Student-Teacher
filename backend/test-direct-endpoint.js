const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint that bypasses all middleware
app.get('/api/test/students/:classId', async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        const { classId } = req.params;
        const Student = require('./models/studentSchema');
        
        console.log('Direct test - Class ID:', classId);
        
        const students = await Student.find({ 
            sclassName: classId 
        }).select('_id name rollNum').sort({ rollNum: 1 });
        
        console.log('Students found:', students.length);
        
        res.json({
            success: true,
            data: students.map(student => ({
                _id: student._id,
                name: student.name,
                rollNum: student.rollNum
            })),
            message: `Found ${students.length} students`,
            classId: classId
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log('Test URL: http://localhost:5002/api/test/students/6902126bf91c442b648f6b95');
});