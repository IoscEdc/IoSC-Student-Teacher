const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');

async function checkSubjects() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Check current student
        const currentStudentId = '690213114a29841c1f2a63ac';
        const currentStudent = await Student.findById(currentStudentId);
        console.log('👤 Current student:', currentStudent ? currentStudent.name : 'Not found');

        // Check all subjects in the database
        console.log('\n📚 All subjects in database:');
        const allSubjects = await Subject.find().lean();
        allSubjects.forEach((subject, index) => {
            console.log(`   ${index + 1}. ${subject.subName} (${subject.subCode || 'No code'})`);
        });

        // Check subjects for current student
        console.log('\n📊 Subjects for current student:');
        const studentRecords = await AttendanceRecord.find({ studentId: currentStudentId })
            .populate('subjectId', 'subName subCode')
            .lean();
        
        const studentSubjects = [...new Set(studentRecords.map(r => r.subjectId._id.toString()))]
            .map(subjectId => {
                const record = studentRecords.find(r => r.subjectId._id.toString() === subjectId);
                return {
                    id: subjectId,
                    name: record.subjectId.subName,
                    code: record.subjectId.subCode
                };
            });

        studentSubjects.forEach((subject, index) => {
            console.log(`   ${index + 1}. ${subject.name} (${subject.code || 'No code'})`);
        });

        // Check if there are subjects with the names you're looking for
        console.log('\n🔍 Looking for expected subjects:');
        const expectedSubjects = [
            'Essential Mathematics for AI',
            'Operating Systems',
            'Database Management System (DBMS)',
            'Foundation of Computer Science',
            'Data Structures'
        ];

        for (const expectedName of expectedSubjects) {
            const found = allSubjects.find(s => 
                s.subName.toLowerCase().includes(expectedName.toLowerCase()) ||
                expectedName.toLowerCase().includes(s.subName.toLowerCase())
            );
            console.log(`   ${expectedName}: ${found ? `Found as "${found.subName}"` : 'Not found'}`);
        }

        // Check other students to see if they have the expected subjects
        console.log('\n👥 Checking other students:');
        const allStudents = await Student.find().limit(5).lean();
        for (const student of allStudents) {
            const records = await AttendanceRecord.find({ studentId: student._id })
                .populate('subjectId', 'subName')
                .limit(3)
                .lean();
            
            if (records.length > 0) {
                console.log(`   ${student.name}: ${records.map(r => r.subjectId.subName).join(', ')}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkSubjects();