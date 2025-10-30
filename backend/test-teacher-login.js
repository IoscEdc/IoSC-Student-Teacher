const axios = require('axios');

async function testTeacherLogin() {
    try {
        console.log('Testing teacher login...');
        
        const response = await axios.post('http://localhost:5000/api/TeacherLogin', {
            email: 'ds.teacher@university.com',
            password: 'password123'
        });
        
        console.log('Login successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('Login failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }
}

testTeacherLogin();