import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for fetching student attendance data from the new API
 */
const useStudentAttendance = (studentId, subjectId = null) => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAttendanceData = async () => {
        if (!studentId) {
            console.log('🚫 useStudentAttendance: No studentId provided');
            setError('No student ID provided');
            setLoading(false);
            return;
        }

        console.log('🔄 useStudentAttendance: Fetching data for student:', studentId);

        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (subjectId) {
                params.subjectId = subjectId;
            }

            // Fetch attendance summary (using simple endpoint to bypass errors)
            const summaryUrl = `${process.env.REACT_APP_BASE_URL}/attendance-simple/summary/student/${studentId}`;
            console.log('📤 useStudentAttendance: Fetching summary from:', summaryUrl);
            console.log('🔑 useStudentAttendance: Token exists:', !!localStorage.getItem('token'));
            
            const summaryResponse = await axios.get(summaryUrl, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('📥 useStudentAttendance: Summary response:', summaryResponse.data);
            console.log('📥 useStudentAttendance: Response status:', summaryResponse.status);
            console.log('📥 useStudentAttendance: Response success:', summaryResponse.data.success);
            console.log('📥 useStudentAttendance: Response data length:', summaryResponse.data.data?.length);

            if (summaryResponse.data.success) {
                const summaryData = summaryResponse.data.data;
                setAttendanceData(summaryData);

                // Only fetch detailed records if we have summary data
                if (summaryData && Array.isArray(summaryData) && summaryData.length > 0) {
                    // Fetch detailed records for each subject
                    const recordsPromises = summaryData.map(async (summary) => {
                    try {
                        const recordsResponse = await axios.get(
                            `${process.env.REACT_APP_BASE_URL}/attendance/records`,
                            {
                                params: {
                                    studentId: studentId,
                                    subjectId: summary.subjectId._id,
                                    limit: 100,
                                    sortBy: 'date',
                                    sortOrder: 'desc'
                                },
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('token')}`
                                }
                            }
                        );

                        if (recordsResponse.data.success) {
                            return {
                                subjectId: summary.subjectId._id,
                                records: recordsResponse.data.data.records || []
                            };
                        }
                        return { subjectId: summary.subjectId._id, records: [] };
                    } catch (err) {
                        console.error(`Error fetching records for subject ${summary.subjectId._id}:`, err);
                        return { subjectId: summary.subjectId._id, records: [] };
                    }
                });

                    const recordsResults = await Promise.all(recordsPromises);
                    const recordsMap = {};
                    recordsResults.forEach(result => {
                        recordsMap[result.subjectId] = result.records;
                    });
                    setAttendanceRecords(recordsMap);
                } else {
                    // No summary data, set empty records
                    setAttendanceRecords({});
                }

                setLastUpdated(new Date());
            } else {
                throw new Error(summaryResponse.data.message || 'Failed to fetch attendance data');
            }
        } catch (err) {
            console.error('❌ useStudentAttendance: Error fetching student attendance:', err);
            console.error('❌ useStudentAttendance: Error response:', err.response?.data);
            console.error('❌ useStudentAttendance: Error details:', JSON.stringify(err.response?.data, null, 2));
            console.error('❌ useStudentAttendance: Error status:', err.response?.status);
            console.error('❌ useStudentAttendance: Request URL:', `${process.env.REACT_APP_BASE_URL}/attendance/summary/student/${studentId}`);
            console.error('❌ useStudentAttendance: Token present:', !!localStorage.getItem('token'));
            
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

    // Initial fetch
    useEffect(() => {
        fetchAttendanceData();
    }, [studentId, subjectId]);

    // Manual refresh function
    const refreshAttendance = () => {
        fetchAttendanceData();
    };

    // Transform data for compatibility with existing components
    const getTransformedData = () => {
        if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
            // Return empty structure when no data
            return {
                overallPercentage: 0,
                subjects: [],
                totalSessions: 0,
                totalPresent: 0,
                totalAbsent: 0,
                lastUpdated: null
            };
        }

        // Calculate overall statistics from the summaries array
        let totalSessions = 0;
        let totalPresent = 0;
        let totalAbsent = 0;

        const subjects = attendanceData.map(summary => {
            totalSessions += summary.totalSessions || 0;
            totalPresent += summary.presentCount || 0;
            totalAbsent += summary.absentCount || 0;

            const subjectId = summary.subjectId?._id || summary.subjectId;
            const subjectRecords = attendanceRecords[subjectId] || [];

            return {
                subject: summary.subjectId?.subName || 'Unknown Subject',
                subjectId: subjectId,
                present: summary.presentCount || 0,
                total: summary.totalSessions || 0,
                percentage: summary.attendancePercentage || 0,
                absent: summary.absentCount || 0,
                late: summary.lateCount || 0,
                excused: summary.excusedCount || 0,
                teacher: summary.subjectId?.teacher || null,
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

        const transformedData = {
            overallPercentage,
            subjects,
            totalSessions,
            totalPresent,
            totalAbsent,
            lastUpdated: lastUpdated
        };

        return transformedData;
    };

    return {
        attendanceData: getTransformedData(),
        rawData: attendanceData,
        attendanceRecords,
        loading,
        error,
        lastUpdated,
        refreshAttendance
    };
};

export default useStudentAttendance;