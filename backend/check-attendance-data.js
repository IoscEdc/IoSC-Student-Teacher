const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');
const AttendanceSummary = require('./models/attendanceSummarySchema');

async function checkAttendanceData() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Find the student
        const student = await Student.findOne({ rollNum: 59, name: 'WAQAR AKHTAR' });
        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log(`👤 Student: ${student.name} (ID: ${student._id})`);

        // Check attendance records
        const recordCount = await AttendanceRecord.countDocuments({ studentId: student._id });
        console.log(`📊 Attendance Records: ${recordCount}`);

        if (recordCount > 0) {
            const sampleRecord = await AttendanceRecord.findOne({ studentId: student._id });
            console.log('📝 Sample Record:', {
                date: sampleRecord.date,
                status: sampleRecord.status,
                subjectId: sampleRecord.subjectId
            });
        }

        // Check attendance summaries
        const summaryCount = await AttendanceSummary.countDocuments({ studentId: student._id });
        console.log(`📈 Attendance Summaries: ${summaryCount}`);

        if (summaryCount === 0) {
            console.log('⚠️ No attendance summaries found - this is why the API returns empty data');
            console.log('💡 Need to generate summaries from attendance records');
            
            // Let's create summaries manually
            const records = await AttendanceRecord.find({ studentId: student._id });
            const recordsBySubject = {};
            
            records.forEach(record => {
                const subjectId = record.subjectId.toString();
                if (!recordsBySubject[subjectId]) {
                    recordsBySubject[subjectId] = [];
                }
                recordsBySubject[subjectId].push(record);
            });

            console.log(`📚 Found records for ${Object.keys(recordsBySubject).length} subjects`);

            for (const [subjectId, subjectRecords] of Object.entries(recordsBySubject)) {
                const totalSessions = subjectRecords.length;
                const presentCount = subjectRecords.filter(r => r.status === 'present').length;
                const absentCount = subjectRecords.filter(r => r.status === 'absent').length;
                const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

                const summary = new AttendanceSummary({
                    studentId: student._id,
                    subjectId: subjectId,
                    classId: subjectRecords[0].classId,
                    totalSessions,
                    presentCount,
                    absentCount,
                    lateCount: 0,
                    excusedCount: 0,
                    attendancePercentage,
                    schoolId: subjectRecords[0].schoolId
                });

                await summary.save();
                console.log(`✅ Created summary for subject ${subjectId}: ${presentCount}/${totalSessions} (${attendancePercentage.toFixed(1)}%)`);
            }
        } else {
            const summaries = await AttendanceSummary.find({ studentId: student._id })
                .populate('subjectId', 'subName');
            
            console.log('📈 Existing Summaries:');
            summaries.forEach(summary => {
                console.log(`  - ${summary.subjectId?.subName || 'Unknown'}: ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%)`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkAttendanceData();