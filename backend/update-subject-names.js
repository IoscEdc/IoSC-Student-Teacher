const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('./models/subjectSchema');

async function updateSubjectNames() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Define the subject name mappings
        const subjectUpdates = [
            {
                oldName: 'Mathematics',
                oldCode: 'MAT101',
                newName: 'Essential Mathematics for AI',
                newCode: 'AI-MATH101'
            },
            {
                oldName: 'Physics',
                oldCode: 'PHY101', 
                newName: 'Operating Systems',
                newCode: 'OS101'
            },
            {
                oldName: 'Chemistry',
                oldCode: 'CHE101',
                newName: 'Database Management System (DBMS)',
                newCode: 'DBMS101'
            },
            {
                oldName: 'Computer Science',
                oldCode: 'COM101',
                newName: 'Foundation of Computer Science',
                newCode: 'FCS101'
            },
            {
                oldName: 'Data Structures',
                oldCode: 'DS101',
                newName: 'Data Structures',
                newCode: 'DS101' // Keep this one the same
            }
        ];

        console.log('🔄 Updating subject names...');

        for (const update of subjectUpdates) {
            // Find the subject by old name and code
            const subject = await Subject.findOne({
                subName: update.oldName,
                subCode: update.oldCode
            });

            if (subject) {
                // Update the subject
                const result = await Subject.updateOne(
                    { _id: subject._id },
                    {
                        $set: {
                            subName: update.newName,
                            subCode: update.newCode
                        }
                    }
                );

                console.log(`✅ Updated: "${update.oldName}" → "${update.newName}"`);
                console.log(`   Code: "${update.oldCode}" → "${update.newCode}"`);
            } else {
                console.log(`⚠️  Subject not found: "${update.oldName}" (${update.oldCode})`);
            }
        }

        // Verify the updates
        console.log('\n📚 Updated subjects:');
        const updatedSubjects = await Subject.find({
            subCode: { $in: ['AI-MATH101', 'OS101', 'DBMS101', 'FCS101', 'DS101'] }
        }).lean();

        updatedSubjects.forEach((subject, index) => {
            console.log(`   ${index + 1}. ${subject.subName} (${subject.subCode})`);
        });

        console.log('\n🎉 Subject names updated successfully!');
        console.log('💡 Refresh your attendance dashboard to see the new names.');

    } catch (error) {
        console.error('❌ Error updating subjects:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

updateSubjectNames();