/**
 * Check teacher assignment and verify data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('../models/teacherSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');

async function checkTeacherAssignment() {
    try {
        console.log('🔍 Checking teacher assignment...');
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Find the teacher
        const teacher = await Teacher.findOne({ email: 'ds.teacher@university.com' })
            .populate('teachSclass')
            .populate('teachSubject');

        if (!teacher) {
            console.log('❌ Teacher not found');
            return;
        }

        console.log('👨‍🏫 Teacher Details:');
        console.log('  ID:', teacher._id.toString());
        console.log('  Email:', teacher.email);
        console.log('  Name:', teacher.name);
        console.log('  Role:', teacher.role);

        console.log('\n📚 Class Assignment:');
        if (teacher.teachSclass) {
            console.log('  Class ID:', teacher.teachSclass._id.toString());
            console.log('  Class Name:', teacher.teachSclass.sclassName);
            console.log('  School:', teacher.teachSclass.school?.toString());
        } else {
            console.log('  ❌ No class assigned');
        }

        console.log('\n📖 Subject Assignment:');
        if (teacher.teachSubject) {
            console.log('  Subject ID:', teacher.teachSubject._id.toString());
            console.log('  Subject Name:', teacher.teachSubject.subName);
            console.log('  Subject Code:', teacher.teachSubject.subCode);
            console.log('  Sessions/Week:', teacher.teachSubject.sessions);
        } else {
            console.log('  ❌ No subject assigned');
        }

        // Check if this matches our test data
        const expectedClassId = '6902126bf91c442b648f6b95';
        const expectedSubjectId = '6902126bf91c442b648f6b9c';

        console.log('\n🎯 Expected vs Actual:');
        console.log('  Expected Class ID:', expectedClassId);
        console.log('  Actual Class ID:  ', teacher.teachSclass?._id.toString());
        console.log('  Match:', teacher.teachSclass?._id.toString() === expectedClassId ? '✅' : '❌');

        console.log('  Expected Subject ID:', expectedSubjectId);
        console.log('  Actual Subject ID:  ', teacher.teachSubject?._id.toString());
        console.log('  Match:', teacher.teachSubject?._id.toString() === expectedSubjectId ? '✅' : '❌');

        // Also check the class and subject exist independently
        const sclass = await Sclass.findById(expectedClassId);
        const subject = await Subject.findById(expectedSubjectId);

        console.log('\n🏫 Class Verification:');
        if (sclass) {
            console.log('  ✅ Class exists:', sclass.sclassName);
            console.log('  Students enrolled:', sclass.students?.length || 0);
        } else {
            console.log('  ❌ Class not found');
        }

        console.log('\n📚 Subject Verification:');
        if (subject) {
            console.log('  ✅ Subject exists:', subject.subName);
        } else {
            console.log('  ❌ Subject not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

checkTeacherAssignment();