import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import {
    authRequest,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    doneSuccess,
    getRequest,
    getFailed,
    getError,
} from './userSlice';

// Helper to safely get error message
const getErrorMessage = (error) => {
    return error.response?.data?.error || error.response?.data?.message || error.message || "Something went wrong";
};

// --------- LOGIN ---------
export const loginUser = (credentials) => async (dispatch) => {
    console.log('🔍 LOGIN DEBUG - Step 1: Function called with params:', { ...credentials, password: '***' });
    
    dispatch(authRequest());
    
    try {
        const { email, password, role } = credentials;
        console.log('🔍 LOGIN DEBUG - Step 2: Inside try block');
        
        let endpoint = '';
        
        console.log('🔍 LOGIN DEBUG - Step 3: Role received:', role, 'Type:', typeof role);
        
        if (role === 'Student') {
            endpoint = '/StudentLogin';
            console.log('🔍 LOGIN DEBUG - Step 4a: Student role matched, endpoint set to:', endpoint);
        } else if (role === 'Admin') {
            endpoint = '/AdminLogin';
            console.log('🔍 LOGIN DEBUG - Step 4b: Admin role matched, endpoint set to:', endpoint);
        } else if (role === 'Teacher') {
            endpoint = '/TeacherLogin';
            console.log('🔍 LOGIN DEBUG - Step 4c: Teacher role matched, endpoint set to:', endpoint);
        } else {
            console.log('🔍 LOGIN DEBUG - Step 4d: NO ROLE MATCHED! Role value:', role);
            dispatch(authError('Invalid role provided'));
            return;
        }

        console.log('🔍 LOGIN DEBUG - Step 5: Final endpoint before API call:', endpoint);
        
        if (!endpoint) {
            console.error('🚨 LOGIN ERROR - Endpoint is empty!');
            dispatch(authError('Invalid role provided'));
            return;
        }

        console.log('🔍 LOGIN DEBUG - Step 6: About to make API call to:', endpoint);
        const res = await api.post(endpoint, { email, password });
        console.log('🔍 LOGIN DEBUG - Step 7: API call successful, response:', res.data);

        if (res.data && (res.data.token || res.data.success)) {
            console.log('🔍 LOGIN DEBUG - Step 8: Success response found');
            
            // Determine user data based on response structure
            let userData = null;
            if (res.data.student) {
                userData = { ...res.data.student, role: 'Student' };
                console.log('👤 STUDENT LOGIN SUCCESS - Details:', {
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    school: userData.school,
                    class: userData.sclassName,
                    rollNum: userData.rollNum,
                    role: userData.role
                });
            } else if (res.data.teacher) {
                userData = { ...res.data.teacher, role: 'Teacher' };
                console.log('👨‍🏫 TEACHER LOGIN SUCCESS - Details:', {
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    school: userData.school,
                    teachSclass: userData.teachSclass,
                    role: userData.role
                });
            } else if (res.data.admin) {
                userData = { ...res.data.admin, role: 'Admin' };
                console.log('👨‍💼 ADMIN LOGIN SUCCESS - Details:', {
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    schoolName: userData.schoolName,
                    role: userData.role
                });
            } else {
                // Fallback for older response format
                userData = { ...res.data, role };
            }
            
            // Store token if available
            if (res.data.token) {
                console.log('🔍 LOGIN DEBUG - Step 9a: Storing token in localStorage');
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userRole', role);
                console.log('🔍 LOGIN DEBUG - Step 9b: Token stored successfully');
            } else {
                console.log('🚨 LOGIN ERROR - No token in response!');
            }
            
            console.log('🔍 LOGIN DEBUG - Step 9: Dispatching authSuccess');
            dispatch(authSuccess(userData));
            
        } else {
            console.log('🔍 LOGIN DEBUG - Step 10: No success response, checking for error');
            dispatch(authFailed(res.data.message || res.data.error || 'Login failed'));
        }
    } catch (err) {
        console.error('🚨 LOGIN ERROR - Step 11: Caught error:', err);
        console.error('🚨 LOGIN ERROR - Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
        });
        dispatch(authError(getErrorMessage(err)));
    }
};

// --------- REGISTER ---------
export const registerUser = createAsyncThunk(
    'user/registerUser',
    async ({ fields, role }, { rejectWithValue }) => {
        try {
            let endpoint = '';
            if (role === 'Student') endpoint = '/StudentReg';
            else if (role === 'Admin') endpoint = '/AdminReg';
            else if (role === 'Teacher') endpoint = '/TeacherReg';

            const res = await api.post(endpoint, fields);

            if (res.data.schoolName || res.data.token) return res.data;
            if (res.data.school) return res.data; // For stuffAdded logic
            return rejectWithValue(res.data.message || 'Registration failed');
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

// --------- LOGOUT ---------
export const logoutUser = () => (dispatch) => {
    console.log('🔍 LOGOUT DEBUG - Clearing tokens and state');
    // Clear stored tokens
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    
    // Clear Redux state
    dispatch(authLogout());
    console.log('🔍 LOGOUT DEBUG - Logout complete');
};

// --------- GET USER DETAILS ---------
export const getUserDetails = createAsyncThunk(
    'user/getUserDetails',
    async ({ id, address }, { rejectWithValue }) => {
        try {
            const res = await api.get(`/${address}/${id}`);
            if (res.data) return res.data;
            return rejectWithValue('No data found');
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

// --------- UPDATE USER ---------
export const updateUser = createAsyncThunk(
    'user/updateUser',
    async ({ fields, id, address }, { rejectWithValue }) => {
        try {
            const res = await api.put(`/${address}/${id}`, fields);

            if (res.data.schoolName || res.data.token) return res.data;
            return res.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

// --------- ADD STUFF ---------
export const addStuff = createAsyncThunk(
    'user/addStuff',
    async ({ fields, address }, { rejectWithValue }) => {
        try {
            if (!address) {
                return rejectWithValue('Address parameter is required');
            }
            
            const res = await api.post(`/${address}Create`, fields);

            if (res.data.message) return rejectWithValue(res.data.message);
            return res.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

// --------- DELETE USER/STUFF ---------
export const deleteUser = (deleteID, address) => async () => {
    try {
        const res = await api.delete(`/${address}/${deleteID}`);
        return res.data;
    } catch (err) {
        throw new Error(getErrorMessage(err));
    }
};