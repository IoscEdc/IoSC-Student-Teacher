import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const UltraSimpleTest = () => {
    const [count, setCount] = useState(0);
    const [status, setStatus] = useState('present');

    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h4" gutterBottom>
                Ultra Simple Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Count: {count} | Status: {status}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={() => {
                        console.log('Incrementing count');
                        setCount(c => c + 1);
                    }}
                >
                    Increment Count
                </Button>
                
                <Button 
                    variant="contained" 
                    color="success"
                    onClick={() => {
                        console.log('Setting to present');
                        setStatus('present');
                    }}
                >
                    Set Present
                </Button>
                
                <Button 
                    variant="contained" 
                    color="error"
                    onClick={() => {
                        console.log('Setting to absent');
                        setStatus('absent');
                    }}
                >
                    Set Absent
                </Button>
            </Box>
            
            <Typography variant="body2">
                This tests basic React state updates. If this doesn't work, there's a fundamental React issue.
            </Typography>
        </Paper>
    );
};

export default UltraSimpleTest;