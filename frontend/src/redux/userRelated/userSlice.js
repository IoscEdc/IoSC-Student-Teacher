import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    status: 'idle',
    userDetails: [],
    tempDetails: [],
    loading: false,
    currentUser: JSON.parse(localStorage.getItem('user')) || null,
    currentRole: (JSON.parse(localStorage.getItem('user')) || {}).role || null,
    error: null,
    response: null,
    darkMode: true
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        authRequest: (state) => {
            state.status = 'loading';
        },
        underControl: (state) => {
            state.status = 'idle';
            state.response = null;
        },
        stuffAdded: (state, action) => {
            state.status = 'added';
            state.response = null;
            state.error = null;
            state.tempDetails = action.payload;
        },        authSuccess: (state, action) => {
            state.status = 'success';
            state.currentUser = action.payload;
            state.currentRole = action.payload.role;
            localStorage.setItem('user', JSON.stringify(action.payload));
            // Store token separately if it exists
            if (action.payload.token) {
                localStorage.setItem('token', action.payload.token);
            }
            state.response = null;
            state.error = null;
        },
        authFailed: (state, action) => {
            state.status = 'failed';
            state.response = action.payload;
        },
        authError: (state, action) => {
            state.status = 'error';
            state.error = action.payload;
        },        authLogout: (state) => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            state.currentUser = null;
            state.status = 'idle';
            state.error = null;
            state.currentRole = null
        },

        doneSuccess: (state, action) => {
            state.userDetails = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        getDeleteSuccess: (state) => {
            state.loading = false;
            state.error = null;
            state.response = null;
        },

        getRequest: (state) => {
            state.loading = true;
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
        toggleDarkMode: (state) => {
            state.darkMode = !state.darkMode;
        }
    },
    extraReducers: (builder) => {
        // Handle addStuff async thunk
        builder
            .addCase('user/addStuff/pending', (state) => {
                state.status = 'loading';
                state.loading = true;
            })
            .addCase('user/addStuff/fulfilled', (state, action) => {
                state.status = 'added';
                state.loading = false;
                state.tempDetails = action.payload;
                state.error = null;
                state.response = null;
            })
            .addCase('user/addStuff/rejected', (state, action) => {
                state.status = 'failed';
                state.loading = false;
                state.error = action.payload;
                state.response = action.payload;
            })
            // Handle getUserDetails async thunk
            .addCase('user/getUserDetails/pending', (state) => {
                state.loading = true;
            })
            .addCase('user/getUserDetails/fulfilled', (state, action) => {
                state.loading = false;
                state.userDetails = action.payload;
                state.error = null;
            })
            .addCase('user/getUserDetails/rejected', (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle updateUser async thunk
            .addCase('user/updateUser/pending', (state) => {
                state.loading = true;
            })
            .addCase('user/updateUser/fulfilled', (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
                state.error = null;
            })
            .addCase('user/updateUser/rejected', (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    authRequest,
    underControl,
    stuffAdded,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    doneSuccess,
    getDeleteSuccess,
    getRequest,
    getFailed,
    getError,
    toggleDarkMode
} = userSlice.actions;

export const userReducer = userSlice.reducer;
