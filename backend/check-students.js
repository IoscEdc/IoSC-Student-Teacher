const mongoose = require('mongoose');
require('dotenv').config();

// Import the Student model
const Student = require('./models/studentSchema');

async function checkStudents() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find all students
        const students = await Student.find({}).limit(5);
        console.log(`📊 Found ${students.length} students in database`);
        
        if (students.length > 0) {
            console.log('\n👥 Sample students:');
            students.forEach((student, index) => {
                console.log(`${index + 1}. ID: ${student._id}`);
                console.log(`   Name: ${student.name}`);
                console.log(`   Roll: ${student.rollNum}`);
                console.log(`   Class: ${student.sclassName}`);
                console.log('   ---');
            });
            
            // Test with the first student
            const testStudent = students[0];
            console.log(`\n🧪 Test student details:`);
            console.log(`ID: ${testStudent._id}`);
            console.log(`Name: ${testStudent.name}`);
            console.log(`Roll: ${testStudent.rollNum}`);
            
            return testStudent;
        } else {
            console.log('❌ No students found in database');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkStudents();