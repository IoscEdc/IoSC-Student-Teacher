/**
 * Test session options endpoint
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SessionConfiguration = require('../models/sessionConfigurationSchema');

async function testSessionOptions() {
    try {
        console.log('🧪 Testing session options...');

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        const classId = '6902126bf91c442b648f6b95';
        const subjectId = '6902126bf91c442b648f6b9c';

        console.log('\n1️⃣ Testing session configuration lookup...');
        const sessionConfigs = await SessionConfiguration.find({
            classId: classId,
            subjectId: subjectId
        });

        console.log(`Found ${sessionConfigs.length} session configurations:`);
        sessionConfigs.forEach(config => {
            console.log(`  - Type: ${config.sessionType}, Sessions/week: ${config.sessionsPerWeek}`);
        });

        console.log('\n2️⃣ Generating session options...');
        const sessionOptions = [];
        
        sessionConfigs.forEach(config => {
            if (config.sessionType === 'lecture') {
                // Generate lecture options based on sessions per week
                for (let i = 1; i <= config.sessionsPerWeek; i++) {
                    sessionOptions.push({
                        value: `Lecture ${i}`,
                        label: `Lecture ${i}`,
                        type: 'lecture',
                        duration: config.sessionDuration
                    });
                }
            } else {
                // Add other session types
                const sessionName = config.sessionType.charAt(0).toUpperCase() + config.sessionType.slice(1);
                sessionOptions.push({
                    value: sessionName,
                    label: sessionName,
                    type: config.sessionType,
                    duration: config.sessionDuration
                });
            }
        });

        console.log('\n📋 Generated session options:');
        sessionOptions.forEach(option => {
            console.log(`  - ${option.label} (${option.type}, ${option.duration}min)`);
        });

        console.log('\n✅ Session options test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

testSessionOptions();