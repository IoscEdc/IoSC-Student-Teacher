import axios from 'axios';

// Test authentication and API connectivity
export const testAuthAndAPI = async () => {
    console.log('🔍 Testing Authentication and API...');
    
    // Check if token exists
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);
    
    if (token) {
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
        
        try {
            // Decode token to check expiry (basic check)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('👤 Token payload:', {
                    id: payload.id,
                    role: payload.role,
                    exp: new Date(payload.exp * 1000).toLocaleString()
                });
                
                // Check if token is expired
                const now = Date.now() / 1000;
                if (payload.exp < now) {
                    console.log('⚠️ Token is expired!');
                    return false;
                }
            }
        } catch (e) {
            console.log('⚠️ Could not decode token:', e.message);
        }
    } else {
        console.log('❌ No token found in localStorage');
        return false;
    }
    
    return true;
};

// Test attendance API specifically
export const testAttendanceAPI = async (studentId) => {
    console.log('🎯 Testing Attendance API for student:', studentId);
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token available for API test');
        return false;
    }
    
    try {
        const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000/api';
        const url = `${baseURL}/attendance/summary/student/${studentId}`;
        
        console.log('📤 Making request to:', url);
        console.log('📤 Base URL from env:', process.env.REACT_APP_BASE_URL);
        
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Attendance API Response:', {
            status: response.status,
            success: response.data.success,
            dataCount: response.data.data?.length || 0,
            message: response.data.message
        });
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('📋 Sample subject data:', {
                subject: response.data.data[0].subjectId?.subName,
                present: response.data.data[0].presentCount,
                total: response.data.data[0].totalSessions,
                percentage: response.data.data[0].attendancePercentage,
                recordsCount: response.data.data[0].records?.length || 0
            });
        }
        
        return response.data;
        
    } catch (error) {
        console.log('❌ Attendance API test failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
        return false;
    }
};