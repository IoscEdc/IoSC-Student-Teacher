/**
 * Setup script for AIDS B1 class with DS subject and students
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Admin = require('../models/adminSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');

// Student data - Generate unique university IDs for each student
const studentsData = [
    { rollNum: 1, name: "MAYANK BISHT", universityId: "AIDS2024001" },
    { rollNum: 2, name: "VANSH VARSHNEY", universityId: "AIDS2024002" },
    { rollNum: 3, name: "SAI GOYAL", universityId: "AIDS2024003" },
    { rollNum: 4, name: "DRISHTI SONI", universityId: "AIDS2024004" },
    { rollNum: 5, name: "DEEPANK SHARMA", universityId: "AIDS2024005" },
    { rollNum: 6, name: "YASHITA GAUR", universityId: "AIDS2024006" },
    { rollNum: 7, name: "DHEERAJ RAJPUT", universityId: "AIDS2024007" },
    { rollNum: 8, name: "AARUSH SRIVASTAVA", universityId: "AIDS2024008" },
    { rollNum: 9, name: "ANSHIKA GOYAL", universityId: "AIDS2024009" },
    { rollNum: 10, name: "HABEEB MOHAMMED", universityId: "AIDS2024010" },
    { rollNum: 11, name: "ISHMEET SINGH", universityId: "AIDS2024011" },
    { rollNum: 12, name: "ANNANYA GERA", universityId: "AIDS2024012" },
    { rollNum: 13, name: "RAGHAV KAUSHIK", universityId: "AIDS2024013" },
    { rollNum: 14, name: "P V RAMA KRISHNA PRASAD", universityId: "AIDS2024014" },
    { rollNum: 15, name: "KARTIK MALHOTRA", universityId: "AIDS2024015" },
    { rollNum: 16, name: "JATIN SHARMA", universityId: "AIDS2024016" },
    { rollNum: 17, name: "RIYANSHU KUMAR", universityId: "AIDS2024017" },
    { rollNum: 18, name: "YARUL AGARWAL", universityId: "AIDS2024018" },
    { rollNum: 19, name: "HARSH YADAV", universityId: "AIDS2024019" },
    { rollNum: 20, name: "VIBHANSHU SHARMA", universityId: "AIDS2024020" },
    { rollNum: 21, name: "ATUL SINGH", universityId: "AIDS2024021" },
    { rollNum: 22, name: "SWAYAM KUMAR GUPTA", universityId: "AIDS2024022" },
    { rollNum: 23, name: "RAGHAV BHATIA", universityId: "AIDS2024023" },
    { rollNum: 24, name: "MANISH KUMAR", universityId: "AIDS2024024" },
    { rollNum: 25, name: "PREET KUMAR", universityId: "AIDS2024025" },
    { rollNum: 26, name: "GOVIND GARG", universityId: "AIDS2024026" },
    { rollNum: 27, name: "PRITHVI KAUSHIK", universityId: "AIDS2024027" },
    { rollNum: 28, name: "PRINCE GUPTA", universityId: "AIDS2024028" },
    { rollNum: 29, name: "NIKUNJ RAJ TANEJA", universityId: "AIDS2024029" },
    { rollNum: 30, name: "JAYANT BALIYAN", universityId: "AIDS2024030" },
    { rollNum: 31, name: "PIYUSH KUMAR", universityId: "AIDS2024031" },
    { rollNum: 32, name: "APOORV DUBEY", universityId: "AIDS2024032" },
    { rollNum: 33, name: "DAKSH RAWAT", universityId: "AIDS2024033" },
    { rollNum: 34, name: "KRISHAN DUBEY", universityId: "AIDS2024034" },
    { rollNum: 35, name: "NITISH MATTA", universityId: "AIDS2024035" },
    { rollNum: 36, name: "GAURI SINGH SENGAR", universityId: "AIDS2024036" },
    { rollNum: 37, name: "RIYA MALHOTRA", universityId: "AIDS2024037" },
    { rollNum: 38, name: "PRINCE RAJ", universityId: "AIDS2024038" },
    { rollNum: 39, name: "VANSH KAMRA", universityId: "AIDS2024039" },
    { rollNum: 40, name: "YASHNA VERMA", universityId: "AIDS2024040" },
    { rollNum: 41, name: "DHRUV SHARMA", universityId: "AIDS2024041" },
    { rollNum: 42, name: "DHAIRYA MANIKTALA", universityId: "AIDS2024042" },
    { rollNum: 43, name: "AAYUSH SUNILKUMAR JHA", universityId: "AIDS2024043" },
    { rollNum: 44, name: "DAKSH TEKWANI", universityId: "AIDS2024044" },
    { rollNum: 45, name: "ANUBHAV OJHA", universityId: "AIDS2024045" },
    { rollNum: 46, name: "NIKHIL CHAVAN", universityId: "AIDS2024046" },
    { rollNum: 47, name: "TARINI AGARWAL", universityId: "AIDS2024047" },
    { rollNum: 48, name: "OJUS MATHUR", universityId: "AIDS2024048" },
    { rollNum: 49, name: "DEEPAK SINGH", universityId: "AIDS2024049" },
    { rollNum: 50, name: "SAUMYE BANSAL", universityId: "AIDS2024050" },
    { rollNum: 51, name: "DIVYANSH KOTNALA", universityId: "AIDS2024051" },
    { rollNum: 52, name: "CHAITANYA PARESH LELE", universityId: "AIDS2024052" },
    { rollNum: 53, name: "RISHABH", universityId: "AIDS2024053" },
    { rollNum: 54, name: "AKSHAT TALWAR", universityId: "AIDS2024054" },
    { rollNum: 55, name: "PRASHANT BALIYAN", universityId: "AIDS2024055" },
    { rollNum: 56, name: "UJJWAL KUMAR SHARMA", universityId: "AIDS2024056" },
    { rollNum: 57, name: "SHONAL DHAUNI", universityId: "AIDS2024057" },
    { rollNum: 58, name: "AKSHIT KAPOOR", universityId: "AIDS2024058" },
    { rollNum: 59, name: "WAQAR AKHTAR", universityId: "AIDS2024059" },
    { rollNum: 60, name: "DHAIRYA NARULA", universityId: "AIDS2024060" },
    { rollNum: 61, name: "JIYA WADHWA", universityId: "AIDS2024061" },
    { rollNum: 62, name: "HIMANSHU CHAUHAN", universityId: "AIDS2024062" },
    { rollNum: 63, name: "HIMANSHU TIWARI", universityId: "AIDS2024063" },
    { rollNum: 64, name: "UTKARSH PATHAK", universityId: "AIDS2024064" },
    { rollNum: 65, name: "YASH SHAHI", universityId: "AIDS2024065" },
    { rollNum: 66, name: "PREM CHAND DURGAPAL", universityId: "AIDS2024066" },
    { rollNum: 67, name: "ADARSH KUMAR", universityId: "AIDS2024067" },
    { rollNum: 68, name: "ARYAN BHARDWAJ", universityId: "AIDS2024068" },
    { rollNum: 69, name: "KRRISH GUPTA", universityId: "AIDS2024069" },
    { rollNum: 70, name: "AYUSH BANSAL", universityId: "AIDS2024070" },
    { rollNum: 71, name: "RISHABH GAUR", universityId: "AIDS2024071" },
    { rollNum: 72, name: "KARTIK KUMAR", universityId: "AIDS2024072" }
];

async function setupAIDSB1Class() {
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

        // 1. Create or get admin
        let admin = await Admin.findOne({ email: 'admin@university.com' });
        if (!admin) {
            admin = new Admin({
                name: 'University Admin',
                email: 'admin@university.com',
                password: hashedPassword,
                schoolName: 'University School of Applied Sciences'
            });
            await admin.save();
            console.log('✅ Admin created');
        } else {
            console.log('✅ Admin found');
        }

        // 2. Create AIDS B1 class
        let aidsB1Class = await Sclass.findOne({ sclassName: 'AIDS B1', school: admin._id });
        if (!aidsB1Class) {
            aidsB1Class = new Sclass({
                sclassName: 'AIDS B1',
                school: admin._id
            });
            await aidsB1Class.save();
            console.log('✅ AIDS B1 class created');
        } else {
            console.log('✅ AIDS B1 class found');
        }

        // 3. Create DS (Data Structures) subject
        let dsSubject = await Subject.findOne({
            subName: 'Data Structures',
            sclassName: aidsB1Class._id,
            school: admin._id
        });
        if (!dsSubject) {
            dsSubject = new Subject({
                subName: 'Data Structures',
                subCode: 'DS101',
                sessions: 75, // Total sessions: 60 lectures + 15 labs
                sclassName: aidsB1Class._id,
                school: admin._id
            });
            await dsSubject.save();
            console.log('✅ Data Structures subject created');
        } else {
            console.log('✅ Data Structures subject found');
        }

        // 4. Create a teacher for DS subject
        let dsTeacher = await Teacher.findOne({ email: 'ds.teacher@university.com' });
        if (!dsTeacher) {
            dsTeacher = new Teacher({
                name: 'Dr. Data Structures Teacher',
                email: 'ds.teacher@university.com',
                password: hashedPassword,
                role: 'Teacher',
                school: admin._id,
                teachSubject: dsSubject._id,
                teachSclass: aidsB1Class._id
            });
            await dsTeacher.save();
            console.log('✅ DS Teacher created');
        } else {
            console.log('✅ DS Teacher found');
        }

        // 5. Create students
        console.log('Creating students...');
        let createdCount = 0;
        let existingCount = 0;

        for (const studentData of studentsData) {
            const existingStudent = await Student.findOne({
                rollNum: studentData.rollNum,
                sclassName: aidsB1Class._id,
                school: admin._id
            });

            if (!existingStudent) {
                const student = new Student({
                    name: studentData.name,
                    rollNum: studentData.rollNum,
                    universityId: studentData.universityId,
                    password: hashedPassword,
                    sclassName: aidsB1Class._id,
                    school: admin._id,
                    enrolledSubjects: [{
                        subjectId: dsSubject._id,
                        enrollmentDate: new Date()
                    }]
                });
                await student.save();
                createdCount++;
            } else {
                // Update enrolled subjects if not already enrolled
                const isEnrolled = existingStudent.enrolledSubjects.some(
                    sub => sub.subjectId.toString() === dsSubject._id.toString()
                );

                if (!isEnrolled) {
                    existingStudent.enrolledSubjects.push({
                        subjectId: dsSubject._id,
                        enrollmentDate: new Date()
                    });
                    await existingStudent.save();
                }
                existingCount++;
            }
        }

        console.log(`✅ Students processed: ${createdCount} created, ${existingCount} existing`);

        // 6. Create session configurations for DS subject
        const SessionConfiguration = require('../models/sessionConfigurationSchema');

        // Delete existing configurations to update them
        await SessionConfiguration.deleteMany({
            subjectId: dsSubject._id,
            classId: aidsB1Class._id
        });

        // Create lecture configuration (4 lectures per week)
        const lectureConfig = new SessionConfiguration({
            subjectId: dsSubject._id,
            classId: aidsB1Class._id,
            schoolId: admin._id,
            sessionType: 'lecture',
            sessionsPerWeek: 4, // 4 lectures per week
            sessionDuration: 60,
            totalSessions: 60, // 4 lectures × 15 weeks = 60 lectures
            startDate: new Date('2024-01-15'), // Semester start
            endDate: new Date('2024-05-15'),   // Semester end
            scheduledDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], // 4 lecture days
            timeSlots: [
                { startTime: '09:00', endTime: '10:00' }, // Tuesday - Lecture 1
                { startTime: '10:00', endTime: '11:00' }, // Wednesday - Lecture 2
                { startTime: '11:00', endTime: '12:00' }, // Thursday - Lecture 3
                { startTime: '12:00', endTime: '13:00' }  // Friday - Lecture 4
            ]
        });
        await lectureConfig.save();
        console.log('✅ Lecture session configuration created (4 lectures/week)');

        // Create lab configuration (1 lab per week on Monday)
        const labConfig = new SessionConfiguration({
            subjectId: dsSubject._id,
            classId: aidsB1Class._id,
            schoolId: admin._id,
            sessionType: 'lab',
            sessionsPerWeek: 1, // 1 lab per week
            sessionDuration: 120, // 2 hours
            totalSessions: 15, // 1 lab × 15 weeks = 15 labs
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-05-15'),
            scheduledDays: ['Monday'], // Lab on Monday
            timeSlots: [{
                startTime: '14:00',
                endTime: '16:00' // 2-hour lab session
            }]
        });
        await labConfig.save();
        console.log('✅ Lab session configuration created (1 lab/week on Monday)');

        console.log('\n🎉 AIDS B1 class setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Class: ${aidsB1Class.sclassName}`);
        console.log(`   Subject: ${dsSubject.subName} (${dsSubject.subCode})`);
        console.log(`   Teacher: ${dsTeacher.name}`);
        console.log(`   Students: ${studentsData.length} total`);
        console.log(`   Admin: ${admin.name}`);
        console.log('\n📅 Weekly Schedule:');
        console.log('   Monday: Lab (2:00-4:00 PM)');
        console.log('   Tuesday: Lecture 1 (9:00-10:00 AM)');
        console.log('   Wednesday: Lecture 2 (10:00-11:00 AM)');
        console.log('   Thursday: Lecture 3 (11:00-12:00 PM)');
        console.log('   Friday: Lecture 4 (12:00-1:00 PM)');
        console.log('\n📈 Session Summary:');
        console.log('   Total Sessions: 75 (60 lectures + 15 labs)');

        console.log('\n🔑 Login Credentials:');
        console.log('   Admin: admin@university.com / password123');
        console.log('   Teacher: ds.teacher@university.com / password123');
        console.log('   Students: Use roll number as username / password123');

        console.log('\n📝 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Login as admin to manage the system');
        console.log('   3. Login as teacher to mark attendance');
        console.log('   4. Students can login to view their attendance');

    } catch (error) {
        console.error('❌ Error setting up AIDS B1 class:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

// Run the setup
if (require.main === module) {
    setupAIDSB1Class();
}

module.exports = setupAIDSB1Class;