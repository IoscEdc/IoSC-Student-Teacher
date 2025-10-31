import React from 'react';
import { useSelector } from 'react-redux';
import SimpleAttendanceHistory from '../../components/attendance/SimpleAttendanceHistory';
import { Box, Typography, Alert } from '@mui/material';

const TeacherAttendanceHistory = () => {
    const { currentUser } = useSelector((state) => state.user);
    
    const classId = currentUser.teachSclass?._id;
    const subjectId = currentUser.teachSubject?._id;
    const teacherId = currentUser._id;
    const className = currentUser.teachSclass?.sclassName;
    const subjectName = currentUser.teachSubject?.subName;

    console.log('🔍 TeacherAttendanceHistory - Current User:', {
        classId,
        subjectId,
        teacherId,
        className,
        subjectName,
        fullUser: currentUser
    });

    if (!classId || !subjectId) {
        console.log('❌ Missing classId or subjectId:', { classId, subjectId });
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Unable to load attendance history. Please ensure you are assigned to a class and subject.
                    <br />
                    Debug: classId={classId}, subjectId={subjectId}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Attendance History
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {className} - {subjectName}
            </Typography>
            
            <SimpleAttendanceHistory 
                classId={classId}
                subjectId={subjectId}
                teacherId={teacherId}
            />
        </Box>
    );
};

export default TeacherAttendanceHistory;