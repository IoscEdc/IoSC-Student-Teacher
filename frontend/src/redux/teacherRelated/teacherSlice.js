import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    teachersList: [],
    teacherDetails: [],
    classTeachersList: [],
    loading: false,
    error: null,
    response: null,
};

const teacherSlice = createSlice({
    name: 'teacher',
    initialState,
    reducers: {
        getRequest: (state) => {
            state.loading = true;
        },
        doneSuccess: (state, action) => {
            state.teacherDetails = action.payload;
            state.loading = false;
            state.status = 'success';
            state.error = null;
            state.response = null;
        },
        getSuccess: (state, action) => {
            state.teachersList = action.payload;
            state.loading = false;
            state.status = 'success';
            state.error = null;
            state.response = null;
        },
        getClassTeachersSuccess: (state, action) => {
            state.loading = false;
            state.classTeachersList = action.payload; // Updates the new list
            state.status = 'success';
            state.error = null;
            state.response = null;
        },
        
        // This resets the list when the component unmounts
        resetClassTeachers: (state) => {
            state.classTeachersList = [];
            state.status = 'idle';
        },
        getFailed: (state, action) => {
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        postDone: (state) => {
            state.loading = false;
            state.error = null;
            state.response = null;
        }
    },
});

export const {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    doneSuccess,
    postDone,
    getClassTeachersSuccess,
    resetClassTeachers
} = teacherSlice.actions;

export const teacherReducer = teacherSlice.reducer;