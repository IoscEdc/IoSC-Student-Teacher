/**
 * Script to check student enrollment in DS subject
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Sclass = require('../models/sclassSchema');

async function checkStudentEnrollment() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find the DS subject and AIDS B1 class
        const dsSubject = await Subject.findOne({ subName: 'Data Structures' });
        const aidsB1Class = await Sclass.findOne({ sclassName: 'AIDS B1' });

        if (!dsSubject || !aidsB1Class) {
            console.log('❌ DS subject or AIDS B1 class not found');
            return;
        }

        console.log(`🎯 Checking enrollment for:`);
        console.log(`Subject: ${dsSubject.subName} (${dsSubject._id})`);
        console.log(`Class: ${aidsB1Class.sclassName} (${aidsB1Class._id})`);

        // Find all students in AIDS B1 class
        const students = await Student.find({ 
            sclassName: aidsB1Class._id 
        }).populate('enrolledSubjects.subjectId');

        console.log(`\n📊 Found ${students.length} students in AIDS B1 class`);

        // Check enrollment status
        let enrolledCount = 0;
        let notEnrolledStudents = [];

        students.forEach(student => {
            const isEnrolled = student.enrolledSubjects.some(
                enrollment => enrollment.subjectId && enrollment.subjectId._id.toString() === dsSubject._id.toString()
            );
            
            if (isEnrolled) {
                enrolledCount++;
            } else {
                notEnrolledStudents.push({
                    name: student.name,
                    rollNum: student.rollNum,
                    universityId: student.universityId
                });
            }
        });

        console.log(`✅ Students enrolled in DS: ${enrolledCount}`);
        console.log(`❌ Students not enrolled: ${notEnrolledStudents.length}`);

        if (notEnrolledStudents.length > 0) {
            console.log('\n📋 Students not enrolled in DS:');
            notEnrolledStudents.forEach(student => {
                console.log(`   ${student.rollNum}. ${student.name} (${student.universityId})`);
            });

            // Fix enrollment for students not enrolled
            console.log('\n🔧 Fixing enrollment for missing students...');
            
            for (const studentInfo of notEnrolledStudents) {
                await Student.updateOne(
                    { 
                        rollNum: studentInfo.rollNum,
                        sclassName: aidsB1Class._id 
                    },
                    {
                        $push: {
                            enrolledSubjects: {
                                subjectId: dsSubject._id,
                                enrollmentDate: new Date()
                            }
                        }
                    }
                );
            }
            
            console.log(`✅ Fixed enrollment for ${notEnrolledStudents.length} students`);
        }

        // Sample a few students to show their enrollment details
        console.log('\n📚 Sample student enrollments:');
        const sampleStudents = students.slice(0, 3);
        
        for (const student of sampleStudents) {
            console.log(`\n   ${student.rollNum}. ${student.name}`);
            console.log(`   University ID: ${student.universityId}`);
            console.log(`   Enrolled Subjects: ${student.enrolledSubjects.length}`);
            
            student.enrolledSubjects.forEach((enrollment, index) => {
                const subjectName = enrollment.subjectId ? enrollment.subjectId.subName : 'Unknown Subject';
                console.log(`     ${index + 1}. ${subjectName} (enrolled: ${enrollment.enrollmentDate})`);
            });
        }

        console.log('\n🎉 Student enrollment check completed!');
        console.log(`\n📊 Final Summary:`);
        console.log(`   Total students in AIDS B1: ${students.length}`);
        console.log(`   Students enrolled in DS: ${enrolledCount + notEnrolledStudents.length}`);
        console.log(`   Ready for attendance marking: ✅`);

    } catch (error) {
        console.error('❌ Error checking student enrollment:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

// Run the check
if (require.main === module) {
    checkStudentEnrollment();
}

module.exports = checkStudentEnrollment;