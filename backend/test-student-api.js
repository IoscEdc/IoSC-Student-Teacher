const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/studentSchema');
const SummaryService = require('./services/SummaryService');

async function testStudentAPI() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Find the student
        const student = await Student.findOne({ rollNum: 59, name: 'WAQAR AKHTAR' });
        console.log('👤 Student ID:', student._id);

        // Test the summary service directly
        const summaryService = new SummaryService();
        const summary = await summaryService.getStudentAttendanceSummary(student._id.toString());
        
        console.log('📊 Summary data:');
        console.log(JSON.stringify(summary, null, 2));

        if (summary.length > 0) {
            console.log('\n🔍 First subject details:');
            console.log('Subject:', summary[0].subjectId);
            console.log('Teacher info available:', !!summary[0].subjectId?.teacher);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testStudentAPI();