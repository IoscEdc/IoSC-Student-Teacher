/**
 * Script to update existing passwords with proper hashing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');

async function updatePasswords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Hash the default password
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        console.log('✅ Password hashed for security');

        // Update admin password
        const adminResult = await Admin.updateOne(
            { email: 'admin@university.com' },
            { password: hashedPassword }
        );
        console.log(`✅ Admin password updated: ${adminResult.modifiedCount} record(s)`);

        // Update teacher password
        const teacherResult = await Teacher.updateOne(
            { email: 'ds.teacher@university.com' },
            { password: hashedPassword }
        );
        console.log(`✅ Teacher password updated: ${teacherResult.modifiedCount} record(s)`);

        // Update all student passwords for AIDS B1 class
        const studentResult = await Student.updateMany(
            { universityId: { $regex: /^AIDS2024/ } }, // All AIDS students
            { password: hashedPassword }
        );
        console.log(`✅ Student passwords updated: ${studentResult.modifiedCount} record(s)`);

        console.log('\n🎉 Password update completed successfully!');
        console.log('\n🔑 All accounts now use password: password123');
        console.log('\n📝 Login Credentials:');
        console.log('   Admin: admin@university.com / password123');
        console.log('   Teacher: ds.teacher@university.com / password123');
        console.log('   Students: Use roll number (1-72) / password123');

    } catch (error) {
        console.error('❌ Error updating passwords:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

// Run the update
if (require.main === module) {
    updatePasswords();
}

module.exports = updatePasswords;