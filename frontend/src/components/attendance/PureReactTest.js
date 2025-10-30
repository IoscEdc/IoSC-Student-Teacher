import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Pure React class component to eliminate any hooks issues
class PureReactTest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            students: {
                'student1': 'present',
                'student2': 'absent',
                'student3': 'present'
            }
        };
        
        console.log('🚀 PureReactTest constructor - initial state:', this.state.students);
    }
    
    handleStudentChange = (studentId, status) => {
        console.log(`🔄 Changing ${studentId} to ${status}`);
        this.setState(prevState => {
            const newStudents = {
                ...prevState.students,
                [studentId]: status
            };
            console.log('📊 New state will be:', newStudents);
            return { students: newStudents };
        });
    }
    
    render() {
        const { students } = this.state;
        console.log('🎨 Render - current state:', students);
        
        return (
            <Paper sx={{ p: 3, m: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Pure React Class Component Test
                </Typography>
                
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Present: {Object.values(students).filter(s => s === 'present').length} | 
                    Absent: {Object.values(students).filter(s => s === 'absent').length}
                </Typography>
                
                {Object.entries(students).map(([studentId, status]) => (
                    <Box key={studentId} sx={{ p: 2, mb: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                        <Typography variant="h6">
                            {studentId} - Current: {status}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <button 
                                onClick={() => this.handleStudentChange(studentId, 'present')}
                                style={{ 
                                    padding: '8px 16px',
                                    backgroundColor: status === 'present' ? '#4CAF50' : '#fff',
                                    color: status === 'present' ? '#fff' : '#000',
                                    border: '1px solid #4CAF50',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Present
                            </button>
                            <button 
                                onClick={() => this.handleStudentChange(studentId, 'absent')}
                                style={{ 
                                    padding: '8px 16px',
                                    backgroundColor: status === 'absent' ? '#F44336' : '#fff',
                                    color: status === 'absent' ? '#fff' : '#000',
                                    border: '1px solid #F44336',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Absent
                            </button>
                        </Box>
                    </Box>
                ))}
                
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption">Debug State:</Typography>
                    <pre style={{ fontSize: '12px' }}>
                        {JSON.stringify(students, null, 2)}
                    </pre>
                </Box>
            </Paper>
        );
    }
}

export default PureReactTest;