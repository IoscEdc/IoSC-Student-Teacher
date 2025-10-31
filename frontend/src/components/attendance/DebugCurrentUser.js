import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper } from '@mui/material';

const DebugCurrentUser = () => {
    const { currentUser } = useSelector((state) => state.user);

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Debug Current User Data
                </Typography>
                
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Full currentUser object:
                </Typography>
                <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px'
                }}>
                    {JSON.stringify(currentUser, null, 2)}
                </pre>

                <Typography variant="h6" sx={{ mt: 2 }}>
                    Extracted Values:
                </Typography>
                <Typography>
                    teachSclass: {JSON.stringify(currentUser?.teachSclass)}
                </Typography>
                <Typography>
                    teachSubject: {JSON.stringify(currentUser?.teachSubject)}
                </Typography>
                <Typography>
                    classId: {currentUser?.teachSclass?._id || 'undefined'}
                </Typography>
                <Typography>
                    subjectId: {currentUser?.teachSubject?._id || 'undefined'}
                </Typography>
            </Paper>
        </Box>
    );
};

export default DebugCurrentUser;