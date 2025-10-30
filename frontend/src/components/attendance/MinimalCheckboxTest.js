import React, { useState } from 'react';
import { Box, Typography, Checkbox, Paper } from '@mui/material';

const MinimalCheckboxTest = () => {
    const [status, setStatus] = useState('present');
    
    console.log('Current status:', status);
    
    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h5" gutterBottom>
                Minimal Checkbox Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Current Status: {status}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <label>
                    <Checkbox
                        checked={status === 'present'}
                        onChange={(e) => {
                            console.log('Present checkbox clicked, checked:', e.target.checked);
                            if (e.target.checked) {
                                setStatus('present');
                            }
                        }}
                        sx={{ color: '#4CAF50', '&.Mui-checked': { color: '#4CAF50' } }}
                    />
                    Present
                </label>
                
                <label>
                    <Checkbox
                        checked={status === 'absent'}
                        onChange={(e) => {
                            console.log('Absent checkbox clicked, checked:', e.target.checked);
                            if (e.target.checked) {
                                setStatus('absent');
                            }
                        }}
                        sx={{ color: '#F44336', '&.Mui-checked': { color: '#F44336' } }}
                    />
                    Absent
                </label>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
                Click the checkboxes above and check the console for debug output.
            </Typography>
        </Paper>
    );
};

export default MinimalCheckboxTest;