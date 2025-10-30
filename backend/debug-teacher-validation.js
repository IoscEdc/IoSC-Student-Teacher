const mongoose = require('mongoose');
require('dotenv').config();

async function debugTeacherValidation() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
        
        const Teacher = require('./models/teacherSchema');
        const ValidationService = require('./services/ValidationService');
        
        const teacherId = '6902126bf91c442b648f6ba0'; // Dr. Data Structures Teacher
        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures
        
        console.log('Testing teacher validation...');
        console.log('Teacher ID:', teacherId);
        console.log('Class ID:', classId);
        console.log('Subject ID:', subjectId);
        
        // Get teacher details
        const teacher = await Teacher.findById(teacherId);
        if (teacher) {
            console.log('Teacher found:', teacher.name);
            console.log('Teacher class:', teacher.teachSclass);
            console.log('Teacher subject:', teacher.teachSubject);
            console.log('Class match:', teacher.teachSclass.toString() === classId.toString());
            console.log('Subject match:', teacher.teachSubject.toString() === subjectId.toString());
        } else {
            console.log('Teacher not found!');
            return;
        }
        
        // Test validation
        try {
            await ValidationService.validateTeacherAssignment(teacherId, classId, subjectId, 'Teacher');
            console.log('✅ Teacher validation passed');
        } catch (error) {
            console.log('❌ Teacher validation failed:', error.message);
        }
        
        // Test with admin role
        try {
            await ValidationService.validateTeacherAssignment(teacherId, classId, subjectId, 'Admin');
            console.log('✅ Admin validation passed');
        } catch (error) {
            console.log('❌ Admin validation failed:', error.message);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

debugTeacherValidation();