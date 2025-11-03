import React from 'react';
import { useSelector } from 'react-redux';
import SimpleAttendanceHistory from '../../components/attendance/SimpleAttendanceHistory';
import { 
    Box, 
    Typography, 
    Alert, 
    // --- REMOVED Container, Paper, and Divider ---
} from '@mui/material';

const TeacherAttendanceHistory = () => {
    const { currentUser } = useSelector((state) => state.user);
    
    const classId = currentUser.teachSclass?._id;
    const subjectId = currentUser.teachSubject?._id;
    const teacherId = currentUser._id;
    
    // --- REMOVED className and subjectName, as we're removing the redundant header ---

    console.log('🔍 TeacherAttendanceHistory - Current User:', {
        classId,
        subjectId,
        teacherId,
    });

    // --- Check for IDs and render error or content ---
    if (!classId || !subjectId) {
        // We *only* add padding to the error message, 
        // so it isn't stuck to the screen edges.
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert 
                    severity="error" 
                    sx={{ '& .MuiAlert-message': { width: '100%' } }}
                >
                    <Typography fontWeight="medium">
                        Unable to load attendance history.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Please ensure you are assigned to a primary class and subject.
                    </Typography>
                    <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ mt: 2, display: 'block', wordBreak: 'break-all' }}
                    >
                        {/* Use String() to safely print null/undefined */}
                        Debug: classId=({String(classId)}), subjectId=({String(subjectId)})
                    </Typography>
                </Alert>
            </Box>
        );
    }

    // --- Success State ---
    // Render the child component *directly* without any wrappers.
    // SimpleAttendanceHistory already has its own internal padding and layout.
    return (
        <SimpleAttendanceHistory 
            classId={classId}
            subjectId={subjectId}
            teacherId={teacherId}
        />
    );
};

export default TeacherAttendanceHistory;