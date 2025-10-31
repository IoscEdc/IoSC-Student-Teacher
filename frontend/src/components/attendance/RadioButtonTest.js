import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Radio, 
    RadioGroup, 
    FormControlLabel, 
    FormControl, 
    FormLabel 
} from '@mui/material';

const RadioButtonTest = () => {
    const testStudents = [
        { id: 'student1', name: '21AI001 - John Doe' },
        { id: 'student2', name: '21AI002 - Jane Smith' },
        { id: 'student3', name: '21AI003 - Bob Johnson' }
    ];
    
    const [attendance, setAttendance] = useState({
        'student1': 'present',
        'student2': 'absent',
        'student3': 'present'
    });
    
    const handleChange = (studentId, value) => {
        console.log(`📻 Radio change for ${studentId}: ${value}`);
        setAttendance(prev => ({
            ...prev,
            [studentId]: value
        }));
    };
    
    const summary = {
        present: Object.values(attendance).filter(s => s === 'present').length,
        absent: Object.values(attendance).filter(s => s === 'absent').length
    };
    
    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h4" gutterBottom>
                Radio Button Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Present: {summary.present} | Absent: {summary.absent}
            </Typography>
            
            {testStudents.map((student) => (
                <Box key={student.id} sx={{ p: 2, mb: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{student.name}</FormLabel>
                        <RadioGroup
                            row
                            value={attendance[student.id]}
                            onChange={(e) => handleChange(student.id, e.target.value)}
                        >
                            <FormControlLabel 
                                value="present" 
                                control={<Radio sx={{ color: '#4CAF50', '&.Mui-checked': { color: '#4CAF50' } }} />} 
                                label="Present" 
                            />
                            <FormControlLabel 
                                value="absent" 
                                control={<Radio sx={{ color: '#F44336', '&.Mui-checked': { color: '#F44336' } }} />} 
                                label="Absent" 
                            />
                        </RadioGroup>
                        <Typography variant="caption" color="text.secondary">
                            Current: {attendance[student.id]}
                        </Typography>
                    </FormControl>
                </Box>
            ))}
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption">Debug State:</Typography>
                <pre style={{ fontSize: '12px' }}>
                    {JSON.stringify(attendance, null, 2)}
                </pre>
            </Box>
        </Paper>
    );
};

export default RadioButtonTest;