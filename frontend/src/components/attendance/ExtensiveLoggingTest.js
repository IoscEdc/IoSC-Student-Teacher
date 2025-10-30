import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const ExtensiveLoggingTest = () => {
    const [student1, setStudent1] = useState('present');
    const [student2, setStudent2] = useState('absent');
    const [student3, setStudent3] = useState('present');
    const [renderCount, setRenderCount] = useState(0);
    
    // Log every render
    useEffect(() => {
        setRenderCount(prev => prev + 1);
        console.log(`🎨 RENDER #${renderCount + 1} - States:`, {
            student1,
            student2, 
            student3,
            timestamp: new Date().toISOString()
        });
    });
    
    // Log component mount
    useEffect(() => {
        console.log('🚀 ExtensiveLoggingTest MOUNTED');
        return () => {
            console.log('💀 ExtensiveLoggingTest UNMOUNTED');
        };
    }, []);
    
    const handleStudent1Present = () => {
        console.log('🔥 BEFORE Student1 Present - Current state:', student1);
        console.log('🔥 Stack trace:', new Error().stack);
        setStudent1('present');
        console.log('🔥 AFTER Student1 Present - Set to: present');
    };
    
    const handleStudent1Absent = () => {
        console.log('🔥 BEFORE Student1 Absent - Current state:', student1);
        console.log('🔥 Stack trace:', new Error().stack);
        setStudent1('absent');
        console.log('🔥 AFTER Student1 Absent - Set to: absent');
    };
    
    const handleStudent2Present = () => {
        console.log('🟢 BEFORE Student2 Present - Current state:', student2);
        console.log('🟢 Stack trace:', new Error().stack);
        setStudent2('present');
        console.log('🟢 AFTER Student2 Present - Set to: present');
    };
    
    const handleStudent2Absent = () => {
        console.log('🟢 BEFORE Student2 Absent - Current state:', student2);
        console.log('🟢 Stack trace:', new Error().stack);
        setStudent2('absent');
        console.log('🟢 AFTER Student2 Absent - Set to: absent');
    };
    
    const handleStudent3Present = () => {
        console.log('🔵 BEFORE Student3 Present - Current state:', student3);
        console.log('🔵 Stack trace:', new Error().stack);
        setStudent3('present');
        console.log('🔵 AFTER Student3 Present - Set to: present');
    };
    
    const handleStudent3Absent = () => {
        console.log('🔵 BEFORE Student3 Absent - Current state:', student3);
        console.log('🔵 Stack trace:', new Error().stack);
        setStudent3('absent');
        console.log('🔵 AFTER Student3 Absent - Set to: absent');
    };
    
    const logCurrentState = () => {
        console.log('📊 MANUAL STATE CHECK:', {
            student1,
            student2,
            student3,
            renderCount,
            timestamp: new Date().toISOString()
        });
    };
    
    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h4" gutterBottom>
                Extensive Logging Test
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Render Count: {renderCount}
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                Student1: {student1} | Student2: {student2} | Student3: {student3}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Student 1 */}
                <Box sx={{ p: 2, border: '2px solid red', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: 'red' }}>Student 1 (RED) - Current: {student1}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                            variant={student1 === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={handleStudent1Present}
                        >
                            Present
                        </Button>
                        <Button 
                            variant={student1 === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={handleStudent1Absent}
                        >
                            Absent
                        </Button>
                    </Box>
                </Box>
                
                {/* Student 2 */}
                <Box sx={{ p: 2, border: '2px solid green', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: 'green' }}>Student 2 (GREEN) - Current: {student2}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                            variant={student2 === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={handleStudent2Present}
                        >
                            Present
                        </Button>
                        <Button 
                            variant={student2 === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={handleStudent2Absent}
                        >
                            Absent
                        </Button>
                    </Box>
                </Box>
                
                {/* Student 3 */}
                <Box sx={{ p: 2, border: '2px solid blue', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: 'blue' }}>Student 3 (BLUE) - Current: {student3}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                            variant={student3 === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={handleStudent3Present}
                        >
                            Present
                        </Button>
                        <Button 
                            variant={student3 === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={handleStudent3Absent}
                        >
                            Absent
                        </Button>
                    </Box>
                </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={logCurrentState}>
                    Log Current State to Console
                </Button>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Each student has completely separate state variables and handlers.
                Check the browser console for extensive logging.
                If these don't work independently, there's a fundamental issue.
            </Typography>
        </Paper>
    );
};

export default ExtensiveLoggingTest;