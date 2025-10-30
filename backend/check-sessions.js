const mongoose = require('mongoose');
require('dotenv').config();

async function checkSessionConfigs() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
        
        const SessionConfiguration = require('./models/sessionConfigurationSchema');
        const configs = await SessionConfiguration.find({});
        
        console.log('Session configurations found:', configs.length);
        configs.forEach(config => {
            console.log('Config:', {
                classId: config.classId,
                subjectId: config.subjectId,
                sessionType: config.sessionType,
                sessionsPerWeek: config.sessionsPerWeek
            });
        });
        
        if (configs.length === 0) {
            console.log('❌ No session configurations found - this is likely the issue!');
            console.log('The system needs session configurations to work properly.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkSessionConfigs();