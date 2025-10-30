const mongoose = require('mongoose');
require('dotenv').config();

async function debugStudentsQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
        
        const Student = require('./models/studentSchema');
        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        
        console.log('Searching for students with classId:', classId);
        
        // Try the exact query that AttendanceService uses
        const students = await Student.find({ 
            sclassName: classId 
        }).select('_id name rollNum sclassName').sort({ rollNum: 1 });
        
        console.log('Students found:', students.length);
        
        if (students.length > 0) {
            console.log('First few students:');
            students.slice(0, 5).forEach(student => {
                console.log(`- ${student.name} (${student.rollNum}) - Class: ${student.sclassName}`);
            });
        } else {
            console.log('No students found. Let\'s check what classes exist...');
            
            // Check all unique class IDs
            const allStudents = await Student.find({}).select('sclassName').distinct('sclassName');
            console.log('All class IDs in database:', allStudents);
            
            // Check if there are any students at all
            const totalStudents = await Student.countDocuments();
            console.log('Total students in database:', totalStudents);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

debugStudentsQuery();