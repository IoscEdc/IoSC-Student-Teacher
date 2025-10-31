/**
 * Setup session configurations for all subjects and classes
 * This script creates SessionConfiguration records that define what session types
 * are available for each subject-class combination
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SessionConfiguration = require('../models/sessionConfigurationSchema');
const Subject = require('../models/subjectSchema');
const Sclass = require('../models/sclassSchema');
const Admin = require('../models/adminSchema');

async function setupSessionConfigurations() {
    try {
        console.log('🚀 Setting up session configurations...');

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Get all subjects and classes
        const subjects = await Subject.find({});
        const classes = await Sclass.find({});
        const admin = await Admin.findOne({}); // Get first admin as school

        if (!admin) {
            throw new Error('No admin found in database');
        }

        console.log(`📚 Found ${subjects.length} subjects and ${classes.length} classes`);

        // Clear existing configurations
        await SessionConfiguration.deleteMany({});
        console.log('🧹 Cleared existing session configurations');

        const configurations = [];

        // Create session configurations for each subject-class combination
        for (const subject of subjects) {
            for (const sclass of classes) {
                // Determine session types based on subject name/type
                const subjectName = subject.subName.toLowerCase();
                
                // Default configuration for all subjects
                const baseConfig = {
                    subjectId: subject._id,
                    classId: sclass._id,
                    schoolId: admin._id,
                    isActive: true,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-12-31'),
                    scheduledDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    timeSlots: [{
                        startTime: '09:00',
                        endTime: '10:00'
                    }]
                };

                // Add lecture sessions (most subjects have lectures)
                configurations.push({
                    ...baseConfig,
                    sessionType: 'lecture',
                    sessionsPerWeek: 3, // 3 lectures per week
                    sessionDuration: 60,
                    totalSessions: 45,
                    sessionNamingPattern: 'Lecture {number}'
                });

                // Add lab sessions for technical subjects
                if (subjectName.includes('lab') || 
                    subjectName.includes('programming') || 
                    subjectName.includes('computer') ||
                    subjectName.includes('data structures') ||
                    subjectName.includes('software') ||
                    subjectName.includes('database')) {
                    
                    configurations.push({
                        ...baseConfig,
                        sessionType: 'lab',
                        sessionsPerWeek: 1, // 1 lab per week
                        sessionDuration: 120, // 2 hours
                        totalSessions: 15,
                        sessionNamingPattern: 'Lab {number}'
                    });
                }

                // Add tutorial sessions for theory subjects
                if (subjectName.includes('mathematics') || 
                    subjectName.includes('physics') || 
                    subjectName.includes('theory') ||
                    subjectName.includes('algorithm')) {
                    
                    configurations.push({
                        ...baseConfig,
                        sessionType: 'tutorial',
                        sessionsPerWeek: 1, // 1 tutorial per week
                        sessionDuration: 60,
                        totalSessions: 15,
                        sessionNamingPattern: 'Tutorial {number}'
                    });
                }
            }
        }

        // Insert all configurations
        if (configurations.length > 0) {
            await SessionConfiguration.insertMany(configurations);
            console.log(`✅ Created ${configurations.length} session configurations`);
        }

        // Display summary
        const summary = await SessionConfiguration.aggregate([
            {
                $group: {
                    _id: '$sessionType',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Session Configuration Summary:');
        summary.forEach(item => {
            console.log(`  ${item._id}: ${item.count} configurations`);
        });

        // Test the session options endpoint
        console.log('\n🧪 Testing session options for AIDS B1 - Data Structures...');
        const testClassId = '6902126bf91c442b648f6b95';
        const testSubjectId = '6902126bf91c442b648f6b9c';
        
        const testConfigs = await SessionConfiguration.find({
            classId: testClassId,
            subjectId: testSubjectId,
            isActive: true
        });

        console.log(`Found ${testConfigs.length} configurations for test class/subject:`);
        testConfigs.forEach(config => {
            console.log(`  - ${config.sessionType}: ${config.sessionsPerWeek} sessions/week`);
        });

    } catch (error) {
        console.error('❌ Error setting up session configurations:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

setupSessionConfigurations();