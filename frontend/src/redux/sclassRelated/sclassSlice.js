import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sclassesList: [],
    sclassStudents: [],
    sclassDetails: null,
    subjectsList: [],
    subjectDetails: null,
    loading: false,
    subloading: false,
    error: null,
    response: null,
    getresponse: null,
    studentGetResponse: false, // Renamed from getresponse
    subjectGetResponse: false, // Added this new flag
};

const sclassSlice = createSlice({
    name: 'sclass',
    initialState,
    reducers: {
        getRequest: (state) => {
            state.loading = true;
        },
        getSubDetailsRequest: (state) => {
            state.subloading = true;
        },
        getSuccess: (state, action) => {
            state.sclassesList = action.payload;
            state.loading = false;
            state.error = null;
            state.getresponse = null;
        },
        getStudentsSuccess: (state, action) => {
            state.loading = false;
            state.sclassStudents = action.payload;
            state.status = 'success';
            state.error = null;
            state.response = null;
            state.studentGetResponse = false;
        },
        getStudentsFailed: (state, action) => {
            state.loading = false;
            state.sclassStudents = [];
            state.status = 'failed';
            state.error = action.payload;
            state.response = action.payload; // Or just the message
            state.studentGetResponse = true; // Use the specific flag
        },
        // --- SUBJECT REDUCERS (NEW) ---
        getSubjectListSuccess: (state, action) => {
            state.loading = false;
            state.subjectsList = action.payload;
            state.status = 'success';
            state.error = null;
            state.response = null;
            state.subjectGetResponse = false; // Use the new flag
        },
        getSubjectListFailed: (state, action) => {
            state.loading = false;
            state.subjectsList = [];
            state.status = 'failed';
            state.error = action.payload;
            state.response = action.payload; // Or just the message
            state.subjectGetResponse = true; // Use the new flag
        },
        getSubjectsSuccess: (state, action) => {
            state.subjectsList = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        getFailed: (state, action) => {
            state.subjectsList = [];
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getFailedTwo: (state, action) => {
            state.sclassesList = [];
            state.sclassStudents = [];
            state.getresponse = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        detailsSuccess: (state, action) => {
            state.sclassDetails = action.payload;
            state.loading = false;
            state.error = null;
        },
        getSubDetailsSuccess: (state, action) => {
            state.subjectDetails = action.payload;
            state.subloading = false;
            state.error = null;
        },
        resetSubjects: (state) => {
            state.subjectsList = [];
            state.sclassesList = [];
        },
    },
});

export const {
    getRequest,
    getSubDetailsRequest,
    getSuccess,
    
    // Student reducers
    getStudentsSuccess,
    getStudentsFailed,     // <-- ADDED

    // Subject List reducers
    getSubjectListSuccess, // <-- ADDED
    getSubjectListFailed,  // <-- ADDED

    // Details reducers
    detailsSuccess,
    getSubDetailsSuccess,
    
    // Other reducers
    getError,
    resetSubjects,

    getFailedTwo,

    // --- REMOVED REDUNDANT REDUCERS ---
    // getFailed, (replaced by getSubjectListFailed)
    // getFailedTwo, (replaced by getStudentsFailed)
    // getSubjectsSuccess, (replaced by getSubjectListSuccess)

} = sclassSlice.actions;

export const sclassReducer = sclassSlice.reducer;