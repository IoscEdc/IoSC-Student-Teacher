import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Simplified hook that directly queries attendance records instead of summaries
 */
const useStudentAttendanceSimple = (studentId) => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAttendanceData = async () => {
        if (!studentId) {
            console.log('🚫 useStudentAttendanceSimple: No studentId provided');
            setError('No student ID provided');
            setLoading(false);
            return;
        }

        console.log('🔄 useStudentAttendanceSimple: Fetching data for student:', studentId);

        try {
            setLoading(true);
            setError(null);

            // Fetch attendance summary using simple endpoint
            const recordsUrl = `${process.env.REACT_APP_BASE_URL}/attendance-simple/summary/student/${studentId}`;
            console.log('📤 useStudentAttendanceSimple: Fetching summary from:', recordsUrl);
            console.log('📤 useStudentAttendanceSimple: Using SIMPLE hook for student:', studentId);
            
            const recordsResponse = await axios.get(recordsUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('📥 useStudentAttendanceSimple: Records response:', recordsResponse.data);

            if (recordsResponse.data.success) {
                const summaries = recordsResponse.data.data || [];
                console.log('📊 useStudentAttendanceSimple: Found', summaries.length, 'subject summaries');
                console.log('📊 useStudentAttendanceSimple: Raw summaries:', summaries);
                summaries.forEach((summary, index) => {
                    console.log(`📋 Subject ${index + 1}:`, {
                        name: summary.subjectId?.subName,
                        code: summary.subjectId?.subCode,
                        present: summary.presentCount,
                        total: summary.totalSessions,
                        percentage: summary.attendancePercentage
                    });
                });

                // Convert summary data to the format expected by the dashboard
                const processedData = processSummariesToDashboard(summaries);
                console.log('📊 useStudentAttendanceSimple: Processed data:', processedData);
                setAttendanceData(processedData);
                setLastUpdated(new Date());
            } else {
                throw new Error(recordsResponse.data.message || 'Failed to fetch attendance summaries');
            }
        } catch (err) {
            console.error('❌ useStudentAttendanceSimple: Error:', err);
            console.error('❌ useStudentAttendanceSimple: Error response:', err.response?.data);
            console.error('❌ useStudentAttendanceSimple: Error status:', err.response?.status);
            
            let errorMessage = 'Failed to fetch attendance data';
            if (err.response?.status === 401) {
                errorMessage = 'Authentication failed. Please login again.';
            } else if (err.response?.status === 403) {
                errorMessage = 'Access denied. You may not have permission to view this data.';
            } else if (err.response?.status === 404) {
                errorMessage = 'No attendance data found for this student.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const processRecordsToSummary = (records) => {
        if (!records || records.length === 0) {
            return {
                overallPercentage: 0,
                subjects: [],
                totalSessions: 0,
                totalPresent: 0,
                totalAbsent: 0,
                lastUpdated: null
            };
        }

        // Group records by subject
        const subjectGroups = {};
        records.forEach(record => {
            const subjectId = record.subjectId?._id || record.subjectId;
            const subjectName = record.subjectId?.subName || `Subject ${subjectId}`;
            
            if (!subjectGroups[subjectId]) {
                subjectGroups[subjectId] = {
                    subjectId: subjectId,
                    subject: subjectName,
                    teacher: record.subjectId?.teacher || null,
                    records: []
                };
            }
            subjectGroups[subjectId].records.push(record);
        });

        // Calculate statistics for each subject
        let totalSessions = 0;
        let totalPresent = 0;
        let totalAbsent = 0;

        const subjects = Object.values(subjectGroups).map(group => {
            const subjectRecords = group.records;
            const total = subjectRecords.length;
            const present = subjectRecords.filter(r => r.status === 'present').length;
            const absent = subjectRecords.filter(r => r.status === 'absent').length;
            const late = subjectRecords.filter(r => r.status === 'late').length;
            const excused = subjectRecords.filter(r => r.status === 'excused').length;
            const percentage = total > 0 ? (present / total) * 100 : 0;

            totalSessions += total;
            totalPresent += present;
            totalAbsent += absent;

            return {
                subject: group.subject,
                subjectId: group.subjectId,
                present,
                total,
                percentage,
                absent,
                late,
                excused,
                teacher: group.teacher,
                records: subjectRecords.map(record => ({
                    date: record.date,
                    session: record.session,
                    status: record.status,
                    markedBy: record.markedBy,
                    markedAt: record.markedAt
                }))
            };
        });

        const overallPercentage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

        return {
            overallPercentage,
            subjects,
            totalSessions,
            totalPresent,
            totalAbsent,
            lastUpdated: lastUpdated
        };
    };

    const processSummariesToDashboard = (summaries) => {
        if (!summaries || summaries.length === 0) {
            return {
                overallPercentage: 0,
                subjects: [],
                totalSessions: 0,
                totalPresent: 0,
                totalAbsent: 0,
                lastUpdated: null
            };
        }

        let totalSessions = 0;
        let totalPresent = 0;
        let totalAbsent = 0;
        let lastUpdated = null;

        const subjects = summaries.map(summary => {
            totalSessions += summary.totalSessions || 0;
            totalPresent += summary.presentCount || 0;
            totalAbsent += summary.absentCount || 0;

            return {
                subjectId: summary.subjectId._id,
                subject: summary.subjectId.subName,
                teacher: summary.subjectId.teacher || null,
                present: summary.presentCount || 0,
                total: summary.totalSessions || 0,
                percentage: summary.attendancePercentage || 0,
                absent: summary.absentCount || 0,
                late: summary.lateCount || 0,
                excused: summary.excusedCount || 0,
                records: summary.records || []
            };
        });

        const overallPercentage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

        return {
            overallPercentage,
            subjects,
            totalSessions,
            totalPresent,
            totalAbsent,
            lastUpdated: new Date()
        };
    };

    // Initial fetch
    useEffect(() => {
        fetchAttendanceData();
    }, [studentId]);

    // Manual refresh function
    const refreshAttendance = () => {
        fetchAttendanceData();
    };

    return {
        attendanceData,
        loading,
        error,
        lastUpdated,
        refreshAttendance
    };
};

export default useStudentAttendanceSimple;