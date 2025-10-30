import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    FormControlLabel,
    Alert,
    Button
} from '@mui/material';

/**
 * Minimal component to debug switch issues
 */
const SwitchIssueDebug = () => {
    const [attendance, setAttendance] = useState({
        'student1': 'absent',
        'student2': 'absent'
    });
    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-10));
        console.log(`🔍 DEBUG: ${message}`);
    };

    const handleAttendanceChange = (studentId, newStatus) => {
        addLog(`handleAttendanceChange called: ${studentId} -> ${newStatus}`);
        
        setAttendance(prevAttendance => {
            const updated = {
                ...prevAttendance,
                [studentId]: newStatus
            };
            addLog(`State updated: ${JSON.stringify(updated)}`);
            return updated;
        });
    };

    const resetAll = () => {
        setAttendance({ 'student1': 'absent', 'student2': 'absent' });
        setLogs([]);
        addLog('Reset all to absent');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Switch Issue Debug
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                This is a minimal test to debug switch behavior. Try toggling the switches below.
            </Alert>

            {/* Test Switches */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Test Switches:</Typography>
                
                {['student1', 'student2'].map(studentId => {
                    const currentStatus = attendance[studentId] || 'absent';
                    
                    return (
                        <Box key={studentId} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Typography variant="body1" gutterBottom>
                                Student {studentId}: <strong>{currentStatus.toUpperCase()}</strong>
                            </Typography>
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentStatus === 'present'}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            const newStatus = isChecked ? 'present' : 'absent';
                                            addLog(`Switch clicked: ${studentId}, checked=${isChecked}, newStatus=${newStatus}`);
                                            handleAttendanceChange(studentId, newStatus);
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
                                label={`Toggle ${studentId} (Currently: ${currentStatus})`}
                                labelPlacement="start"
                            />
                        </Box>
                    );
                })}
                
                <Button variant="outlined" onClick={resetAll} sx={{ mt: 2 }}>
                    Reset All
                </Button>
            </Paper>

            {/* Current State */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>Current State:</Typography>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(attendance, null, 2)}
                </Typography>
            </Paper>

            {/* Debug Logs */}
            <Paper sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6" gutterBottom>Debug Logs:</Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {logs.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No logs yet. Try clicking the switches above.
                        </Typography>
                    ) : (
                        logs.map((log, index) => (
                            <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {log}
                            </Typography>
                        ))
                    )}
                </Box>
            </Paper>

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#fff3e0' }}>
                <Typography variant="h6" gutterBottom>What to test:</Typography>
                <Typography variant="body2" component="div">
                    <ol>
                        <li>Click each switch and observe if it toggles visually</li>
                        <li>Check if the status text updates immediately</li>
                        <li>Look at the debug logs to see if events are firing</li>
                        <li>Check browser console for any errors</li>
                        <li>Try the reset button to see if state management works</li>
                    </ol>
                </Typography>
            </Paper>
        </Box>
    );
};

export default SwitchIssueDebug;