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
    dispatch(getRequest());
    try {
        // This endpoint comes from your teacherController's 'getTeachersByClass' function.
        // Make sure this route matches your backend API route.
        const result =await axios.get(`${process.env.REACT_APP_BASE_URL}/teachers/class/${id}`);
        if (result.data) {
            console.log("Class Teachers fetched:", result.data);
            dispatch(doneSuccess(result.data));
        }   
    } catch (error) {
        dispatch(getError(error));
    }
};