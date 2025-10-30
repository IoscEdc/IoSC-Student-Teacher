const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');
const Teacher = require('./models/teacherSchema');
const Admin = require('./models/adminSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');

async function createSampleAttendanceData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find WAQAR AKHTAR student
        const student = await Student.findOne({ rollNum: 59, name: 'WAQAR AKHTAR' });
        
        if (!student) {
            console.log('❌ Student WAQAR AKHTAR with roll 59 not found');
            return;
        }

        console.log(`👤 Found student: ${student.name} (ID: ${student._id})`);

        // Find the student's class
        const studentClass = await Sclass.findById(student.sclassName);
        if (!studentClass) {
            console.log('❌ Student class not found');
            return;
        }

        console.log(`📚 Student class: ${studentClass.sclassName}`);

        // Find a teacher and admin for the records
        const teacher = await Teacher.findOne({});
        const admin = await Admin.findOne({});
        
        if (!teacher) {
            console.log('❌ No teacher found in database');
            return;
        }
        
        if (!admin) {
            console.log('❌ No admin found in database');
            return;
        }

        console.log(`👨‍🏫 Using teacher: ${teacher.name}`);
        console.log(`👨‍💼 Using admin: ${admin.adminName}`);

        // Find subjects for this class
        const subjects = await Subject.find({ sclassName: student.sclassName }).limit(4);
        
        if (subjects.length === 0) {
            console.log('❌ No subjects found for this class');
            return;
        }

        console.log(`📖 Found ${subjects.length} subjects for the class`);

        // Clear existing attendance for this student
        await AttendanceRecord.deleteMany({ studentId: student._id });
        console.log('🗑️ Cleared existing attendance records');

        // Create sample attendance data for each subject
        const attendanceRecords = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Start 30 days ago

        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            const subjectAttendance = [];
            
            // Create different attendance patterns for each subject
            let presentCount = 0;
            let totalSessions = 0;
            
            // Generate 15-20 sessions per subject over the last 30 days
            const sessionsCount = 15 + Math.floor(Math.random() * 6); // 15-20 sessions
            
            for (let day = 0; day < 30; day += 2) { // Every 2 days
                if (totalSessions >= sessionsCount) break;
                
                const sessionDate = new Date(startDate);
                sessionDate.setDate(startDate.getDate() + day);
                
                // Skip weekends
                if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) continue;
                
                // Different attendance patterns for different subjects
                let isPresent;
                switch (i) {
                    case 0: // Mathematics - Good attendance (85%)
                        isPresent = Math.random() > 0.15;
                        break;
                    case 1: // Physics - Average attendance (75%)
                        isPresent = Math.random() > 0.25;
                        break;
                    case 2: // Chemistry - Poor attendance (65%)
                        isPresent = Math.random() > 0.35;
                        break;
                    case 3: // Computer Science - Excellent attendance (92%)
                        isPresent = Math.random() > 0.08;
                        break;
                    default:
                        isPresent = Math.random() > 0.2;
                }
                
                if (isPresent) presentCount++;
                totalSessions++;
                
                const attendanceRecord = new AttendanceRecord({
                    studentId: student._id,
                    subjectId: subject._id,
                    classId: student.sclassName,
                    teacherId: teacher._id,
                    schoolId: admin._id,
                    date: sessionDate,
                    session: 'Lecture 1', // Use valid enum value
                    status: isPresent ? 'Present' : 'Absent', // Use proper case as per enum
                    markedBy: teacher._id,
                    markedAt: sessionDate
                });
                
                attendanceRecords.push(attendanceRecord);
            }
            
            console.log(`📊 ${subject.subName}: ${presentCount}/${totalSessions} sessions (${((presentCount/totalSessions)*100).toFixed(1)}%)`);
        }

        // Save all attendance records
        await AttendanceRecord.insertMany(attendanceRecords);
        console.log(`✅ Created ${attendanceRecords.length} attendance records`);

        // Verify the data
        const totalRecords = await AttendanceRecord.countDocuments({ studentId: student._id });
        console.log(`📈 Total attendance records for ${student.name}: ${totalRecords}`);

        // Show summary by subject
        console.log('\n📊 Attendance Summary:');
        for (const subject of subjects) {
            const subjectRecords = await AttendanceRecord.find({ 
                studentId: student._id, 
                subjectId: subject._id 
            });
            
            const totalSessions = subjectRecords.length;
            const presentSessions = subjectRecords.filter(r => r.status === 'Present').length;
            const percentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
            
            console.log(`${subject.subName}: ${presentSessions}/${totalSessions} (${percentage.toFixed(1)}%)`);
        }

        console.log('\n🎉 Sample attendance data created successfully!');
        console.log('📱 You can now test the enhanced attendance dashboard with real data.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createSampleAttendanceData();