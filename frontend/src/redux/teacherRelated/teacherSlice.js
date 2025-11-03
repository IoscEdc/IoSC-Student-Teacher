import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    teachersList: [],
    classTeachersList: [], // Add this
    loading: false,
    error: null,
    response: null,
    getresponse: null,
    currentTeacher: null,
};

const teacherSlice = createSlice({
    name: 'teacher',
    initialState,
    reducers: {
        getRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        getSuccess: (state, action) => {
            state.teachersList = action.payload.teachers || action.payload;
            state.loading = false;
            state.error = null;
            state.getresponse = null;
            state.response = null;
        },
        getFailed: (state, action) => {
            state.loading = false;
            state.getresponse = action.payload;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        postDone: (state) => {
            state.loading = false;
            state.error = null;
            state.response = "Success";
        },
        doneSuccess: (state, action) => {
            state.currentTeacher = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        // Add this new reducer for class teachers
        getClassTeachersSuccess: (state, action) => {
            console.log("🔄 Redux: Setting classTeachersList to:", action.payload);
            state.classTeachersList = action.payload;
            state.loading = false;
            state.error = null;
            state.getresponse = action.payload.length === 0 ? "No teachers found" : null;
        },
        // Add this to reset class teachers
        resetClassTeachers: (state) => {
            state.classTeachersList = [];
            state.getresponse = null;
        },
        underControl: (state) => {
            state.loading = false;
            state.response = null;
            state.error = null;
        },
    },
});

export const {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    postDone,
    doneSuccess,
    getClassTeachersSuccess, // Export this
    resetClassTeachers, // Export this
    underControl
} = teacherSlice.actions;

export const teacherReducer = teacherSlice.reducer;