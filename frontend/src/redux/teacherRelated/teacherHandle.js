import axios from 'axios';
import {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    postDone,
    doneSuccess,
    getClassTeachersSuccess,
} from './teacherSlice';

export const getAllTeachers = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        ///Teachers?school=${schoolId}
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers?school=${id}`);
        if (result.data.message) {
            dispatch(getFailed(result.data.message));
        } else {
            console.log("Teachers fetched:", result.data);
            dispatch(getSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const getTeacherDetails = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teacher`);
        if (result.data) {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const updateTeachSubject = (teacherId, teachSubject) => async (dispatch) => {
    dispatch(getRequest());

    try {
        await axios.put(`${process.env.REACT_APP_BASE_URL}/TeacherSubject`, { teacherId, teachSubject }, {
            headers: { 'Content-Type': 'application/json' },
        });
        dispatch(postDone());
    } catch (error) {
        dispatch(getError(error));
    }
}

export const getClassTeachers = (id) => async (dispatch) => {
    console.log("🔍 Fetching teachers for class:", id);
    dispatch(getRequest());
    
    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/teachers/class/${id}`);
        
        console.log("📥 API Response:", result.data);
        
        // Handle different response structures
        if (result.data) {
            const teachers = result.data.teachers || result.data.data || result.data;
            
            console.log("👥 Teachers found:", teachers);
            
            // ✅ FIX: Use getClassTeachersSuccess instead of doneSuccess
            if (Array.isArray(teachers)) {
                dispatch(getClassTeachersSuccess(teachers));
            } else {
                dispatch(getClassTeachersSuccess([]));
            }
        } else {
            dispatch(getClassTeachersSuccess([]));
        }
    } catch (error) {
        console.error("❌ Error fetching class teachers:", error.response?.data || error.message);
        
        // If 404 or no teachers, set empty array
        if (error.response?.status === 404) {
            dispatch(getClassTeachersSuccess([]));
        } else {
            dispatch(getError(error));
        }
    }
};