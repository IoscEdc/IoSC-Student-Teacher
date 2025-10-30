const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');
const Teacher = require('./models/teacherSchema');
const Admin = require('./models/adminSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');

async function createComprehensiveSampleData() {
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

        console.log(`👨‍🏫 Using teacher: ${teacher.name}`);

        // Create additional subjects if needed
        const subjectNames = [
            'Mathematics',
            'Physics', 
            'Chemistry',
            'Computer Science',
            'Data Structures'
        ];

        const subjects = [];
        
        for (const subjectName of subjectNames) {
            let subject = await Subject.findOne({ 
                subName: subjectName, 
                sclassName: student.sclassName 
            });
            
            if (!subject) {
                subject = new Subject({
                    subName: subjectName,
                    subCode: subjectName.substring(0, 3).toUpperCase() + '101',
                    sessions: 60,
                    sclassName: student.sclassName,
                    school: admin ? admin._id : null,
                    teacher: teacher._id
                });
                await subject.save();
                console.log(`➕ Created subject: ${subjectName}`);
            }
            subjects.push(subject);
        }

        console.log(`📖 Working with ${subjects.length} subjects`);

        // Clear existing attendance for this student
        await AttendanceRecord.deleteMany({ studentId: student._id });
        console.log('🗑️ Cleared existing attendance records');

        // Create sample attendance data for each subject
        const attendanceRecords = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 45); // Start 45 days ago

        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            
            // Create different attendance patterns for each subject
            let presentCount = 0;
            let totalSessions = 0;
            
            // Generate 20-25 sessions per subject over the last 45 days
            const sessionsCount = 20 + Math.floor(Math.random() * 6); // 20-25 sessions
            
            for (let day = 0; day < 45; day++) {
                if (totalSessions >= sessionsCount) break;
                
                const sessionDate = new Date(startDate);
                sessionDate.setDate(startDate.getDate() + day);
                
                // Skip weekends
                if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) continue;
                
                // Skip some random days to make it realistic
                if (Math.random() < 0.3) continue; // 30% chance to skip a day
                
                // Different attendance patterns for different subjects
                let isPresent;
                switch (i) {
                    case 0: // Mathematics - Good attendance (88%)
                        isPresent = Math.random() > 0.12;
                        break;
                    case 1: // Physics - Average attendance (78%)
                        isPresent = Math.random() > 0.22;
                        break;
                    case 2: // Chemistry - Poor attendance (68%)
                        isPresent = Math.random() > 0.32;
                        break;
                    case 3: // Computer Science - Excellent attendance (94%)
                        isPresent = Math.random() > 0.06;
                        break;
                    case 4: // Data Structures - Very good attendance (85%)
                        isPresent = Math.random() > 0.15;
                        break;
                    default:
                        isPresent = Math.random() > 0.2;
                }
                
                if (isPresent) presentCount++;
                totalSessions++;
                
                // Vary the session types
                const sessions = ['Lecture 1', 'Lecture 2', 'Lab', 'Tutorial'];
                const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
                
                const attendanceRecord = new AttendanceRecord({
                    studentId: student._id,
                    subjectId: subject._id,
                    classId: student.sclassName,
                    teacherId: teacher._id,
                    schoolId: admin ? admin._id : null,
                    date: sessionDate,
                    session: randomSession,
                    status: isPresent ? 'present' : 'absent',
                    markedBy: teacher._id,
                    markedAt: sessionDate
                });
                
                attendanceRecords.push(attendanceRecord);
            }
            
            console.log(`📊 ${subject.subName}: ${presentCount}/${totalSessions} sessions (${((presentCount/totalSessions)*100).toFixed(1)}%)`);
        }

        // Save all attendance records
        if (attendanceRecords.length > 0) {
            await AttendanceRecord.insertMany(attendanceRecords);
            console.log(`✅ Created ${attendanceRecords.length} attendance records`);
        }

        // Verify the data
        const totalRecords = await AttendanceRecord.countDocuments({ studentId: student._id });
        console.log(`📈 Total attendance records for ${student.name}: ${totalRecords}`);

        // Show summary by subject
        console.log('\n📊 Final Attendance Summary:');
        for (const subject of subjects) {
            const subjectRecords = await AttendanceRecord.find({ 
                studentId: student._id, 
                subjectId: subject._id 
            });
            
            const totalSessions = subjectRecords.length;
            const presentSessions = subjectRecords.filter(r => r.status === 'present').length;
            const percentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
            
            console.log(`${subject.subName}: ${presentSessions}/${totalSessions} (${percentage.toFixed(1)}%)`);
        }

        console.log('\n🎉 Comprehensive sample attendance data created successfully!');
        console.log('📱 You can now test the enhanced attendance dashboard with realistic data.');
        console.log('🔄 Please refresh your browser to see the updated data.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createComprehensiveSampleData();