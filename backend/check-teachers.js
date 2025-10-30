const mongoose = require('mongoose');
require('dotenv').config();

async function checkTeachers() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
        
        const Teacher = require('./models/teacherSchema');
        const teachers = await Teacher.find({});
        
        console.log('Teachers found:', teachers.length);
        teachers.forEach((teacher, index) => {
            console.log(`Teacher ${index + 1}:`, {
                name: teacher.name,
                email: teacher.email,
                teachSubject: teacher.teachSubject?.subName,
                teachSclass: teacher.teachSclass,
                school: teacher.school?.schoolName
            });
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkTeachers();