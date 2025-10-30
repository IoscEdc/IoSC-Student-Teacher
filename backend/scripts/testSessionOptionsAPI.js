/**
 * Test script for session options API endpoint
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function testSessionOptionsAPI() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        const classId = '6902126bf91c442b648f6b95'; // AIDS B1
        const subjectId = '6902126bf91c442b648f6b9c'; // Data Structures

        console.log('\n🔍 Testing session options API endpoint');
        
        // Import the controller function directly
        const { getSessionOptions } = require('../controllers/attendanceController');
        
        // Mock request and response objects
        const req = {
            query: { classId, subjectId },
            user: { id: '6902126bf91c442b648f6ba0', role: 'Teacher' }
        };
        
        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`\n📋 Response (${code}):`, JSON.stringify(data, null, 2));
                    return data;
                }
            }),
            json: (data) => {
                console.log('\n📋 Response:', JSON.stringify(data, null, 2));
                return data;
            }
        };

        console.log(`\n🧪 Testing session options for AIDS B1 - Data Structures`);
        console.log(`   Class ID: ${classId}`);
        console.log(`   Subject ID: ${subjectId}`);
        
        await getSessionOptions(req, res);

        console.log('\n✅ Session options API test completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

if (require.main === module) {
    testSessionOptionsAPI();
}

module.exports = testSessionOptionsAPI;