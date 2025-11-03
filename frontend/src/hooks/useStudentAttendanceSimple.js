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
            const recordsUrl = `${process.env.REACT_APP_BASE_URL}/attendance/summary/student/${studentId}`;
            console.log('📤 useStudentAttendanceSimple: Fetching summary from:', recordsUrl);
            console.log('📤 useStudentAttendanceSimple: Using SIMPLE hook for student:', studentId);
            
            const recordsResponse = await axios.get(recordsUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('📥 useStudentAttendanceSimple: Records response:', recordsResponse.data);

            if (recordsResponse.data.success) {
                const responseData = recordsResponse.data.data;
                console.log('📊 useStudentAttendanceSimple: Raw data:', responseData);

                // Check if backend already sent transformed data (new format)
                if (responseData && responseData.subjects && Array.isArray(responseData.subjects)) {
                    console.log('✅ useStudentAttendanceSimple: Using pre-transformed data from backend');
                    console.log('📊 useStudentAttendanceSimple: Found', responseData.subjects.length, 'subjects');
                    
                    responseData.subjects.forEach((subject, index) => {
                        console.log(`📋 Subject ${index + 1}:`, {
                            name: subject.subject,
                            present: subject.present,
                            total: subject.total,
                            percentage: subject.percentage
                        });
                    });

                    setAttendanceData(responseData);
                    setLastUpdated(new Date());
                } 
                // Old format - array of summaries (fallback)
                else if (Array.isArray(responseData)) {
                    console.log('⚠️ useStudentAttendanceSimple: Received old format (array), transforming...');
                    console.log('📊 useStudentAttendanceSimple: Found', responseData.length, 'subject summaries');
                    
                    responseData.forEach((summary, index) => {
                        console.log(`📋 Subject ${index + 1}:`, {
                            name: summary.subjectId?.subName,
                            code: summary.subjectId?.subCode,
                            present: summary.presentCount,
                            total: summary.totalSessions,
                            percentage: summary.attendancePercentage
                        });
                    });

                    // Convert summary data to the format expected by the dashboard
                    const processedData = processSummariesToDashboard(responseData);
                    console.log('📊 useStudentAttendanceSimple: Processed data:', processedData);
                    setAttendanceData(processedData);
                    setLastUpdated(new Date());
                } 
                // Empty or invalid data
                else {
                    console.warn('⚠️ useStudentAttendanceSimple: Received empty or invalid data format');
                    setAttendanceData({
                        overallPercentage: 0,
                        subjects: [],
                        totalSessions: 0,
                        totalPresent: 0,
                        totalAbsent: 0
                    });
                    setLastUpdated(new Date());
                }
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

        const subjects = summaries.map(summary => {
            const present = summary.presentCount || 0;
            const absent = summary.absentCount || 0;
            const late = summary.lateCount || 0;
            const excused = summary.excusedCount || 0;
            const total = summary.totalSessions || (present + absent + late + excused);
            const percentage = total > 0 ? (present / total) * 100 : 0;

            totalSessions += total;
            totalPresent += present;
            totalAbsent += absent;

            return {
                subjectId: summary.subjectId?._id || summary.subjectId,
                subject: summary.subjectId?.subName || 'Unknown Subject',
                teacher: summary.subjectId?.teacher ? {
                    id: summary.subjectId.teacher._id,
                    name: summary.subjectId.teacher.name
                } : null,
                present,
                total,
                percentage,
                absent,
                late: late || 0,
                excused: excused || 0,
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