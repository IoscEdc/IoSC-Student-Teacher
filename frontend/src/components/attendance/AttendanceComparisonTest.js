import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    FormControlLabel,
    Radio,
    RadioGroup,
    Alert,
    Grid
} from '@mui/material';

/**
 * Component to compare Switch vs Radio button behavior for attendance marking
 */
const AttendanceComparisonTest = () => {
    const [switchAttendance, setSwitchAttendance] = useState(new Map());
    const [radioAttendance, setRadioAttendance] = useState({});
    const [logs, setLogs] = useState([]);

    // Mock student
    const student = { _id: 'test-student', name: 'Test Student', rollNum: '001' };

    // Initialize states
    React.useEffect(() => {
        setSwitchAttendance(new Map([['test-student', 'absent']]));
        setRadioAttendance({ 'test-student': 'absent' });
        addLog('Initialized both attendance states to absent');
    }, []);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { message, timestamp }].slice(-10));
    };

    // Switch handler (like in ImprovedTeacherAttendance)
    const handleSwitchChange = (studentId, newStatus) => {
        console.log('🔄 Switch handler called:', { studentId, newStatus });
        addLog(`Switch: ${studentId} -> ${newStatus}`);
        
        setSwitchAttendance(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(studentId, newStatus);
            console.log('📊 Switch map updated:', Object.fromEntries(newMap));
            return newMap;
        });
    };

    // Radio handler (like in AttendanceMarkingGrid)
    const handleRadioChange = (studentId, newStatus) => {
        console.log('📻 Radio handler called:', { studentId, newStatus });
        addLog(`Radio: ${studentId} -> ${newStatus}`);
        
        setRadioAttendance(prev => {
            const newState = { ...prev, [studentId]: newStatus };
            console.log('📊 Radio state updated:', newState);
            return newState;
        });
    };

    const switchStatus = switchAttendance.get('test-student') || 'absent';
    const radioStatus = radioAttendance['test-student'] || 'absent';

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Switch vs Radio Attendance Comparison
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                Testing both Switch and Radio implementations side by side to identify the issue.
            </Alert>

            <Grid container spacing={3}>
                {/* Switch Implementation */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Switch Implementation (Not Working)
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                {student.rollNum} - {student.name}
                            </Typography>
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={switchStatus === 'present'}
                                        onChange={(e) => {
                                            console.log('🎯 Switch onChange:', e.target.checked);
                                            const newStatus = e.target.checked ? 'present' : 'absent';
                                            handleSwitchChange('test-student', newStatus);
                                        }}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#4CAF50',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#4CAF50',
                                            },
                                        }}
                                    />
                                }
                                label={switchStatus === 'present' ? 'Present' : 'Absent'}
                                labelPlacement="start"
                            />
                        </Box>
                        
                        <Alert severity={switchStatus === 'present' ? 'success' : 'error'}>
                            Current Status: <strong>{switchStatus.toUpperCase()}</strong>
                        </Alert>
                    </Paper>
                </Grid>

                {/* Radio Implementation */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom color="secondary">
                            Radio Implementation (Working)
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                {student.rollNum} - {student.name}
                            </Typography>
                            
                            <RadioGroup
                                row
                                value={radioStatus}
                                onChange={(e) => {
                                    console.log('📻 Radio onChange:', e.target.value);
                                    handleRadioChange('test-student', e.target.value);
                                }}
                            >
                                <FormControlLabel
                                    value="present"
                                    control={
                                        <Radio 
                                            size="small" 
                                            sx={{
                                                color: '#4CAF50',
                                                '&.Mui-checked': { color: '#4CAF50' }
                                            }}
                                        />
                                    }
                                    label="Present"
                                />
                                <FormControlLabel
                                    value="absent"
                                    control={
                                        <Radio 
                                            size="small" 
                                            sx={{
                                                color: '#F44336',
                                                '&.Mui-checked': { color: '#F44336' }
                                            }}
                                        />
                                    }
                                    label="Absent"
                                />
                            </RadioGroup>
                        </Box>
                        
                        <Alert severity={radioStatus === 'present' ? 'success' : 'error'}>
                            Current Status: <strong>{radioStatus.toUpperCase()}</strong>
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>

            {/* Debug Information */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>Debug Information:</Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Switch State:</Typography>
                        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {JSON.stringify(Object.fromEntries(switchAttendance), null, 2)}
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Radio State:</Typography>
                        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {JSON.stringify(radioAttendance, null, 2)}
                        </Typography>
                    </Grid>
                </Grid>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Activity Log:</Typography>
                <Box sx={{ maxHeight: 150, overflow: 'auto', mt: 1 }}>
                    {logs.map((log, index) => (
                        <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            [{log.timestamp}] {log.message}
                        </Typography>
                    ))}
                </Box>
            </Paper>

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6" gutterBottom>Test Instructions:</Typography>
                <Typography variant="body2" component="div">
                    <ol>
                        <li>Try toggling the Switch on the left - observe if the status changes</li>
                        <li>Try selecting Present/Absent radio buttons on the right</li>
                        <li>Check the debug information to see state updates</li>
                        <li>Look at browser console for any error messages</li>
                        <li>Compare the behavior between both implementations</li>
                    </ol>
                </Typography>
            </Paper>
        </Box>
    );
};

export default AttendanceComparisonTest;