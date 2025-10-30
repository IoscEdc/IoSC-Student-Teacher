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

            // Directly fetch attendance records instead of summaries
            const recordsUrl = `${process.env.REACT_APP_BASE_URL}/attendance/records`;
            console.log('📤 useStudentAttendanceSimple: Fetching records from:', recordsUrl);
            
            const recordsResponse = await axios.get(recordsUrl, {
                params: {
                    studentId: studentId,
                    limit: 1000,
                    sortBy: 'date',
                    sortOrder: 'desc'
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('📥 useStudentAttendanceSimple: Records response:', recordsResponse.data);

            if (recordsResponse.data.success) {
                const records = recordsResponse.data.data.records || [];
                console.log('📊 useStudentAttendanceSimple: Found', records.length, 'records');

                // Process records to create summary data
                const processedData = processRecordsToSummary(records);
                setAttendanceData(processedData);
                setLastUpdated(new Date());
            } else {
                throw new Error(recordsResponse.data.message || 'Failed to fetch attendance records');
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