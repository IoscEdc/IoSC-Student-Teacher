/**
 * Test login functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');

async function testLogin() {
    try {
        console.log('🧪 Testing login functionality...');
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Database connected');

        // Test admin login
        console.log('\n👑 Testing Admin Login:');
        const admin = await Admin.findOne({ email: 'admin@university.com' });
        if (admin) {
            console.log('  Admin found:', admin.email);
            console.log('  Name:', admin.name);
            console.log('  Role:', admin.role);
            
            const isValidPassword = await bcrypt.compare('password123', admin.password);
            console.log('  Password valid:', isValidPassword);
            
            if (isValidPassword) {
                const token = jwt.sign(
                    { 
                        id: admin._id.toString(),
                        role: admin.role,
                        email: admin.email
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );
                console.log('  Token generated:', token.substring(0, 50) + '...');
            }
        } else {
            console.log('  ❌ Admin not found');
        }

        // Test teacher login
        console.log('\n👨‍🏫 Testing Teacher Login:');
        const teacher = await Teacher.findOne({ email: 'ds.teacher@university.com' });
        if (teacher) {
            console.log('  Teacher found:', teacher.email);
            console.log('  Name:', teacher.name);
            console.log('  Role:', teacher.role);
            
            const isValidPassword = await bcrypt.compare('password123', teacher.password);
            console.log('  Password valid:', isValidPassword);
            
            if (isValidPassword) {
                const token = jwt.sign(
                    { 
                        id: teacher._id.toString(),
                        role: teacher.role,
                        email: teacher.email
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );
                console.log('  Token generated:', token.substring(0, 50) + '...');
            }
        } else {
            console.log('  ❌ Teacher not found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

testLogin();