require('dotenv').config();
const mongoose = require('mongoose');
const SessionConfiguration = require('./models/sessionConfigurationSchema');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  console.log('✅ Connected to database');
  
  const classId = '6902126bf91c442b648f6b95';
  const subjectId = '6902126bf91c442b648f6b9c';
  
  console.log('🔍 Looking for session configurations...');
  console.log('Class ID:', classId);
  console.log('Subject ID:', subjectId);
  
  const configs = await SessionConfiguration.find({
    classId: classId,
    subjectId: subjectId
  });
  
  console.log('Found', configs.length, 'session configurations:');
  configs.forEach((config, index) => {
    console.log(`${index + 1}. Type: ${config.sessionType}, Sessions/week: ${config.sessionsPerWeek}, Duration: ${config.sessionDuration}`);
  });
  
  if (configs.length === 0) {
    console.log('❌ No session configurations found! This is the problem.');
    console.log('Let me check what session configurations exist in the database...');
    
    const allConfigs = await SessionConfiguration.find({});
    console.log('Total session configurations in database:', allConfigs.length);
    
    if (allConfigs.length > 0) {
      console.log('Sample configuration:');
      console.log(JSON.stringify(allConfigs[0], null, 2));
    }
  }
  
  mongoose.disconnect();
}).catch(console.error);