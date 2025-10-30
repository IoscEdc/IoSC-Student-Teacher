const mongoose = require('mongoose');
require('dotenv').config();

// Import all required models
const Student = require('./models/studentSchema');
const Subject = require('./models/subjectSchema');
const Sclass = require('./models/sclassSchema');
const Teacher = require('./models/teacherSchema');
const Admin = require('./models/adminSchema');
const AttendanceRecord = require('./models/attendanceRecordSchema');
const AttendanceSummary = require('./models/attendanceSummarySchema');

async function quickFixSummaries() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        const studentId = '690213114a29841c1f2a63ac';
        
        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log(`👤 Student: ${student.name}`);

        // Get attendance records
        const records = await AttendanceRecord.find({ studentId: studentId });
        console.log(`📊 Found ${records.length} attendance records`);

        if (records.length === 0) {
            console.log('❌ No attendance records found');
            return;
        }

        // Clear existing summaries
        await AttendanceSummary.deleteMany({ studentId: studentId });
        console.log('🗑️ Cleared existing summaries');

        // Group by subject
        const subjectGroups = {};
        records.forEach(record => {
            const subjectId = record.subjectId.toString();
            if (!subjectGroups[subjectId]) {
                subjectGroups[subjectId] = {
                    subjectId: record.subjectId,
                    classId: record.classId,
                    schoolId: record.schoolId,
                    records: []
                };
            }
            subjectGroups[subjectId].records.push(record);
        });

        console.log(`📚 Processing ${Object.keys(subjectGroups).length} subjects`);

        // Create summaries
        for (const [subjectId, group] of Object.entries(subjectGroups)) {
            const subjectRecords = group.records;
            
            const totalSessions = subjectRecords.length;
            const presentCount = subjectRecords.filter(r => r.status === 'present').length;
            const absentCount = subjectRecords.filter(r => r.status === 'absent').length;
            const lateCount = subjectRecords.filter(r => r.status === 'late').length;
            const excusedCount = subjectRecords.filter(r => r.status === 'excused').length;
            
            const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

            const summary = new AttendanceSummary({
                studentId: studentId,
                subjectId: group.subjectId,
                classId: group.classId,
                schoolId: group.schoolId,
                totalSessions,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                attendancePercentage
            });

            await summary.save();
            console.log(`✅ Created summary for subject ${subjectId}: ${presentCount}/${totalSessions} (${attendancePercentage.toFixed(1)}%)`);
        }

        // Verify summaries were created
        const summaryCount = await AttendanceSummary.countDocuments({ studentId: studentId });
        console.log(`📈 Total summaries created: ${summaryCount}`);

        // Test the API query that the frontend uses
        console.log('\n🔍 Testing API query...');
        const summaries = await AttendanceSummary.find({ studentId: new mongoose.Types.ObjectId(studentId) })
            .populate('subjectId', 'subName subCode teacher')
            .populate({
                path: 'subjectId',
                populate: {
                    path: 'teacher',
                    select: 'name teachSubject'
                }
            })
            .populate('classId', 'sclassName')
            .lean();

        console.log(`📊 API query returned ${summaries.length} summaries`);
        summaries.forEach(summary => {
            console.log(`  - ${summary.subjectId?.subName || 'Unknown'}: ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%)`);
        });

        console.log('\n🎉 Summaries created successfully!');
        console.log('🔄 Please refresh the attendance dashboard to see the data.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

quickFixSummaries();