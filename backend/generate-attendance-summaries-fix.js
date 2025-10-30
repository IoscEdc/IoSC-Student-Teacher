const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');
const AttendanceSummary = require('./models/attendanceSummarySchema');

async function generateAttendanceSummaries() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Find the student
        const student = await Student.findOne({ rollNum: 59, name: 'WAQAR AKHTAR' });
        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log(`👤 Processing summaries for: ${student.name} (ID: ${student._id})`);

        // Get all attendance records for this student
        const records = await AttendanceRecord.find({ studentId: student._id })
            .populate('subjectId')
            .populate('classId');

        console.log(`📊 Found ${records.length} attendance records`);

        // Group records by subject
        const recordsBySubject = {};
        records.forEach(record => {
            const subjectId = record.subjectId._id.toString();
            if (!recordsBySubject[subjectId]) {
                recordsBySubject[subjectId] = {
                    subjectId: record.subjectId._id,
                    classId: record.classId._id,
                    records: []
                };
            }
            recordsBySubject[subjectId].records.push(record);
        });

        console.log(`📚 Found ${Object.keys(recordsBySubject).length} subjects`);

        // Clear existing summaries for this student
        await AttendanceSummary.deleteMany({ studentId: student._id });
        console.log('🗑️ Cleared existing summaries');

        // Generate summaries for each subject
        for (const [subjectId, data] of Object.entries(recordsBySubject)) {
            const subjectRecords = data.records;
            
            // Calculate statistics
            const totalSessions = subjectRecords.length;
            const presentCount = subjectRecords.filter(r => r.status === 'present').length;
            const absentCount = subjectRecords.filter(r => r.status === 'absent').length;
            const lateCount = subjectRecords.filter(r => r.status === 'late').length;
            const excusedCount = subjectRecords.filter(r => r.status === 'excused').length;
            
            const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

            // Create summary
            const summary = new AttendanceSummary({
                studentId: student._id,
                subjectId: data.subjectId,
                classId: data.classId,
                totalSessions,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                attendancePercentage,
                schoolId: student.school
            });

            await summary.save();
            
            console.log(`✅ Created summary for ${subjectRecords[0].subjectId.subName}: ${presentCount}/${totalSessions} (${attendancePercentage.toFixed(1)}%)`);
        }

        console.log('\n🎉 Attendance summaries generated successfully!');
        console.log('📱 The attendance dashboard should now display data properly.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

generateAttendanceSummaries();