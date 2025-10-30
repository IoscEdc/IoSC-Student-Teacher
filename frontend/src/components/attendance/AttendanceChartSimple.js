import React from 'react';
import { Box, Typography } from '@mui/material';

const AttendanceChartSimple = ({ data, type }) => {
    return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">
                Attendance Chart ({type})
            </Typography>
            <Typography variant="body2">
                Chart will be displayed here. Data points: {data?.length || 0}
            </Typography>
        </Box>
    );
};

export default AttendanceChartSimple;