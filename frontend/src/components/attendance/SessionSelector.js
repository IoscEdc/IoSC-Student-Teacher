import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const SessionSelector = ({ 
    selectedDate, 
    onDateChange, 
    selectedSession, 
    onSessionChange, 
    classId,
    subjectId,
    disabled = false 
}) => {
    const [sessionOptions, setSessionOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch session options from API when classId and subjectId are provided
    useEffect(() => {
        const fetchSessionOptions = async () => {
            if (!classId || !subjectId) return;
            
            setLoading(true);
            try {
                console.log('Fetching session options for:', { classId, subjectId });
                const response = await axios.get('/api/attendance/session-options', {
                    params: { classId, subjectId },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                console.log('Session options API response:', response.data);
                
                if (response.data.success && response.data.data.length > 0) {
                    console.log('Session options received:', response.data.data);
                    setSessionOptions(response.data.data);
                } else {
                    console.log('No session options received, using defaults');
                }
            } catch (error) {
                console.error('Error fetching session options:', error);
                console.error('Error details:', error.response?.data);
                
                // Always set fallback options on error
                console.log('Using fallback session options');
                setSessionOptions([
                    { value: 'Lecture 1', label: 'Lecture 1' },
                    { value: 'Lecture 2', label: 'Lecture 2' },
                    { value: 'Lecture 3', label: 'Lecture 3' },
                    { value: 'Lecture 4', label: 'Lecture 4' },
                    { value: 'Lab', label: 'Lab' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionOptions();
    }, [classId, subjectId]);
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
                Session Details:
            </Typography>
            
            <FormControl sx={{ minWidth: 200 }}>
                <TextField
                    label="Select Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    disabled={disabled}
                    required
                    InputLabelProps={{
                        shrink: true,
                    }}
                    inputProps={{
                        max: today // Prevent future dates
                    }}
                />
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="session-select-label">Session</InputLabel>
                <Select
                    labelId="session-select-label"
                    id="session-select"
                    value={selectedSession}
                    label="Session"
                    onChange={(e) => onSessionChange(e.target.value)}
                    disabled={disabled || loading}
                    required
                >
                    {loading ? (
                        <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading sessions...
                        </MenuItem>
                    ) : (
                        sessionOptions.map((session) => (
                            <MenuItem key={session.value} value={session.value}>
                                {session.label}
                            </MenuItem>
                        ))
                    )}
                </Select>
            </FormControl>
        </Box>
    );
};

export default SessionSelector;