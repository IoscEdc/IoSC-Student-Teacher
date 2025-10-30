/**
 * Test API functionality directly without middleware
 */

require('dotenv').config();
const mongoose = require('mongoose');
const {
    getClassStudentsForAttendance,
    markAttendance,
    getSessionOptions
} = require('../controllers/attendanceController');

async function testDirectAPI() {
    try {
        console.log('🧪 Testing API functions directly...');

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Mock request and response objects
        const mockReq = {
            params: {},
            query: {},
            body: {},
            user: {
                id: '6902126af91c442b648f6b8d',
                role: 'Admin',
                name: 'Test Admin'
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response ${code}:`, data);
                    return data;
                }
            }),
            json: (data) => {
                console.log('Response:', data);
                return data;
            }
        };

        console.log('\n1️⃣ Testing getSessionOptions...');
        try {
            mockReq.query = {
                classId: '6902126bf91c442b648f6b95',
                subjectId: '6902126bf91c442b648f6b9c'
            };
            
            await getSessionOptions(mockReq, mockRes);
        } catch (error) {
            console.log('❌ getSessionOptions failed:', error.message);
        }

        console.log('\n2️⃣ Testing getClassStudentsForAttendance...');
        try {
            mockReq.params = {
                classId: '6902126bf91c442b648f6b95'
            };
            mockReq.query = {
                subjectId: '6902126bf91c442b648f6b9c'
            };
            
            await getClassStudentsForAttendance(mockReq, mockRes);
        } catch (error) {
            console.log('❌ getClassStudentsForAttendance failed:', error.message);
        }

        console.log('\n3️⃣ Testing markAttendance...');
        try {
            mockReq.body = {
                classId: '6902126bf91c442b648f6b95',
                subjectId: '6902126bf91c442b648f6b9c',
                date: new Date().toISOString().split('T')[0],
                session: 'Lecture 1',
                studentAttendance: [
                    {
                        studentId: '6902129bb949840291358b9f',
                        status: 'present'
                    }
                ]
            };
            
            await markAttendance(mockReq, mockRes);
        } catch (error) {
            console.log('❌ markAttendance failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

testDirectAPI();