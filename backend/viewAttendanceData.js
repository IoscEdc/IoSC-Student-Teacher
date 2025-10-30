const mongoose = require('mongoose');
require('dotenv').config();

// Import the models
const AttendanceRecord = require('./models/attendanceRecordSchema');
const Student = require('./models/studentSchema');
const Teacher = require('./models/teacherSchema');

async function viewAttendanceData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('📊 Connected to MongoDB');

        // Query recent attendance records
        const recentRecords = await AttendanceRecord.find({
            classId: '6902126bf91c442b648f6b95', // AIDS B1
            subjectId: '6902126bf91c442b648f6b9c'  // Data Structures
        })
        .populate('studentId', 'name rollNum')
        .populate('teacherId', 'name')
        .sort({ markedAt: -1 })
        .limit(10);

        console.log('\n🎯 Recent Attendance Records:');
        console.log('================================');
        
        recentRecords.forEach((record, index) => {
            console.log(`${index + 1}. ${record.studentId?.name} (${record.studentId?.rollNum})`);
            console.log(`   Status: ${record.status.toUpperCase()}`);
            console.log(`   Date: ${record.date.toDateString()}`);
            console.log(`   Session: ${record.session}`);
            console.log(`   Marked by: ${record.teacherId?.name}`);
            console.log(`   Time: ${record.markedAt.toLocaleString()}`);
            console.log('   ---');
        });

        // Get summary for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayRecords = await AttendanceRecord.find({
            classId: '6902126bf91c442b648f6b95',
            subjectId: '6902126bf91c442b648f6b9c',
            date: { $gte: today }
        });

        const summary = {
            present: todayRecords.filter(r => r.status === 'present').length,
            absent: todayRecords.filter(r => r.status === 'absent').length,
            total: todayRecords.length
        };

        console.log('\n📈 Today\'s Summary:');
        console.log('==================');
        console.log(`Present: ${summary.present}`);
        console.log(`Absent: ${summary.absent}`);
        console.log(`Total Records: ${summary.total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
    }
}

// Run the script
viewAttendanceData();