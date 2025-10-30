const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const AttendanceRecord = require('./models/attendanceRecordSchema');
const Subject = require('./models/subjectSchema'); // Import Subject model
const Sclass = require('./models/sclassSchema'); // Import Sclass model
const SummaryService = require('./services/SummaryService');

async function generateAttendanceSummaries() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find WAQAR AKHTAR's student ID
        const studentId = '690213114a29841c1f2a63ac'; // From previous test
        console.log(`👤 Processing summaries for student ID: ${studentId}`);

        // Find all unique combinations of student, subject, and class from attendance records
        const combinations = await AttendanceRecord.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: {
                        studentId: '$studentId',
                        subjectId: '$subjectId',
                        classId: '$classId'
                    }
                }
            }
        ]);

        console.log(`📊 Found ${combinations.length} student-subject-class combinations`);

        // Use the SummaryService instance
        const summaryService = SummaryService;

        // Update summaries for each combination
        const results = [];
        for (const combination of combinations) {
            const { studentId, subjectId, classId } = combination._id;
            
            try {
                console.log(`🔄 Updating summary for subject: ${subjectId}`);
                
                const summary = await summaryService.updateStudentSummary(
                    studentId.toString(),
                    subjectId.toString(), 
                    classId.toString()
                );
                
                results.push(summary);
                console.log(`✅ Updated summary: ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%)`);
                
            } catch (error) {
                console.error(`❌ Error updating summary for ${subjectId}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully generated ${results.length} attendance summaries!`);

        // Test the getStudentAttendanceSummary function
        console.log('\n🧪 Testing getStudentAttendanceSummary...');
        const studentSummaries = await summaryService.getStudentAttendanceSummary(studentId);
        
        console.log(`📋 Retrieved ${studentSummaries.length} summaries:`);
        studentSummaries.forEach((summary, index) => {
            console.log(`${index + 1}. ${summary.subjectId?.subName || 'Unknown'}: ${summary.presentCount}/${summary.totalSessions} (${summary.attendancePercentage.toFixed(1)}%)`);
        });

        console.log('\n✅ Summary generation completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

generateAttendanceSummaries();