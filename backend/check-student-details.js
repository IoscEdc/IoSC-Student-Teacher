const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import the Student model
const Student = require('./models/studentSchema');

async function checkStudentDetails() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find all students and test their passwords
        const students = await Student.find({}).limit(5);
        
        console.log(`📋 Found ${students.length} students, testing passwords...\n`);
        
        const testPasswords = ['zxc', 'password', '123', 'password123', 'admin', 'student', 'test'];
        
        for (const student of students) {
            console.log(`👤 Testing student: ${student.name} (Roll: ${student.rollNum})`);
            
            for (const pwd of testPasswords) {
                try {
                    const isValid = await bcrypt.compare(pwd, student.password);
                    if (isValid) {
                        console.log(`🎉 FOUND VALID CREDENTIALS!`);
                        console.log(`   Name: ${student.name}`);
                        console.log(`   Roll: ${student.rollNum}`);
                        console.log(`   Password: "${pwd}"`);
                        console.log(`   ID: ${student._id}`);
                        return { student, password: pwd };
                    }
                } catch (err) {
                    // Skip errors
                }
            }
            console.log(`   ❌ No valid password found for ${student.name}`);
        }
        
        console.log('\n❌ No valid credentials found for any student');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkStudentDetails();