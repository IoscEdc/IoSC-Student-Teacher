import React, { useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const BareMinimumTest = () => {
    // Just 2 students with simple state
    const [student1Status, setStudent1Status] = useState('present');
    const [student2Status, setStudent2Status] = useState('absent');
    
    console.log('🔄 Render - Student1:', student1Status, 'Student2:', student2Status);
    
    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h4" gutterBottom>
                Bare Minimum Test - Individual State
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Student 1: {student1Status} | Student 2: {student2Status}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Student 1 Controls */}
                <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                    <Typography variant="h6">Student 1 (21AI001 - John Doe)</Typography>
                    <Typography>Current: {student1Status}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                            variant={student1Status === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => {
                                console.log('🟢 Setting Student 1 to PRESENT');
                                setStudent1Status('present');
                            }}
                        >
                            Present
                        </Button>
                        <Button 
                            variant={student1Status === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => {
                                console.log('🔴 Setting Student 1 to ABSENT');
                                setStudent1Status('absent');
                            }}
                        >
                            Absent
                        </Button>
                    </Box>
                </Box>
                
                {/* Student 2 Controls */}
                <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                    <Typography variant="h6">Student 2 (21AI002 - Jane Smith)</Typography>
                    <Typography>Current: {student2Status}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                            variant={student2Status === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => {
                                console.log('🟢 Setting Student 2 to PRESENT');
                                setStudent2Status('present');
                            }}
                        >
                            Present
                        </Button>
                        <Button 
                            variant={student2Status === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => {
                                console.log('🔴 Setting Student 2 to ABSENT');
                                setStudent2Status('absent');
                            }}
                        >
                            Absent
                        </Button>
                    </Box>
                </Box>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                This uses completely separate state variables. If this doesn't work independently, 
                there's a fundamental React issue.
            </Typography>
        </Paper>
    );
};

export default BareMinimumTest;