import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DirectDOMTest = () => {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (!containerRef.current) return;
        
        // Create test data
        const students = [
            { id: 'student1', name: '21AI001 - John Doe' },
            { id: 'student2', name: '21AI002 - Jane Smith' },
            { id: 'student3', name: '21AI003 - Bob Johnson' }
        ];
        
        // Store attendance state outside React
        const attendanceState = {
            student1: 'present',
            student2: 'absent', 
            student3: 'present'
        };
        
        // Function to update display
        const updateDisplay = () => {
            const summary = { present: 0, absent: 0 };
            Object.values(attendanceState).forEach(status => {
                summary[status]++;
            });
            
            const summaryEl = document.getElementById('dom-summary');
            if (summaryEl) {
                summaryEl.textContent = `Present: ${summary.present}, Absent: ${summary.absent}`;
            }
            
            console.log('📊 DOM Test - Current state:', attendanceState);
            console.log('📊 DOM Test - Summary:', summary);
        };
        
        // Create HTML directly
        const html = `
            <div>
                <h3>Direct DOM Manipulation Test</h3>
                <p id="dom-summary">Present: 2, Absent: 1</p>
                <div style="margin: 20px 0;">
                    ${students.map(student => `
                        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
                            <div style="font-weight: bold; margin-bottom: 10px;">${student.name}</div>
                            <div>
                                <button 
                                    id="present-${student.id}" 
                                    style="margin-right: 10px; padding: 8px 16px; background: ${attendanceState[student.id] === 'present' ? '#4CAF50' : '#fff'}; color: ${attendanceState[student.id] === 'present' ? '#fff' : '#000'}; border: 1px solid #4CAF50; border-radius: 4px; cursor: pointer;"
                                >
                                    Present
                                </button>
                                <button 
                                    id="absent-${student.id}"
                                    style="padding: 8px 16px; background: ${attendanceState[student.id] === 'absent' ? '#F44336' : '#fff'}; color: ${attendanceState[student.id] === 'absent' ? '#fff' : '#000'}; border: 1px solid #F44336; border-radius: 4px; cursor: pointer;"
                                >
                                    Absent
                                </button>
                            </div>
                            <div style="margin-top: 10px; font-size: 14px; color: #666;">
                                Current: <span id="status-${student.id}" style="font-weight: bold; color: ${attendanceState[student.id] === 'present' ? '#4CAF50' : '#F44336'};">${attendanceState[student.id]}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                    <strong>Debug State:</strong>
                    <pre id="debug-state" style="font-size: 12px; margin-top: 10px;">${JSON.stringify(attendanceState, null, 2)}</pre>
                </div>
            </div>
        `;
        
        containerRef.current.innerHTML = html;
        
        // Add event listeners
        students.forEach(student => {
            const presentBtn = document.getElementById(`present-${student.id}`);
            const absentBtn = document.getElementById(`absent-${student.id}`);
            
            if (presentBtn) {
                presentBtn.addEventListener('click', () => {
                    console.log(`🟢 DOM: Setting ${student.id} to PRESENT`);
                    attendanceState[student.id] = 'present';
                    
                    // Update button styles
                    presentBtn.style.background = '#4CAF50';
                    presentBtn.style.color = '#fff';
                    absentBtn.style.background = '#fff';
                    absentBtn.style.color = '#000';
                    
                    // Update status display
                    const statusEl = document.getElementById(`status-${student.id}`);
                    if (statusEl) {
                        statusEl.textContent = 'present';
                        statusEl.style.color = '#4CAF50';
                    }
                    
                    // Update debug display
                    const debugEl = document.getElementById('debug-state');
                    if (debugEl) {
                        debugEl.textContent = JSON.stringify(attendanceState, null, 2);
                    }
                    
                    updateDisplay();
                });
            }
            
            if (absentBtn) {
                absentBtn.addEventListener('click', () => {
                    console.log(`🔴 DOM: Setting ${student.id} to ABSENT`);
                    attendanceState[student.id] = 'absent';
                    
                    // Update button styles
                    absentBtn.style.background = '#F44336';
                    absentBtn.style.color = '#fff';
                    presentBtn.style.background = '#fff';
                    presentBtn.style.color = '#000';
                    
                    // Update status display
                    const statusEl = document.getElementById(`status-${student.id}`);
                    if (statusEl) {
                        statusEl.textContent = 'absent';
                        statusEl.style.color = '#F44336';
                    }
                    
                    // Update debug display
                    const debugEl = document.getElementById('debug-state');
                    if (debugEl) {
                        debugEl.textContent = JSON.stringify(attendanceState, null, 2);
                    }
                    
                    updateDisplay();
                });
            }
        });
        
    }, []);
    
    return (
        <Paper sx={{ p: 3, m: 3 }}>
            <Typography variant="h4" gutterBottom>
                Direct DOM Manipulation Test
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                This bypasses React state entirely and uses direct DOM manipulation.
                If this doesn't work independently, there's a browser or system-level issue.
            </Typography>
            <div ref={containerRef}></div>
        </Paper>
    );
};

export default DirectDOMTest;