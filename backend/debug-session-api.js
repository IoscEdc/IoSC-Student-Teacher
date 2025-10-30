require('dotenv').config();
const mongoose = require('mongoose');

// Test the getSessionOptions function directly
async function testSessionOptions() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to database');
    
    // Import the controller
    const { getSessionOptions } = require('./controllers/attendanceController');
    
    // Mock request and response objects
    const req = {
      query: {
        classId: '6902126bf91c442b648f6b95',
        subjectId: '6902126bf91c442b648f6b9c'
      },
      user: {
        id: '6902126bf91c442b648f6ba0',
        role: 'Teacher'
      }
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log('✅ Response status:', code);
          console.log('✅ Response data:', JSON.stringify(data, null, 2));
        }
      })
    };
    
    console.log('🧪 Testing getSessionOptions function...');
    await getSessionOptions(req, res);
    
  } catch (error) {
    console.log('❌ Error in getSessionOptions:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testSessionOptions();