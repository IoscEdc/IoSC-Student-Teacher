import axios from 'axios';
import {
    getRequest,
    getError,
    detailsSuccess,
    getSubDetailsSuccess,
    getSubDetailsRequest,

    // Keep these for getAllSclasses
    getSuccess,
    getFailedTwo,

    // --- UPDATED IMPORTS ---
    getStudentsSuccess,
    getStudentsFailed,     // <-- IMPORT THIS
    getSubjectListSuccess, // <-- IMPORT THIS
    getSubjectListFailed   // <-- IMPORT THIS

    // We no longer need getFailed or getSubjectsSuccess for these functions
} from './sclassSlice';

export const getAllSclasses = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        if (!id || !address) {
            dispatch(getError("Missing required parameters"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}List/${id}`);
        if (result.data.message) {
            dispatch(getFailedTwo(result.data.message));
        } else {
            dispatch(getSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}

export const getClassStudents = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        if (!id) {
            dispatch(getError("Missing class ID"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/Students/${id}`);
        if (result.data.message) {
            // --- FIX ---
            // Was: getFailedTwo(result.data.message)
            dispatch(getStudentsFailed(result.data.message));
        } else {
            dispatch(getStudentsSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}

export const getClassDetails = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        if (!id || !address) {
            dispatch(getError("Missing required parameters"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(detailsSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}

export const getSubjectList = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        if (!id || !address) {
            dispatch(getError("Missing required parameters"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        console.log(result);
        if (result.data.message) {
            // --- FIX ---
            // Was: getFailed(result.data.message)
            dispatch(getSubjectListFailed(result.data.message));
        } else {
            // --- FIX ---
            // Was: getSubjectsSuccess(result.data)
            dispatch(getSubjectListSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}

export const getTeacherFreeClassSubjects = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        if (!id) {
            dispatch(getError("Missing teacher ID"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/FreeSubjectList/${id}`);
        if (result.data.message) {
            // --- FIX ---
            // Was: getFailed(result.data.message)
            dispatch(getSubjectListFailed(result.data.message));
        } else {
            // --- FIX ---
            // Was: getSubjectsSuccess(result.data)
            dispatch(getSubjectListSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}

export const getSubjectDetails = (id, address) => async (dispatch) => {
    dispatch(getSubDetailsRequest());

    try {
        if (!id || !address) {
            dispatch(getError("Missing required parameters"));
            return;
        }
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(getSubDetailsSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.error || error.message || "Something went wrong"));
    }
}