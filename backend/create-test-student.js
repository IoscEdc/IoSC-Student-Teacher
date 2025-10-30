const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const Student = require('./models/studentSchema');
const Admin = require('./models/adminSchema');
const Sclass = require('./models/sclassSchema');

async function createTestStudent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find an existing admin and class
        const admin = await Admin.findOne({});
        const sclass = await Sclass.findOne({});
        
        if (!admin) {
            console.log('❌ No admin found in database');
            return;
        }
        
        if (!sclass) {
            console.log('❌ No class found in database');
            return;
        }

        console.log(`📋 Using admin: ${admin.adminName} (${admin._id})`);
        console.log(`📋 Using class: ${sclass.sclassName} (${sclass._id})`);

        // Check if test student already exists
        const existingStudent = await Student.findOne({ rollNum: 99999, name: 'Test Student Portal' });
        
        if (existingStudent) {
            console.log('👤 Test student already exists:');
            console.log(`   ID: ${existingStudent._id}`);
            console.log(`   Name: ${existingStudent.name}`);
            console.log(`   Roll: ${existingStudent.rollNum}`);
            console.log(`   Password: "testpass123"`);
            return existingStudent;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('testpass123', 10);

        // Create test student
        const testStudent = new Student({
            name: 'Test Student Portal',
            rollNum: 99999,
            password: hashedPassword,
            sclassName: sclass._id,
            school: admin._id,
            role: 'Student'
        });

        await testStudent.save();
        
        console.log('🎉 Test student created successfully!');
        console.log(`   ID: ${testStudent._id}`);
        console.log(`   Name: ${testStudent.name}`);
        console.log(`   Roll: ${testStudent.rollNum}`);
        console.log(`   Password: "testpass123"`);
        console.log(`   Class: ${sclass.sclassName}`);
        console.log(`   School: ${admin.adminName}`);
        
        return testStudent;
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestStudent();