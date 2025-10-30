const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const AttendanceRecord = require('./models/attendanceRecordSchema');
const AttendanceSummary = require('./models/attendanceSummarySchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');

async function debugAttendanceData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const studentId = '690213114a29841c1f2a63ac';
        console.log(`🔍 Debugging attendance data for student: ${studentId}\n`);

        // Check attendance records
        console.log('📋 Attendance Records:');
        console.log('-'.repeat(50));
        
        const records = await AttendanceRecord.find({ studentId }).sort({ date: 1 });
        console.log(`Total records found: ${records.length}`);
        
        if (records.length > 0) {
            console.log('\nSample records:');
            records.slice(0, 5).forEach((record, index) => {
                console.log(`${index + 1}. Date: ${record.date.toISOString().split('T')[0]}, Status: ${record.status}, Session: ${record.session}`);
            });
            
            // Count by status
            const statusCounts = records.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\nStatus breakdown:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}`);
            });
        }

        // Check attendance summaries
        console.log('\n📊 Attendance Summaries:');
        console.log('-'.repeat(50));
        
        const summaries = await AttendanceSummary.find({ studentId })
            .populate('subjectId', 'subName')
            .populate('classId', 'sclassName');
            
        console.log(`Total summaries found: ${summaries.length}`);
        
        if (summaries.length > 0) {
            summaries.forEach((summary, index) => {
                console.log(`${index + 1}. Subject: ${summary.subjectId?.subName || 'Unknown'}`);
                console.log(`   Total Sessions: ${summary.totalSessions}`);
                console.log(`   Present: ${summary.presentCount}`);
                console.log(`   Absent: ${summary.absentCount}`);
                console.log(`   Late: ${summary.lateCount}`);
                console.log(`   Excused: ${summary.excusedCount}`);
                console.log(`   Percentage: ${summary.attendancePercentage}%`);
                console.log('');
            });
        }

        // Check if there's a mismatch
        if (records.length > 0 && summaries.length > 0) {
            const summary = summaries[0];
            const actualPresent = records.filter(r => r.status === 'present').length;
            const actualAbsent = records.filter(r => r.status === 'absent').length;
            const actualTotal = records.length;
            
            console.log('🔍 Data Verification:');
            console.log('-'.repeat(30));
            console.log(`Records total: ${actualTotal}`);
            console.log(`Records present: ${actualPresent}`);
            console.log(`Records absent: ${actualAbsent}`);
            console.log(`Summary total: ${summary.totalSessions}`);
            console.log(`Summary present: ${summary.presentCount}`);
            console.log(`Summary absent: ${summary.absentCount}`);
            
            if (actualTotal !== summary.totalSessions) {
                console.log('⚠️ MISMATCH: Record count does not match summary total sessions');
            }
            
            if (actualPresent !== summary.presentCount) {
                console.log('⚠️ MISMATCH: Present count does not match');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

debugAttendanceData();